document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupScrollAnimations();
    hidePreloader();
});

/* =========================
   THEME TOGGLE
========================= */
function setupTheme() {
    const btn = document.getElementById('themeToggle');
    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
    });
}

/* =========================
   SCROLL ANIMATION
========================= */
function setupScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

/* =========================
   PRELOADER
========================= */
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 500);
}

/* =========================
   MOBILE MENU
========================= */
function toggleMobileMenu() {
    document.getElementById('navWrapper').classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('navWrapper').classList.remove('active');
}

/* =========================
   SCROLL TO TOP
========================= */
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 500) {
        btn.classList.add('show');
    } else {
        btn.classList.remove('show');
    }
});


/* ===============================
   3D TILT EFFECT FOR ABOUT CARDS
================================ */

document.querySelectorAll('.about-premium').forEach(card => {

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / 20);
        const rotateY = ((centerX - x) / 20);

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = "rotateX(0) rotateY(0) scale(1)";
    });

});