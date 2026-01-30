// Simple ad rotation - cycles through banner images
(function() {
    // List of banner HTML snippets to rotate through
    const ads = [
        '<img src="banner-placeholders/728x90-red.png" width="728" height="90" style="max-width:100%;height:auto;" alt="Advertisement">',
        '<img src="banner-placeholders/728x90-green.png" width="728" height="90" style="max-width:100%;height:auto;" alt="Advertisement">',
        '<img src="banner-placeholders/728x90-blue.png" width="728" height="90" style="max-width:100%;height:auto;" alt="Advertisement">'
    ];
    
    // Get current position from localStorage, default to 0
    let currentIndex = parseInt(localStorage.getItem('ad_rotation_index') || '0');
    
    // Move to next ad
    currentIndex = (currentIndex + 1) % ads.length;
    
    // Save for next time
    localStorage.setItem('ad_rotation_index', currentIndex.toString());
    
    // Get the current ad HTML
    const currentAd = ads[currentIndex];
    
    // When DOM loads, insert ad into container
    document.addEventListener('DOMContentLoaded', function() {
        const adContainer = document.getElementById('ad-banner');
        if (adContainer) {
            adContainer.innerHTML = currentAd;
        }
    });
})();
