// ===================================
// TIMELINE SCROLL ANIMATION
// Vanilla JS - no jQuery
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const animationElements = document.querySelectorAll('.timeline-movement.anim');

    // Without IntersectionObserver, just show everything
    if (!('IntersectionObserver' in window)) {
        animationElements.forEach(function (el) { el.classList.add('animated'); });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '100px 0px' });

    animationElements.forEach(function (el) { observer.observe(el); });
});
