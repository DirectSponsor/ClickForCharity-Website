(function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('site-navigation');
    const overlay = document.querySelector('[data-menu-overlay]');
    const menuTargets = document.querySelectorAll('[data-menu-target]');

    if (!menuToggle || !sidebar) {
        return;
    }

    const closeMenu = () => {
        document.body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        document.body.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
    };

    menuToggle.addEventListener('click', () => {
        const isOpen = document.body.classList.contains('menu-open');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    menuTargets.forEach(target => {
        target.addEventListener('click', (event) => {
            if (!document.body.classList.contains('menu-open')) return;

            const closeOnClick = event.target.closest('a, button, .btn');
            if (closeOnClick) {
                closeMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 640) {
            closeMenu();
        }
    });
})();
