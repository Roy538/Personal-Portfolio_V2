const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = windows.innerHeight;

let particlesArray;

// get mouse position
let mouse = {
  x: null,
  y: null,
  radius: (canvas.height/80) * (canvas.width/80)
}

window.addEventListener('mousemove',
  function(event){
    mouse.x = event.x;
    mouse.y = event.y;
  }
);

//create particle
class Particle {
  constructor(x, y, directionX, directionY, size, color) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.size = size;
    this.color = color;
  }
  // method to draw individual particle
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    // ctx.fillStyle = '#8C5523';
    ctx.fillStyle = '#28A072FF';
    ctx.fill();
  }
  // check particle position, check mouse position, move the particle, draw the particle
  update() {
    // check if particle is stil wihin canvas
    if (this.x > canvas.width || this.x < 0) {
      this.directionX = -this.directionX;
    }
    if (this.y > canvas.height || this.y < 0) {
      this.directionY = -this.directionY;
    }

    // check collission detection - mouse position / particle position
    // let dx = mouse.x - this.x;
    // let dy = mouse.y - this.y;
    // let distance = Math.sqrt(dx*dy + dy*dy);
    // if (distance < mouse.radius + this.size){
      // if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
        this.x +=10;
      }
      if (mouse.x > this.x && this.x > this.size * 10) {
        this.x -= 10; 
      }
      if (mouse.y < this.y && this.y < canvas.height - this.size * 10){
        this.y += 10;
      }
      if (mouse.y > this.y && this.y > this.size * 10){
        this.y -=10;
      }
    }
    // move particle
    this.x += this.directionX;
    this.y += this.directionY;
    // draw particle
    this.draw();

  }
}

// create particle array
function init() {
  particlesArray = [];
  let numberOfParticles = (canvas.height * canvas.width) / 9000;
  for (let i = 0; i < numberOfParticles; i++) {
    let size = (Math.random() * 5) + 1;
    let x = (Math.random() * ((innerWidth - size * 2) - (size * 2))+ size * 2);
    let y = (Math.random() * ((innerHeight - size * 2) - (size * 2))+ size * 2);
    let directionX = (Math.random() * 5) - 2.5;
    let directionY = (Math.random() * 5) - 2.5;
    let color = '#8C5523';

    particlesArray.push(new particlesArray(x, y, directionY, size, color));

  }
}

// check if particles are close enough to draw line between them
function connect(){
  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      let distance = ((particlesArray[a].x - particlesArray[b].x)
        * (particlesArray[a].x - particlesArray[b].x))
        + ((particlesArray[a].y - particlesArray[b].y)
        (particlesArray[a].y - particlesArray[b].y));
        if (distance < (canvas.width/7) * (canvas.height/7)) {
          ctx.strokeStyle = 'rgba(140,85,31,1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
    }
  }
}

//animation loop
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0,0,innerWidth, innerHeight);

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
  }
  connect();
}
// resize event
window.addEventListener('resize',
  function(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    mouse.radius = ((canvas.height/80) * (canvas.height/80));
    init();
  }
)


init();
animate();



//FORM
// document.getElementById("contactForm").addEventListener("submit", function(event) {
//   let isValid = true;
//   let name = document.getElementById("name");
//   let email = document.getElementById("email");
//   let message = document.getElementById("message");
  
//   let nameError = document.getElementById("nameError");
//   let emailError = document.getElementById("emailError");
//   let messageError = document.getElementById("messageError");
  
//   // Reset errors
//   nameError.style.display = "none";
//   nameError.style.opacity = "0";
//   emailError.style.display = "none";
//   emailError.style.opacity = "0";
//   messageError.style.display = "none";
//   messageError.style.opacity = "0";
  
//   if (name.value.trim() === "") {
//       nameError.style.display = "block";
//       setTimeout(() => nameError.style.opacity = "1", 10);
//       isValid = false;
//   }
  
//   let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailPattern.test(email.value.trim())) {
//       emailError.style.display = "block";
//       setTimeout(() => emailError.style.opacity = "1", 10);
//       isValid = false;
//   }
  
//   if (message.value.trim() === "") {
//       messageError.style.display = "block";
//       setTimeout(() => messageError.style.opacity = "1", 10);
//       isValid = false;
//   }
  
//   if (!isValid) {
//       event.preventDefault();
//   } else {
//       alert("Form submitted successfully!");
//       document.getElementById("contactForm").reset();
//   }
// });

