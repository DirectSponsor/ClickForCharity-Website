// Simple ad rotation - cycles through banners on page load
(function() {
    // List of banner images to rotate through
    const banners = [
        'banners/728x90-red.png',
        'banners/728x90-green.png',
        'banners/728x90-blue.png'
    ];
    
    // Get current position from localStorage, default to 0
    let currentIndex = parseInt(localStorage.getItem('ad_rotation_index') || '0');
    
    // Move to next banner
    currentIndex = (currentIndex + 1) % banners.length;
    
    // Save for next time
    localStorage.setItem('ad_rotation_index', currentIndex.toString());
    
    // Get the current banner
    const currentBanner = banners[currentIndex];
    
    // When DOM loads, update all ad images
    document.addEventListener('DOMContentLoaded', function() {
        const adImages = document.querySelectorAll('.ad-banner-img');
        adImages.forEach(function(img) {
            img.src = currentBanner;
        });
    });
})();
