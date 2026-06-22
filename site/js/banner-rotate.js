// Banner Ad Rotation System
// Rotates through ads from text files, responsive to screen size

(function () {
    if (window.BannerRotateInitialized) return;
    window.BannerRotateInitialized = true;

    const DESKTOP_BREAKPOINT = 768;
    const ADS_API = '/api/sponsor-list.php?type=desktop';
    const STORAGE_KEY_DISMISSED = 'clickforcharity_banner_closed_ts';
    const HIDE_DURATION = 60 * 60 * 1000; // 1 hour

    let currentAds = [];
    let currentSize = null;

    // Load ads from API
    async function loadAds() {
        // Prevent redundant loading if already loaded
        if (currentAds.length > 0) {
            return currentAds;
        }

        try {
            const response = await fetch(`${ADS_API}&t=${Date.now()}`);
            if (!response.ok) {
                console.error('Failed to load ads:', response.status);
                return [];
            }
            const data = await response.json();
            if (data.success && data.ads) {
                currentAds = data.ads;
            }
            return currentAds;
        } catch (error) {
            console.error('Error loading ads:', error);
            return [];
        }
    }

    // Get next ad index (sequential rotation)
    function getStorageKey() {
        return 'ad_rotation_desktop';
    }

    function parseAds(text) {
        return text.split('---').map(ad => ad.trim()).filter(ad => ad.length > 0);
    }

    function getNextAdIndex(adsCount) {
        const storageKey = getStorageKey();
        let index = parseInt(localStorage.getItem(storageKey) || '0');

        // Move to next ad
        index = (index + 1) % adsCount;

        // Save for next time
        localStorage.setItem(storageKey, index.toString());

        return index;
    }

    // Display the current ad
    async function displayAd() {
        const wrap = document.getElementById('ad-banner-wrap');
        const container = document.getElementById('ad-banner');
        if (!container) return;

        // Check if dismissed
        const closedTs = localStorage.getItem(STORAGE_KEY_DISMISSED);
        if (closedTs && (Date.now() - parseInt(closedTs, 10)) < HIDE_DURATION) {
            if (wrap) wrap.style.display = 'none';
            return;
        }

        const ads = await loadAds();
        if (ads.length === 0) {
            container.innerHTML = '';
            return;
        }

        const index = getNextAdIndex(ads.length);
        const adHtml = ads[index];

        // Clear container
        container.innerHTML = '';

        // Check if ad contains script tag
        if (adHtml.includes('<script')) {
            // Parse and execute script tags properly
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = adHtml;

            // Move all nodes to container, handling scripts specially
            Array.from(tempDiv.childNodes).forEach(node => {
                if (node.tagName === 'SCRIPT') {
                    // Create new script element to ensure execution
                    const script = document.createElement('script');
                    Array.from(node.attributes).forEach(attr => {
                        script.setAttribute(attr.name, attr.value);
                    });
                    script.textContent = node.textContent;
                    container.appendChild(script);
                } else {
                    container.appendChild(node.cloneNode(true));
                }
            });
        } else {
            // Simple HTML without scripts
            container.innerHTML = adHtml;
        }
    }

    window.closeBannerAd = function () {
        const wrap = document.getElementById('ad-banner-wrap');
        if (wrap) wrap.style.display = 'none';
        localStorage.setItem(STORAGE_KEY_DISMISSED, Date.now().toString());
    };

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        displayAd();
    });
})();
