// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    });
});

// ===================================
// NAVBAR SCROLL EFFECT
// ===================================

// ===================================
// OPTIMIZED SCROLL HANDLER
// ===================================

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
let lastScrollTop = 0;
let ticking = false;

function updateScrollState() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Navbar Scroll Effect
    if (scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Active Navigation Highlighting
    let currentSection = '';
    sections.forEach((section, index) => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        // Check if we're in this section
        // For the last section, also check if we're near the bottom of the page
        const isLastSection = index === sections.length - 1;
        const isInSection = scrollY >= sectionTop && (isLastSection ? scrollY < sectionTop + sectionHeight + 200 : scrollY < sectionTop + sectionHeight);

        if (isInSection && navLink) {
            currentSection = sectionId;
        }
    });

    // Update active state for all nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (currentSection && link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });

    // If we're near the bottom of the page, activate the last section
    if (scrollY + windowHeight >= documentHeight - 50) {
        const lastSection = sections[sections.length - 1];
        if (lastSection) {
            // Optionally update currentSection here if logic requires
        }
    }

    // Update active nav link (Legacy support if needed or additional logic)
    if (currentSection) {
        // Special case: if section is "news" and we're on homepage, check for news.html link
        if (currentSection === 'news') {
            const isHomePage = window.location.pathname.includes('index.html') || 
                              window.location.pathname === '/' || 
                              window.location.pathname.endsWith('/');
            if (isHomePage) {
                const newsLink = document.querySelector(`.nav-link[href="news.html"]`);
                if (newsLink) newsLink.classList.add('active');
            }
        }
    }

    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
    }
});

// Initial call to set active state on page load
updateScrollState();

// ===================================
// SOCIAL MEDIA CAROUSEL
// ===================================

const carouselTrack = document.querySelector('.social-carousel-track');
const carouselScroller = document.querySelector('.social-carousel');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');

if (carouselTrack && carouselScroller && prevBtn && nextBtn) {
    const cards = document.querySelectorAll('.social-post-card');
    let currentIndex = 0;
    let autoScrollInterval;

    function isMobileLayout() {
        return window.innerWidth <= 768;
    }

    function getCardsPerView() {
        const width = window.innerWidth;
        if (width <= 640) return 1;
        if (width <= 968) return 2;
        return 3;
    }

    function updateCarousel() {
        if (!cards.length) return;
        if (isMobileLayout()) {
            // Drive the CSS scroll container
            const cardWidth = carouselScroller.clientWidth;
            carouselScroller.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
        } else {
            const cardWidth = cards[0].offsetWidth;
            const gap = 32;
            carouselTrack.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
        }
    }

    function nextSlide() {
        const maxIndex = cards.length - getCardsPerView();
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        updateCarousel();
    }

    function prevSlide() {
        const maxIndex = cards.length - getCardsPerView();
        currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        updateCarousel();
    }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoScroll(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoScroll(); });

    function startAutoScroll() {
        autoScrollInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
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
// LOADING ANIMATION
// ===================================

window.addEventListener('load', () => {
    // Firefox fix: set transition BEFORE opacity so Firefox animates correctly.
    // Double-rAF ensures the browser commits one paint before triggering the fade.
    document.body.style.transition = 'opacity 0.5s ease-in';
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });
});

// ===================================
// CONSOLE MESSAGE
// ===================================

console.log('%c PhilaBag ', 'background: #2d5245; color: #fff; font-size: 20px; padding: 10px; font-weight: bold;');
console.log('%c Building Stronger Blocks, Together ', 'background: #e8dcc4; color: #2d5245; font-size: 14px; padding: 5px;');