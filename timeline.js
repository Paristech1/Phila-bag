// ===================================
// TIMELINE SCROLL ANIMATION
// Vanilla JS - no jQuery
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const animationElements = document.querySelectorAll('.timeline-movement.anim');
    const windowHeight = window.innerHeight;

    function checkIfInView() {
        const windowTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowBottom = windowTop + windowHeight;
        const triggerOffset = 100;

        animationElements.forEach(function (el) {
            const rect = el.getBoundingClientRect();
            const elementTop = rect.top + windowTop;
            const elementBottom = elementTop + el.offsetHeight;

            if (elementBottom >= windowTop - triggerOffset && elementTop <= windowBottom + triggerOffset) {
                el.classList.add('animated');
            }
        });
    }

    window.addEventListener('scroll', checkIfInView);
    window.addEventListener('resize', checkIfInView);
    checkIfInView();
});
