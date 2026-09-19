window.addEventListener('load', function () {
  var canvas  = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var section = document.querySelector('.home');
  var W       = section.offsetWidth  || window.innerWidth;
  var H       = section.offsetHeight || window.innerHeight;
  var mobile  = window.innerWidth < 768;

  // ── RENDERER ──────────────────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(W / H < 1 ? 68 : 50, W / H, 0.1, 200);
  camera.position.set(0, 0, 11);

  // ── PALETTE ───────────────────────────────────────────────────────────────
  var OA = new THREE.Color(0xff5500); // brand orange
  var OB = new THREE.Color(0x2255dd); // deep blue

  // ── 1. BACKGROUND STAR FIELD ───────────────────────────────────────────────
  var NUM_BG = mobile ? 700 : 1500;
  var bgPos  = new Float32Array(NUM_BG * 3);
  for (var i = 0; i < NUM_BG; i++) {
    var phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * Math.PI * 2;
    var r   = 6.5 + Math.random() * 6.0;
    bgPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    bgPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    bgPos[i*3+2] = r * Math.cos(phi);
  }
  var bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    size: 0.042, color: 0x445577, transparent: true, opacity: 0.40,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // ── 2. TWO OUTER WIREFRAME SHELLS (different speeds, different axes) ───────
  // Layered depth cue — the brain exists inside a containment field
  var shell1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(5.8, 2),
    new THREE.MeshBasicMaterial({ color: 0x112299, wireframe: true, transparent: true, opacity: 0.065 })
  );
  scene.add(shell1);

  var shell2 = new THREE.Mesh(
    new THREE.OctahedronGeometry(7.4, 2),
    new THREE.MeshBasicMaterial({ color: 0x220055, wireframe: true, transparent: true, opacity: 0.038 })
  );
  scene.add(shell2);

  // ── 3. NEURAL SPHERE NETWORK ───────────────────────────────────────────────
  var SPHERE_R = 3.6;
  var NUM_N    = mobile ? 45 : 80;   // more nodes → denser graph
  var K_NEAR   = 4;                  // K=4 (was 3) → more BFS paths, richer visual
  var SEGS     = 12;                 // smoother packet animation (was 10)
  var VPE      = SEGS * 2;

  // Fibonacci sphere
  var nodes = [];
  var GPHI  = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < NUM_N; i++) {
    var fy = 1 - (i / (NUM_N - 1)) * 2;
    var fr = Math.sqrt(Math.max(0, 1 - fy * fy));
    nodes.push({
      x: fr * Math.cos(GPHI * i) * SPHERE_R,
      y: fy * SPHERE_R,
      z: fr * Math.sin(GPHI * i) * SPHERE_R,
    });
  }

  // Precomputed base colours per node
  var nBR = new Float32Array(NUM_N);
  var nBG = new Float32Array(NUM_N);
  var nBB = new Float32Array(NUM_N);
  for (var i = 0; i < NUM_N; i++) {
    var nt = (nodes[i].y / SPHERE_R + 1) * 0.5;
    nBR[i] = OA.r + (OB.r - OA.r) * nt;
    nBG[i] = OA.g + (OB.g - OA.g) * nt;
    nBB[i] = OA.b + (OB.b - OA.b) * nt;
  }

  // K-nearest edges
  var edges       = [];
  var edgeSet     = new Set();
  var adjList     = [];
  var edgesByNode = []; // edge indices touching each node (for edge-BFS brightening)
  for (var i = 0; i < NUM_N; i++) { adjList.push([]); edgesByNode.push([]); }

  for (var i = 0; i < NUM_N; i++) {
    var dists = [];
    for (var j = 0; j < NUM_N; j++) {
      if (i === j) continue;
      var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dz = nodes[i].z - nodes[j].z;
      dists.push({ j: j, d2: dx*dx + dy*dy + dz*dz });
    }
    dists.sort(function (a, b) { return a.d2 - b.d2; });
    for (var k = 0; k < K_NEAR; k++) {
      var jj = dists[k].j;
      var ek = Math.min(i, jj) + '_' + Math.max(i, jj);
      if (!edgeSet.has(ek)) {
        edgeSet.add(ek);
        var ei = edges.length;
        edges.push({ a: i, b: jj, phase: Math.random(), speed: 0.12 + Math.random() * 0.20 });
        adjList[i].push(jj); adjList[jj].push(i);
        edgesByNode[i].push(ei); edgesByNode[jj].push(ei);
      }
    }
  }
  var NUM_E = edges.length;

  // ── Node geometry: bright core + large dim halo (fake glow without shaders) ─
  var nPos = new Float32Array(NUM_N * 3);
  var nCol = new Float32Array(NUM_N * 3);
  var hCol = new Float32Array(NUM_N * 3); // halo colours (separate, same positions)
  for (var i = 0; i < NUM_N; i++) {
    nPos[i*3] = nodes[i].x; nPos[i*3+1] = nodes[i].y; nPos[i*3+2] = nodes[i].z;
    nCol[i*3] = nBR[i];     nCol[i*3+1] = nBG[i];     nCol[i*3+2] = nBB[i];
    hCol[i*3] = nBR[i]*0.3; hCol[i*3+1] = nBG[i]*0.3; hCol[i*3+2] = nBB[i]*0.3;
  }
  var nGeo     = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  var nColAttr = new THREE.BufferAttribute(nCol, 3);
  nGeo.setAttribute('color', nColAttr);

  var hGeo     = new THREE.BufferGeometry();
  hGeo.setAttribute('position', new THREE.BufferAttribute(nPos.slice(), 3)); // own copy (static)
  var hColAttr = new THREE.BufferAttribute(hCol, 3);
  hGeo.setAttribute('color', hColAttr);

  // ── Edge geometry ──────────────────────────────────────────────────────────
  var ePos  = new Float32Array(NUM_E * VPE * 3);
  var eCol  = new Float32Array(NUM_E * VPE * 3);
  var eTArr = new Float32Array(NUM_E * VPE);
  var eBR   = new Float32Array(NUM_E * VPE);
  var eBG   = new Float32Array(NUM_E * VPE);
  var eBB   = new Float32Array(NUM_E * VPE);

  for (var e = 0; e < NUM_E; e++) {
    var ea = edges[e].a, eb = edges[e].b;
    var ax = nodes[ea].x, ay = nodes[ea].y, az = nodes[ea].z;
    var bx = nodes[eb].x, by = nodes[eb].y, bz = nodes[eb].z;
    for (var s = 0; s < SEGS; s++) {
      var t0 = s / SEGS, t1 = (s + 1) / SEGS;
      var vi0 = e * VPE + s * 2, vi1 = vi0 + 1;
      ePos[vi0*3]   = ax+(bx-ax)*t0; ePos[vi0*3+1] = ay+(by-ay)*t0; ePos[vi0*3+2] = az+(bz-az)*t0;
      ePos[vi1*3]   = ax+(bx-ax)*t1; ePos[vi1*3+1] = ay+(by-ay)*t1; ePos[vi1*3+2] = az+(bz-az)*t1;
      eTArr[vi0] = t0; eTArr[vi1] = t1;
      eBR[vi0] = nBR[ea]+(nBR[eb]-nBR[ea])*t0; eBG[vi0] = nBG[ea]+(nBG[eb]-nBG[ea])*t0; eBB[vi0] = nBB[ea]+(nBB[eb]-nBB[ea])*t0;
      eBR[vi1] = nBR[ea]+(nBR[eb]-nBR[ea])*t1; eBG[vi1] = nBG[ea]+(nBG[eb]-nBG[ea])*t1; eBB[vi1] = nBB[ea]+(nBB[eb]-nBB[ea])*t1;
    }
  }
  var eGeo     = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  var eColAttr = new THREE.BufferAttribute(eCol, 3);
  eGeo.setAttribute('color', eColAttr);

  var netGroup = new THREE.Group();
  // Halo layer (large, dim) drawn first so cores composite on top
  netGroup.add(new THREE.Points(hGeo, new THREE.PointsMaterial({
    size: mobile ? 0.52 : 0.44, vertexColors: true,
    transparent: true, opacity: 0.32, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  // Core layer (small, bright)
  netGroup.add(new THREE.Points(nGeo, new THREE.PointsMaterial({
    size: mobile ? 0.19 : 0.15, vertexColors: true,
    transparent: true, opacity: 1.0, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  // Edges
  netGroup.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
  scene.add(netGroup);

  // ── 4. BFS PULSE SYSTEM ───────────────────────────────────────────────────
  var nPulseT     = new Float32Array(NUM_N).fill(-99);
  var ePulseT     = new Float32Array(NUM_E).fill(-99); // per-edge activation time
  var lastSpikeT  = new Float32Array(NUM_N).fill(0);   // for cold-node auto-spike selection
  var pending     = [];
  var PULSE_DUR   = 1.6;
  var EDGE_PD     = 1.1;
  var nextSpike   = 2.0;

  function queueBFS(startNode, baseTime) {
    var visited = new Set([startNode]);
    var level   = [startNode];
    for (var hop = 0; hop <= 5; hop++) {
      pending.push({ nodes: level.slice(), fireAt: baseTime + hop * 0.18 });
      var next = [];
      level.forEach(function (ni) {
        adjList[ni].forEach(function (nb) {
          if (!visited.has(nb)) { visited.add(nb); next.push(nb); }
        });
      });
      level = next;
      if (!level.length) break;
    }
  }

  function interact(clientX, clientY) {
    var rect = section.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right ||
        clientY < rect.top  || clientY > rect.bottom) return;
    var mx = (clientX / window.innerWidth  - 0.5) * SPHERE_R * 2;
    var my = -(clientY / window.innerHeight - 0.5) * SPHERE_R * 2;
    var ni = 0, nd = Infinity;
    for (var i = 0; i < NUM_N; i++) {
      var d = (nodes[i].x-mx)*(nodes[i].x-mx) + (nodes[i].y-my)*(nodes[i].y-my);
      if (d < nd) { nd = d; ni = i; }
    }
    queueBFS(ni, clock.getElapsedTime());
  }

  window.addEventListener('click', function (e) { interact(e.clientX, e.clientY); });
  window.addEventListener('touchend', function (e) {
    if (e.changedTouches.length) interact(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });

  // ── 5. PARALLAX ───────────────────────────────────────────────────────────
  var tgtX = 0, tgtY = 0, curX = 0, curY = 0;
  window.addEventListener('mousemove', function (e) {
    tgtX =  (e.clientX / window.innerWidth  - 0.5) * 3.0;
    tgtY = -(e.clientY / window.innerHeight - 0.5) * 1.8;
  });
  window.addEventListener('touchmove', function (e) {
    if (!e.touches.length) return;
    tgtX =  (e.touches[0].clientX / window.innerWidth  - 0.5) * 2.4;
    tgtY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 1.5;
  }, { passive: true });

  // ── ANIMATION LOOP ─────────────────────────────────────────────────────────
  var clock = new THREE.Clock();
  var SIG2  = 0.005;

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // Process BFS pulse queue — activate nodes and their adjacent edges
    var still = [];
    for (var p = 0; p < pending.length; p++) {
      if (t >= pending[p].fireAt) {
        pending[p].nodes.forEach(function (ni) {
          nPulseT[ni]    = t;
          lastSpikeT[ni] = t;
          edgesByNode[ni].forEach(function (ei) { ePulseT[ei] = t; });
        });
      } else {
        still.push(pending[p]);
      }
    }
    pending = still;

    // Auto-spike: prefer the coldest node (longest since last activation)
    // so activity cycles evenly across the whole sphere rather than clustering
    if (t > nextSpike) {
      nextSpike = t + 1.8 + Math.random() * 2.2;
      var coldIdx = 0, coldVal = lastSpikeT[0];
      for (var i = 1; i < NUM_N; i++) {
        if (lastSpikeT[i] < coldVal) { coldVal = lastSpikeT[i]; coldIdx = i; }
      }
      queueBFS(Math.random() < 0.65 ? coldIdx : Math.floor(Math.random() * NUM_N), t);
    }

    // Rotation — network auto-spin + mouse tilt; shells rotate independently
    curX += (tgtX - curX) * 0.04;
    curY += (tgtY - curY) * 0.04;
    netGroup.rotation.y  = t * 0.06  + curX * 0.06;
    netGroup.rotation.x  = t * 0.022 + curY * 0.045;
    shell1.rotation.y = t * 0.036;   shell1.rotation.z = t * 0.013;
    shell2.rotation.y = -t * 0.020;  shell2.rotation.x = t * 0.009;

    // ── Edge colours ──────────────────────────────────────────────────────
    var BASE = 0.06;
    for (var e = 0; e < NUM_E; e++) {
      var ed    = edges[e];
      var p1    = (t * ed.speed + ed.phase) % 1.0;
      var p2    = (t * ed.speed * 0.55 + ed.phase + 0.5) % 1.0;
      var eAge  = t - ePulseT[e];
      // Edge flares when a connected node fires
      var eBoost = (eAge >= 0 && eAge < EDGE_PD) ? (1.0 + 1.8 * Math.exp(-eAge * 4.5)) : 1.0;
      var vS = e * VPE, vE = vS + VPE;
      for (var vi = vS; vi < vE; vi++) {
        var tv = eTArr[vi];
        var g1 = tv - p1, g2 = tv - p2;
        var br = (BASE + 0.88 * Math.exp(-g1*g1/SIG2) + 0.38 * Math.exp(-g2*g2/SIG2)) * eBoost;
        eCol[vi*3]   = Math.min(eBR[vi] * br * 1.7, 1.0);
        eCol[vi*3+1] = Math.min(eBG[vi] * br * 1.7, 1.0);
        eCol[vi*3+2] = Math.min(eBB[vi] * br * 1.7, 1.0);
      }
    }
    eColAttr.needsUpdate = true;

    // ── Node colours (core + halo) ────────────────────────────────────────
    for (var i = 0; i < NUM_N; i++) {
      var breathe = 0.60 + 0.40 * Math.sin(t * 2.2 + i * 0.9);
      var pAge    = t - nPulseT[i];
      // On fire: flash to warm white-gold then decay back to brand colour
      var fr = nBR[i], fg = nBG[i], fb = nBB[i], pB = 1.0;
      if (pAge >= 0 && pAge < PULSE_DUR) {
        pB = 1.0 + 3.8 * Math.exp(-pAge * 4.8);
        var ft = Math.max(0, 1.0 - pAge * 2.8);     // flash blend factor 1→0
        fr = nBR[i] + (1.00 - nBR[i]) * ft;
        fg = nBG[i] + (0.82 - nBG[i]) * ft;         // slight gold tint
        fb = nBB[i] + (0.18 - nBB[i]) * ft;
      }
      var brt = breathe * pB;
      nCol[i*3]   = Math.min(fr * brt, 1.0);
      nCol[i*3+1] = Math.min(fg * brt, 1.0);
      nCol[i*3+2] = Math.min(fb * brt, 1.0);
      // Halo: same colour tint, lower opacity, never exceeds core brightness
      var hb = breathe * (pAge >= 0 && pAge < PULSE_DUR ? (1.0 + 1.2 * Math.exp(-pAge * 3.5)) : 1.0);
      hCol[i*3]   = Math.min(fr * hb * 0.38, 1.0);
      hCol[i*3+1] = Math.min(fg * hb * 0.38, 1.0);
      hCol[i*3+2] = Math.min(fb * hb * 0.38, 1.0);
    }
    nColAttr.needsUpdate = true;
    hColAttr.needsUpdate = true;

    // ── Camera: parallax + gentle drift + slow orbit ───────────────────────
    // Orbit traces a small circle with period ~5 min — just enough so the
    // sphere never looks identical twice, without any distracting spin.
    var ox = Math.sin(t * 0.020) * 1.0;
    var oz = Math.cos(t * 0.020) * 1.0;
    camera.position.x = curX + Math.sin(t * 0.055) * 0.60 + ox;
    camera.position.y = curY + Math.sin(t * 0.044) * 0.35;
    camera.position.z = 11   + Math.sin(t * 0.038) * 0.50 + oz;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ── RESIZE ─────────────────────────────────────────────────────────────────
  window.addEventListener('resize', function () {
    W = section.offsetWidth  || window.innerWidth;
    H = section.offsetHeight || window.innerHeight;
    var ar = W / H;
    camera.fov    = ar < 1 ? 68 : 50;
    camera.aspect = ar;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
});
