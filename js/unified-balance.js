// ClickForCharity Unified Balance System - File-Based Sync
// Simple architecture: track running total, flush to local file, Syncthing handles cross-site sync
// CFC-specific: No balance locking needed (tasks take 10+ seconds anyway)

class UnifiedBalanceSystem {
    constructor() {
        // Check login status
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.siteId = 'cfc'; // ClickForCharity identifier
        
        // Balance state
        this.fileBalance = 0; // Balance from file
        this.netChange = 0; // Running total of changes since last flush
        this.consecutiveFailures = 0;
        this.isFlushing = false; // Guard flag to prevent double flush
        
        console.log(`💰 ClickForCharity Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
        
        // Update currency display
        this.updateCurrencyDisplay();
        
        // Setup for logged-in users
        if (this.isLoggedIn) {
            // Only load netChange if this is a page refresh (not navigation)
            // Navigation should start with netChange = 0 (old page flushes on blur)
            if (performance.navigation.type === 1) {
                // Type 1 = reload (F5)
                this.loadNetChange();
            } else {
                // Type 0 = normal navigation - start fresh
                console.log('📊 Normal navigation - starting with netChange = 0');
                this.resetNetChange();
            }
            this.setupFlushTriggers();
            this.setupCrossSiteSync();
        }
    }
    
    // ========== NET CHANGE MANAGEMENT ==========
    
    getNetChangeKey() {
        return `balance_net_change:${this.getCombinedUserIdFromToken()}`;
    }
    
    loadNetChange() {
        const stored = localStorage.getItem(this.getNetChangeKey());
        this.netChange = stored ? parseFloat(stored) : 0;
        console.log(`📊 Loaded net change: ${this.netChange}`);
    }
    
    saveNetChange() {
        localStorage.setItem(this.getNetChangeKey(), this.netChange.toString());
    }
    
    resetNetChange() {
        this.netChange = 0;
        this.saveNetChange();
    }
    
    addToNetChange(amount, source, description) {
        this.netChange += amount;
        this.saveNetChange();
        
        // Update display optimistically
        this.updateBalanceDisplaysSync();
        
        console.log(`📝 Net change: ${this.netChange > 0 ? '+' : ''}${amount} from ${source || 'unknown'} (total: ${this.netChange})`);
    }
    
    // ========== FLUSH TO LOCAL FILE ==========
    
    async flushNetChange(trigger = 'manual') {
        if (!this.isLoggedIn) return;
        if (this.netChange === 0) {
            console.log('✅ No net change to flush');
            return;
        }
        
        // Prevent double flush
        if (this.isFlushing) {
            console.log(`⏭️ Flush already in progress, skipping ${trigger}`);
            return;
        }
        
        const combinedUserId = this.getCombinedUserIdFromToken();
        if (combinedUserId === 'guest') return;
        
        this.isFlushing = true;
        console.log(`📤 Flushing net change: ${this.netChange > 0 ? '+' : ''}${this.netChange} (${trigger})`);
        
        try {
            const response = await fetch('/api/write_balance.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: combinedUserId,
                    net_change: this.netChange
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update file balance and reset net change
                this.fileBalance = result.balance;
                this.resetNetChange();
                
                console.log('✅ Flush successful, new balance:', result.balance);
                
                // Track last write for cross-site detection
                localStorage.setItem('last_write_site', this.siteId);
                localStorage.setItem('last_write_time', Date.now().toString());
                
                this.consecutiveFailures = 0;
                this.hideHubWarning();
            } else {
                throw new Error(result.error || 'Flush failed');
            }
        } catch (error) {
            console.error('❌ Flush error:', error);
            this.consecutiveFailures++;
            
            if (this.consecutiveFailures >= 3) {
                this.showHubWarning(this.consecutiveFailures >= 10);
            }
        } finally {
            this.isFlushing = false;
        }
    }
    
    // ========== FLUSH TRIGGERS ==========
    
    setupFlushTriggers() {
        // 1. Timer - flush every 120 seconds
        this.flushInterval = setInterval(() => {
            this.flushNetChange('timer');
        }, 120000);
        
        // 2. Blur - flush when window loses focus
        window.addEventListener('blur', () => {
            this.flushNetChange('blur');
        });
        
        // 3. Beforeunload - flush before closing tab/window
        window.addEventListener('beforeunload', () => {
            this.flushNetChange('beforeunload');
        });
        
        console.log('⏱️ Flush triggers setup: timer (120s), blur, beforeunload');
    }
    
    // ========== CROSS-SITE SYNC LOGIC ==========
    
    setupCrossSiteSync() {
        window.addEventListener('focus', async () => {
            const lastActiveSite = localStorage.getItem('last_active_site');
            const currentSite = this.siteId;
            
            // Update current site
            localStorage.setItem('last_active_site', currentSite);
            
            // Check if switching from different site
            if (lastActiveSite && lastActiveSite !== currentSite) {
                // Cross-site switch - need full sync with lock
                console.log(`🔄 Detected site switch: ${lastActiveSite} → ${currentSite}`);
                await this.syncFromOtherSite();
            } else {
                // Same site - just refresh balance without lock
                console.log(`🔄 Refreshing balance on focus (same site)`);
                await this.getBalance();
                this.updateBalanceDisplaysSync();
            }
        });
        
        // Listen for localStorage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.getNetChangeKey() || e.key === 'last_write_time') {
                console.log('🔄 Balance updated in another tab, refreshing...');
                this.loadNetChange();
                this.updateBalanceDisplaysSync();
            }
        });
        
        // Set initial site
        localStorage.setItem('last_active_site', this.siteId);
    }
    
    async syncFromOtherSite() {
        // CFC: No locking needed - tasks take 10+ seconds, sync will finish before task completes
        console.log('🔄 Syncing balance from other site (no lock needed)');
        
        // Wait 10 seconds for Syncthing
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Read balance from file
        await this.getBalance();
        this.updateBalanceDisplaysSync();
        
        console.log('✅ Cross-site sync completed');
    }
    
    
    // ========== WARNING BANNERS ==========
    
    showHubWarning(isBlocking = false) {
        this.hideHubWarning();
        
        const banner = document.createElement('div');
        banner.id = 'hub-warning-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: ${isBlocking ? '#dc3545' : '#ff9800'};
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        if (isBlocking) {
            banner.innerHTML = `
                ❌ Unable to sync balance from other site.
                Network issue detected. Earning activities disabled until resolved.
                <button onclick="window.unifiedBalance.syncFromOtherSite()" 
                        style="margin-left: 10px; padding: 5px 10px; background: white; color: #dc3545; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">
                    Retry Now
                </button>
            `;
        } else {
            banner.innerHTML = `
                ⚠️ Connection issue - your earnings are being saved and will sync when reconnected.
                <button onclick="window.unifiedBalance.hideHubWarning()" 
                        style="margin-left: 10px; padding: 5px 10px; background: white; color: #ff9800; border: none; border-radius: 3px; cursor: pointer;">
                    Dismiss
                </button>
            `;
        }
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
    hideHubWarning() {
        const banner = document.getElementById('hub-warning-banner');
        if (banner) banner.remove();
    }
    
    // CFC: No sync notifications needed (simpler UX, tasks are slow anyway)
    // But we still need warning banners for failures!
    
    showSyncNotification() {
        // CFC: Skip sync notifications (tasks are slow, don't need the spinner)
    }
    
    hideSyncNotification() {
        // CFC: Skip sync notifications
    }
    
    // ========== BALANCE OPERATIONS ==========
    
    async getBalance() {
        if (this.isLoggedIn) {
            return await this.getRealBalance();
        } else {
            return this.getGuestBalance();
        }
    }
    
    async getRealBalance() {
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.getGuestBalance();
            }
            
            const response = await fetch(`/api/get_balance.php?user_id=${combinedUserId}`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.fileBalance = parseFloat(data.balance) || 0;
                    // Always add net change for consistent display
                    const displayBalance = this.fileBalance + this.netChange;
                    console.log(`✅ Balance loaded: ${this.fileBalance} (file) + ${this.netChange} (pending) = ${displayBalance}`);
                    return displayBalance;
                }
            }
            
            this.fileBalance = 0;
            return this.netChange;
        } catch (error) {
            console.warn('⚠️ Balance API error:', error);
            return this.netChange;
        }
    }
    
    getGuestBalance() {
        const transactions = this.getGuestTransactions();
        this.fileBalance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        console.log('👤 Guest balance calculated:', this.fileBalance);
        return this.fileBalance;
    }
    
    async addBalance(amount, source, description) {
        // CFC: No balance locking - tasks take 10+ seconds anyway
        if (this.isLoggedIn) {
            this.addToNetChange(amount, source, description);
            return { success: true, balance: this.fileBalance + this.netChange };
        } else {
            return this.addGuestBalance(amount, source, description);
        }
    }
    
    async subtractBalance(amount, source, description) {
        // CFC: No balance locking - tasks take 10+ seconds anyway
        if (this.isLoggedIn) {
            this.addToNetChange(-amount, source, description);
            return { success: true, balance: this.fileBalance + this.netChange };
        } else {
            return this.subtractGuestBalance(amount, source, description);
        }
    }
    
    // ========== GUEST BALANCE METHODS ==========
    
    getGuestTransactions() {
        const stored = localStorage.getItem('guest_transactions');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveGuestTransaction(type, amount, source, description) {
        const transactions = this.getGuestTransactions();
        const transaction = {
            id: Date.now().toString(),
            type: type,
            amount: amount,
            source: source,
            description: description,
            timestamp: new Date().toISOString()
        };
        
        transactions.push(transaction);
        localStorage.setItem('guest_transactions', JSON.stringify(transactions));
        
        console.log('📝 Guest transaction saved:', transaction);
        return transaction;
    }
    
    addGuestBalance(amount, source, description) {
        this.saveGuestTransaction('earn', amount, source, description);
        this.fileBalance += amount;
        this.updateBalanceDisplaysSync();
        
        console.log('🎁 Guest balance added:', amount);
        return { success: true, balance: this.fileBalance };
    }
    
    subtractGuestBalance(amount, source, description) {
        if (this.fileBalance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        this.saveGuestTransaction('spend', amount, source, description);
        this.fileBalance -= amount;
        this.updateBalanceDisplaysSync();
        
        console.log('💸 Guest balance subtracted:', amount);
        return { success: true, balance: this.fileBalance };
    }
    
    // ========== USER MANAGEMENT ==========
    
    getValidUsername() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return null;
                }
                return data.username;
            }
            return localStorage.getItem('username');
        } catch (error) {
            return localStorage.getItem('username');
        }
    }
    
    getUserIdFromToken() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                return data.user_id || 'guest';
            }
            return localStorage.getItem('user_id') || 'guest';
        } catch (error) {
            return localStorage.getItem('user_id') || 'guest';
        }
    }
    
    getCombinedUserIdFromToken() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                
                if (data.combined_user_id) {
                    return data.combined_user_id;
                }
                
                if (data.user_id && data.username) {
                    return `${data.user_id}-${data.username}`;
                }
                
                return 'guest';
            }
            
            const storedCombined = localStorage.getItem('combined_user_id');
            if (storedCombined) return storedCombined;
            
            const userId = localStorage.getItem('user_id');
            const username = localStorage.getItem('username');
            if (userId && username) {
                return `${userId}-${username}`;
            }
            
            return 'guest';
        } catch (error) {
            return 'guest';
        }
    }
    
    // ========== UI UPDATES ==========
    
    updateCurrencyDisplay() {
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        const currencyElements = document.querySelectorAll('.currency, [data-currency]');
        currencyElements.forEach(element => {
            element.textContent = currency;
        });
    }
    
    updateBalanceDisplaysSync() {
        const balance = this.fileBalance + this.netChange;
        const terminology = this.getTerminology();
        
        const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
        balanceElements.forEach(element => {
            const formattedBalance = Math.floor(balance);
            element.textContent = formattedBalance;
            element.title = `${formattedBalance} ${terminology.fullName}`;
        });
        
        updateCurrencyDisplays();
    }
    
    getTerminology() {
        return {
            currency: this.isLoggedIn ? 'coins' : 'tokens',
            fullName: this.isLoggedIn ? 'Charity Coins' : 'Guest Tokens',
            action: this.isLoggedIn ? 'Earn Coins' : 'Earn Tokens'
        };
    }
    
    refreshLoginStatus() {
        const wasLoggedIn = this.isLoggedIn;
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        
        if (wasLoggedIn !== this.isLoggedIn) {
            console.log(`💰 Login status changed: ${wasLoggedIn ? 'member' : 'guest'} → ${this.isLoggedIn ? 'member' : 'guest'}`);
            this.updateCurrencyDisplay();
            
            if (this.isLoggedIn && !wasLoggedIn) {
                this.setupFlushTriggers();
                this.setupCrossSiteSync();
            }
            
            setTimeout(updateBalanceDisplays, 100);
            
            if (typeof updateLoginUI === 'function') {
                updateLoginUI();
            }
        }
    }
    
    clearGuestData() {
        localStorage.removeItem('guest_transactions');
        console.log('🗑️ Guest data cleared');
    }
}

// Global instance (singleton pattern)
if (!window.unifiedBalance) {
    window.unifiedBalance = new UnifiedBalanceSystem();
    window.UnifiedBalance = window.unifiedBalance;
    console.log('✅ UnifiedBalanceSystem singleton created');
} else {
    console.warn('⚠️ UnifiedBalanceSystem already exists! Script loaded multiple times.');
    console.warn('🔍 Stack trace:', new Error().stack);
}

// Global functions
window.updateBalanceDisplays = async () => {
    const balance = await window.unifiedBalance.getBalance();
    const terminology = window.unifiedBalance.getTerminology();
    
    const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
    balanceElements.forEach(element => {
        const formattedBalance = Math.floor(balance);
        element.textContent = formattedBalance;
        element.title = `${formattedBalance} ${terminology.fullName}`;
    });
    
    updateCurrencyDisplays();
};

window.updateCurrencyDisplays = () => {
    const terminology = window.unifiedBalance.getTerminology();
    const currencyElements = document.querySelectorAll('.currency, #user-balance-label');
    currencyElements.forEach(element => {
        element.textContent = terminology.currency;
        element.title = terminology.fullName;
    });
};

window.getBalance = () => window.unifiedBalance.getBalance();
window.addBalance = (amount, source, description) => window.unifiedBalance.addBalance(amount, source, description);
window.subtractBalance = (amount, source, description) => window.unifiedBalance.subtractBalance(amount, source, description);
window.getTerminology = () => window.unifiedBalance.getTerminology();

// Auto-update on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateBalanceDisplays, 100);
    console.log('💰 Balance system initialized');
});
