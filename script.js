// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileMenuToggle.addEventListener('click', () => {
        const open = navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active', open);
        mobileMenuToggle.setAttribute('aria-expanded', String(open));
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (!navMenu || !mobileMenuToggle) return;
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    });
});

// ===================================
// OPTIMIZED SCROLL HANDLER
// ===================================

const navbar = document.getElementById('navbar');

// On the homepage, highlight the nav link for the section being viewed.
// Other pages keep the active link set in their HTML.
const sectionLinks = {
    home: 'index.html',
    about: 'about.html',
    'why-it-matters': 'why-it-matters.html',
    news: 'news.html',
    contact: 'contact.html'
};
const homeSections = document.getElementById('home')
    ? [...document.querySelectorAll('section[id]')].filter(section => sectionLinks[section.id])
    : [];
let ticking = false;

function updateScrollState() {
    const scrollY = window.pageYOffset;

    // Navbar Scroll Effect
    if (navbar) navbar.classList.toggle('scrolled', scrollY > 100);

    if (homeSections.length) {
        let current = homeSections[0].id;
        homeSections.forEach(section => {
            if (scrollY >= section.offsetTop - 100) current = section.id;
        });
        // Near the bottom of the page, activate the last section
        if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50) {
            current = homeSections[homeSections.length - 1].id;
        }
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === sectionLinks[current]);
        });
    }

    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
    }
}, { passive: true });

// Initial call to set state on page load
updateScrollState();

// ===================================
// SOCIAL MEDIA CAROUSEL
// ===================================

const carouselTrack = document.querySelector('.social-carousel-track');
const carouselScroller = document.querySelector('.social-carousel');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (carouselTrack && carouselScroller && prevBtn && nextBtn) {
    const cards = document.querySelectorAll('.social-post-card');
    let currentIndex = 0;
    let autoScrollInterval;
    let carouselVisible = false;

    function isMobileLayout() {
        return window.innerWidth <= 768;
    }

    // Must match the CSS: one card per view at <=768px, three above
    function getCardsPerView() {
        return isMobileLayout() ? 1 : 3;
    }

    function updateCarousel() {
        if (!cards.length) return;
        if (isMobileLayout()) {
            // Drive the CSS scroll container
            carouselTrack.style.transform = '';
            const cardWidth = carouselScroller.clientWidth;
            carouselScroller.scrollTo({ left: currentIndex * cardWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        } else {
            const cardWidth = cards[0].offsetWidth;
            const gap = 32;
            carouselTrack.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
        }
    }

    function nextSlide() {
        const maxIndex = Math.max(0, cards.length - getCardsPerView());
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        updateCarousel();
    }

    function prevSlide() {
        const maxIndex = Math.max(0, cards.length - getCardsPerView());
        currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        updateCarousel();
    }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoScroll(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoScroll(); });

    // Only auto-advance while the carousel is on screen and the tab is visible
    function startAutoScroll() {
        clearInterval(autoScrollInterval);
        if (prefersReducedMotion || !carouselVisible || document.hidden) return;
        autoScrollInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoScroll() {
        startAutoScroll();
    }

    document.addEventListener('visibilitychange', startAutoScroll);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            carouselVisible = entries[0].isIntersecting;
            startAutoScroll();
        }).observe(carouselScroller);
    } else {
        carouselVisible = true;
    }

    // Mobile browsers fire resize when the address bar shows/hides while scrolling;
    // only reset when the width actually changes
    let resizeTimer;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { currentIndex = 0; updateCarousel(); }, 250);
    });

    // Sync currentIndex when user swipes natively on mobile
    carouselScroller.addEventListener('scrollend', () => {
        if (isMobileLayout()) {
            currentIndex = Math.round(carouselScroller.scrollLeft / carouselScroller.clientWidth);
        }
    });

    updateCarousel();
    startAutoScroll();
}

// ===================================
// LAZY-LOAD SOCIAL EMBED SDKS
// ===================================

// The Facebook, Instagram and TikTok SDKs are large; fetch them only when the
// carousel gets close to the viewport instead of competing with the page load.
if (carouselScroller) {
    const embedScripts = [
        { src: 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0', crossOrigin: 'anonymous' },
        { src: 'https://www.instagram.com/embed.js' },
        { src: 'https://www.tiktok.com/embed.js' }
    ];
    let embedsLoaded = false;

    function loadEmbeds() {
        if (embedsLoaded) return;
        embedsLoaded = true;
        embedScripts.forEach(({ src, crossOrigin }) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            if (crossOrigin) script.crossOrigin = crossOrigin;
            document.body.appendChild(script);
        });
    }

    if ('IntersectionObserver' in window) {
        const embedObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                embedObserver.disconnect();
                loadEmbeds();
            }
        }, { rootMargin: '600px 0px' });
        embedObserver.observe(carouselScroller);
    } else {
        window.addEventListener('load', loadEmbeds);
    }
}

// ===================================
// CONTACT FORMS (Netlify)
// ===================================

document.querySelectorAll('form.contact-form[data-netlify]').forEach(form => {
    const success = document.getElementById(form.dataset.success);
    const submitButton = form.querySelector('[type="submit"]');
    const error = document.createElement('p');
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    error.innerHTML = 'Sorry, your message could not be sent. Please try again or email us at <a href="mailto:philabagnp@gmail.com">philabagnp@gmail.com</a>.';
    form.appendChild(error);

    form.addEventListener('submit', e => {
        e.preventDefault();
        error.hidden = true;
        if (submitButton) submitButton.disabled = true;

        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form)).toString()
        })
            .then(response => {
                if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);
                form.style.display = 'none';
                if (success) success.style.display = 'block';
            })
            .catch(() => {
                error.hidden = false;
            })
            .finally(() => {
                if (submitButton) submitButton.disabled = false;
            });
    });
});

// ===================================
// CONSOLE MESSAGE
// ===================================

console.log('%c PhilaBag ', 'background: #2d5245; color: #fff; font-size: 20px; padding: 10px; font-weight: bold;');
console.log('%c Building Stronger Blocks, Together ', 'background: #e8dcc4; color: #2d5245; font-size: 14px; padding: 5px;');
