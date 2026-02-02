// ClickForCharity Static Ad Rotation System
// Sequential rotation for A-ads compliance and advertiser satisfaction

class AdRotationSystem {
    constructor() {
        this.slots = {
            'header-desktop': { file: 'data/ads-header-728x90.txt', position: 0 },
            'header-mobile': { file: 'data/ads-header-320x50.txt', position: 0 },
            'content-square': { file: 'data/ads-content-300x250.txt', position: 0 }
        };
        
        console.log('🎯 Ad Rotation System initialized');
    }
    
    // Load ads from text file
    async loadAds(slotName) {
        const slot = this.slots[slotName];
        if (!slot) {
            console.warn(`⚠️ Unknown slot: ${slotName}`);
            return [];
        }
        
        console.log(`📂 Loading ads from: ${slot.file}`);
        
        try {
            const response = await fetch(slot.file);
            if (!response.ok) {
                throw new Error(`Failed to load ${slot.file} - Status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log(`📄 Raw file content for ${slotName}:`, text.substring(0, 200) + '...');
            
            const ads = text.split('\n')
                           .map(line => line.trim())
                           .filter(line => line.length > 0);
            
            console.log(`� Loaded ${ads.length} ads for ${slotName}:`, ads);
            return ads;
        } catch (error) {
            console.error(`❌ Failed to load ads for ${slotName}:`, error);
            return [];
        }
    }
    
    // Get next ad sequentially (fair rotation)
    async getNextAd(slotName) {
        const ads = await this.loadAds(slotName);
        if (ads.length === 0) {
            return this.getFallbackAd();
        }
        
        const slot = this.slots[slotName];
        const ad = ads[slot.position % ads.length];
        
        // Update position for next rotation
        slot.position = (slot.position + 1) % ads.length;
        this.saveSlotPosition(slotName, slot.position);
        
        console.log(`🔄 Rotating to ad ${slot.position}/${ads.length} for ${slotName}`);
        return ad;
    }
    
    // Get position from localStorage
    getSlotPosition(slotName) {
        const key = `ad_position_${slotName}`;
        return parseInt(localStorage.getItem(key) || '0');
    }
    
    // Save position to localStorage
    saveSlotPosition(slotName, position) {
        const key = `ad_position_${slotName}`;
        localStorage.setItem(key, position.toString());
    }
    
    // Initialize slot positions from localStorage
    initializePositions() {
        Object.keys(this.slots).forEach(slotName => {
            this.slots[slotName].position = this.getSlotPosition(slotName);
        });
    }
    
    // Fallback ad for when no ads are available
    getFallbackAd() {
        return `<div style="width:300px;height:250px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;color:#666;font-size:14px;">
            Ad Space Available
        </div>`;
    }
    
    // Display ad in element
    async displayAd(slotName, elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element not found: ${elementId}`);
            return false;
        }
        
        try {
            console.log(`🎯 Loading ad for slot: ${slotName}`);
            const ad = await this.getNextAd(slotName);
            console.log(`📦 Ad loaded for ${slotName}:`, ad.substring(0, 100) + '...');
            element.innerHTML = ad;
            console.log(`✅ Ad displayed in ${elementId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to display ad in ${elementId}:`, error);
            element.innerHTML = this.getFallbackAd();
            return false;
        }
    }
    
    // Initialize all ad slots on page
    async initializeAllSlots() {
        this.initializePositions();
        
        // Find all ad slot containers
        const adContainers = document.querySelectorAll('[data-ad-slot]');
        console.log(`🎯 Found ${adContainers.length} ad slot containers`);
        
        for (const container of adContainers) {
            const slotName = container.getAttribute('data-ad-slot');
            const elementId = container.id;
            
            if (slotName && elementId) {
                console.log(`🎯 Initializing ad slot: ${slotName} in #${elementId}`);
                await this.displayAd(slotName, elementId);
            } else {
                console.warn(`⚠️ Invalid ad container: slot=${slotName}, id=${elementId}`);
            }
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 DOM loaded, initializing Ad Rotation System...');
    window.adRotation = new AdRotationSystem();
    console.log('🎯 Ad Rotation System created, initializing slots...');
    await window.adRotation.initializeAllSlots();
    console.log('🎯 All slots initialized!');
});

// Global function for manual refresh
window.refreshAd = async function(slotName, elementId) {
    if (window.adRotation) {
        await window.adRotation.displayAd(slotName, elementId);
    }
};

console.log('✅ Ad Rotation System loaded');
