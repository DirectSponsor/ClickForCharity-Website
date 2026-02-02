// Banner Ad Rotation System
// Rotates through ads from text files, responsive to screen size

(function () {
    if (window.BannerRotateInitialized) return;
    window.BannerRotateInitialized = true;

    const DESKTOP_BREAKPOINT = 768;
    const DESKTOP_ADS_FILE = 'data/ads-desktop.txt';
    const MOBILE_ADS_FILE = 'data/ads-mobile.txt';

    let currentAds = [];
    let currentSize = null;

    // Load ads from file
    async function loadAds() {
        const adsFile = DESKTOP_ADS_FILE;

        // Prevent redundant loading if already loaded
        if (currentAds.length > 0) {
            return currentAds;
        }

        try {
            const response = await fetch(`${adsFile}?t=${Date.now()}`);
            if (!response.ok) {
                console.error('Failed to load ads:', response.status);
                return [];
            }
            const text = await response.text();
            currentAds = parseAds(text);
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
        const container = document.getElementById('ad-banner');
        if (!container) return;

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

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        displayAd();
    });
})();
