(function () {
    // Configuration
    const STORAGE_KEY_TIMER = 'clickforcharity_floating_closed_ts';
    const STORAGE_KEY_ROTATION = 'clickforcharity_floating_rotation_index';
    const HIDE_DURATION = 10 * 60 * 1000; // 10 minutes
    const ADS_API = '/api/get-banner-ads.php?type=floating';

    async function loadAds() {
        try {
            const response = await fetch(`${ADS_API}&t=${Date.now()}`);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.success && data.ads) ? data.ads : [];
        } catch (e) {
            console.error('Failed to load floating ads', e);
            return [];
        }
    }

    async function initFloatingAd() {
        const adContainer = document.getElementById('floating-ad');
        if (!adContainer) return;

        // Timer Check
        const closedTs = localStorage.getItem(STORAGE_KEY_TIMER);
        if (closedTs) {
            const timeSinceClose = Date.now() - parseInt(closedTs, 10);
            if (timeSinceClose < HIDE_DURATION) {
                return; // Keep hidden
            }
        }

        const ads = await loadAds();
        if (ads.length === 0) return;

        // Rotation Logic
        let index = parseInt(localStorage.getItem(STORAGE_KEY_ROTATION) || '0');
        const currentIndex = index % ads.length;
        const nextIndex = (currentIndex + 1) % ads.length;
        localStorage.setItem(STORAGE_KEY_ROTATION, nextIndex.toString());

        const adContent = ads[currentIndex];

        // Inject Ad Content
        const contentContainer = adContainer.querySelector('.floating-ad-content');
        if (contentContainer) {
            contentContainer.innerHTML = adContent;
        }

        // Show Ad
        adContainer.style.display = 'block';

        // Dynamic Padding
        const updatePadding = () => {
            const height = adContainer.offsetHeight;
            const footer = document.querySelector('footer');
            if (footer && height > 0) {
                footer.style.paddingBottom = (height + 30) + 'px';
            }
        };

        requestAnimationFrame(updatePadding);
        setTimeout(updatePadding, 500);
        setTimeout(updatePadding, 2000);
    }

    window.closeFloatingAd = function () {
        const adContainer = document.getElementById('floating-ad');
        if (adContainer) {
            adContainer.style.display = 'none';
            localStorage.setItem(STORAGE_KEY_TIMER, Date.now().toString());
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingAd);
    } else {
        initFloatingAd();
    }
})();
