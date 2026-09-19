


// Sticky Navbar
    let header = document.querySelector('header');
    let menu = document.querySelector('#menu-icon');
    let navbar = document.querySelector('.navbar');
     
     
    window.addEventListener('scroll', () => {
        header.classList.toggle('shadow', window.scrollY > 0);
        navbar.classList.remove('active');
    });

    menu.onclick = () => {
        navbar.classList.toggle('active');
    }
     
    // Dark Mode
    let darkmode = document.querySelector('#darkmode');
     
    darkmode.onclick = () => {
        if(darkmode.classList.contains('bx-moon')){
            darkmode.classList.replace('bx-moon','bx-sun');
            document.body.classList.add('active');
        }else{
            darkmode.classList.replace('bx-sun','bx-moon');
            document.body.classList.remove('active');
        }
    }

    //typing animation 
var typed = new Typed(".typing",{
    strings: ["Web Dev...","Software Dev...","Graphic Design", "Mobile App Dev...", "DB Admin...","UI / UX Design", "Programming"],
    typeSpeed: 100,
    backSpeed: 60,
    loop: true
});
var typed = new Typed(".typing-2",{
    strings: ["Web Developer", "Mobile App Developer", "Programmer", "DataBase Administrator", "IT specialist", "Graphics Designer"],
    typeSpeed: 100,
    backSpeed: 60,
    loop: true
});


////tabs///////
    var tablinks = document.getElementsByClassName("tab-links");
    var tabcontents = document.getElementsByClassName("tab-contents");

    function opentab(tabname){
        for(tablink of tablinks){
            tablink.classList.remove("active-link");
        }
        for(tabcontent of tabcontents){
            tabcontent.classList.remove("active-tab");
        }
        event.currentTarget.classList.add("active-link");
        document.getElementById(tabname).classList.add("active-tab");
    }


// Infini card — 3-D tilt on hover
(function () {
    const card = document.querySelector('.pf-infini');
    if (!card || typeof VanillaTilt === 'undefined') return;
    VanillaTilt.init(card, {
        max: 7,
        speed: 400,
        glare: true,
        'max-glare': 0.16,
        perspective: 950,
        scale: 1.02,
    });
})();

// Budget Tracker card — 3-D tilt on hover
(function () {
    const card = document.querySelector('.pf-budget');
    if (!card || typeof VanillaTilt === 'undefined') return;
    VanillaTilt.init(card, {
        max: 7,
        speed: 400,
        glare: true,
        'max-glare': 0.14,
        perspective: 950,
        scale: 1.02,
    });
})();

// Snapthread featured card — 3-D tilt on hover
(function () {
    const card = document.querySelector('.pf-snapthread');
    if (!card || typeof VanillaTilt === 'undefined') return;
    VanillaTilt.init(card, {
        max: 8,
        speed: 400,
        glare: true,
        'max-glare': 0.18,
        perspective: 900,
        scale: 1.03,
    });
})();

// DoseMate card — 3-D tilt on hover
(function () {
    const card = document.querySelector('.pf-dosemate');
    if (!card || typeof VanillaTilt === 'undefined') return;
    VanillaTilt.init(card, {
        max: 6,
        speed: 400,
        glare: true,
        'max-glare': 0.12,
        perspective: 1000,
        scale: 1.02,
    });
})();

// Portfolio filter
(function () {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.portfolio-card[data-category]');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            cards.forEach(card => {
                const match = filter === 'all' || card.dataset.category === filter;
                card.classList.remove('pf-fade-in');
                if (match) {
                    card.classList.remove('pf-hidden');
                    void card.offsetWidth; // reflow to re-trigger animation
                    card.classList.add('pf-fade-in');
                } else {
                    card.classList.add('pf-hidden');
                }
            });
        });
    });
})();

       // <!-- tilt js effect starts -->
VanillaTilt.init(document.querySelectorAll(".tilt"), {
    max: 15,
});
// <!-- tilt js effect ends -->


// pre loader start
// function loader() {
//     document.querySelector('.loader-container').classList.add('fade-out');
// }
// function fadeOut() {
//     setInterval(loader, 500);
// }
// window.onload = fadeOut;
// pre loader end


    /* ScrollReveal replaced by GSAP ScrollTrigger in js/cinematic.js */



    //  ----------------GOOGLE-SHEET JS SCRIPT-------------- -->
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxeyKJ4Vx-tECIz_DZCCC5E2nLlkDcnPnvakVUHNP92jhvjp8KUiOBVbK8x2XaFJ2YotQ/exec'
    const form = document.forms['submit-to-google-sheet']
    const msg = document.getElementById("msg")

    if (form) form.addEventListener('submit', e => {
      e.preventDefault()
      fetch(scriptURL, { method: 'POST', body: new FormData(form)})
        // .then(response => console.log('Success!', response))
        .then(response => {
            msg.innerHTML = "Message Sent Successfully"
            setTimeout(function(){
                msg.innerHTML = ""
            },1000)
            form.reset()
        })
        .catch(error => console.error('Error!', error.message))
    })
