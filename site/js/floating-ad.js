(function () {
    // Configuration
    const STORAGE_KEY_TIMER = 'clickforcharity_floating_closed_ts';
    const STORAGE_KEY_ROTATION = 'clickforcharity_floating_rotation_index';
    const HIDE_DURATION = 10 * 60 * 1000; // 10 minutes

    const ads = [
        // Ad 1: LiteBits
        '<iframe src="https://litebits.io/banners/300x250/?ref=J61UMX3M" width="300" height="250" frameborder="0" scrolling="no" style="border: none;"></iframe>',
        // Ad 2: SatsMan
        '<a href="https://satsman.com?ref=andysavage" target="_blank"><img src="banners/army02.gif" alt="SatsMan" style="max-width:300px; height:auto; border:none; display:block;"></a>'
    ];

    function getNextAd() {
        let index = parseInt(localStorage.getItem(STORAGE_KEY_ROTATION) || '0');
        // Initial load should be 0, next should be 1
        // But if we want it to rotate on RELOAD, we should increment first?
        // Or store the one we displayed last time?
        // If we store index=0, next time we read 0, display 0?
        // Let's increment and save for NEXT time.
        // Current display: index % length.
        // Save: (index + 1) % length.

        const currentIndex = index % ads.length;
        const nextIndex = (currentIndex + 1) % ads.length;
        localStorage.setItem(STORAGE_KEY_ROTATION, nextIndex.toString());

        return ads[currentIndex];
    }

    function initFloatingAd() {
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

        // Inject Ad Content
        const contentContainer = adContainer.querySelector('.floating-ad-content');
        if (contentContainer) {
            contentContainer.innerHTML = getNextAd();
        }

        // Show Ad
        adContainer.style.display = 'block';

        // Dynamic Padding
        // Wait for render to ensure dimensions are accurate (images load)
        // With iframe it is fixed size usually. With img it might take time.
        // We can listen for image load or just use requestAnimationFrame loop?
        // simple RAF is okay for now.
        const updatePadding = () => {
            const height = adContainer.offsetHeight;
            const footer = document.querySelector('footer');
            if (footer && height > 0) {
                footer.style.paddingBottom = (height + 30) + 'px';
            }
        };

        requestAnimationFrame(updatePadding);
        // Also update after a short delay for images
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
