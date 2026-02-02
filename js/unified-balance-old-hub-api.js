// ClickForCharity Unified Balance System with Hub Batching
// Seamlessly handles both guest users (tokens in localStorage) and members (coins on server)
// NEW: Batches member balance updates to Hub API for conflict-free sync

class UnifiedBalanceSystem {
    constructor() {
        // Check login status with localStorage expiration
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.balance = 0;
        this.siteId = 'cfc'; // ClickForCharity identifier
        this.consecutiveFailures = 0; // Track Hub connection issues
        this.isSyncing = false; // Balance sync lock
        
        console.log(`💰 ClickForCharity Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
        
        // Update currency display immediately
        this.updateCurrencyDisplay();
        
        // Setup flush triggers for members
        if (this.isLoggedIn) {
            this.setupFlushTriggers();
        }
    }
    
    // ========== NEW: BATCHING SYSTEM ==========
    
    setupFlushTriggers() {
        // Flush every 120 seconds
        this.flushInterval = setInterval(() => {
            this.flushPendingOps('timer');
        }, 120000);
        
        // Flush on tab hide, refresh on tab show
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flushPendingOps('tab-hide');
            } else {
                // Tab became visible - lock balance ops and refresh
                this.isSyncing = true;
                this.showSyncNotification();
                console.log('🔒 Balance sync lock enabled (10s)');
                
                setTimeout(() => {
                    this.getBalance().then(() => {
                        this.updateBalanceDisplaysSync();
                        this.isSyncing = false;
                        this.hideSyncNotification();
                        console.log('✅ Tab visible - balance refreshed, lock released');
                    });
                }, 100);
                
                // Release lock after 10s even if fetch fails
                setTimeout(() => {
                    this.isSyncing = false;
                    this.hideSyncNotification();
                }, 10000);
            }
        });
        
        // Flush before page unload
        window.addEventListener('beforeunload', () => {
            this.flushPendingOps('beforeunload');
        });
        
        console.log('⏱️ Flush triggers setup: 120s timer, tab-hide, beforeunload');
    }
    
    getPendingOps() {
        const key = `pending_balance_ops:${this.getCombinedUserIdFromToken()}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : { ops: [], last_flush: 0 };
    }
    
    savePendingOps(pending) {
        const key = `pending_balance_ops:${this.getCombinedUserIdFromToken()}`;
        localStorage.setItem(key, JSON.stringify(pending));
    }
    
    generateOpId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${this.siteId}-${timestamp}-${random}`;
    }
    
    enqueueDelta(amount, source, description) {
        const op = {
            op_id: this.generateOpId(),
            amount: amount,
            source: source || 'unknown',
            description: description || '',
            timestamp: Math.floor(Date.now() / 1000),
            retries: 0
        };
        
        const pending = this.getPendingOps();
        pending.ops.push(op);
        this.savePendingOps(pending);
        
        // Optimistically update local balance display
        this.balance += amount;
        this.updateBalanceDisplaysSync();
        
        console.log('📝 Queued balance op:', op);
        return op;
    }
    
    async flushPendingOps(trigger = 'manual') {
        if (!this.isLoggedIn) return;
        
        const pending = this.getPendingOps();
        if (pending.ops.length === 0) {
            console.log('✅ No pending ops to flush');
            return;
        }
        
        const combinedUserId = this.getCombinedUserIdFromToken();
        if (combinedUserId === 'guest') return;
        
        console.log(`📤 Flushing ${pending.ops.length} ops to Hub (${trigger})`);
        
        try {
            const response = await fetch('https://auth.directsponsor.org/api/balance-update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: combinedUserId,
                    ops: pending.ops,
                    client_time: Math.floor(Date.now() / 1000)
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Remove applied ops from queue
                const appliedIds = result.applied_op_ids || [];
                pending.ops = pending.ops.filter(op => !appliedIds.includes(op.op_id));
                pending.last_flush = Date.now();
                this.savePendingOps(pending);
                
                // Update local balance to match server (don't re-fetch, use Hub's value)
                this.balance = result.balance;
                // Update displays directly with new balance (skip getBalance API call)
                this.updateBalanceDisplaysSync();
                
                console.log('✅ Flush successful, new balance:', result.balance);
                if (result.skipped_op_ids && result.skipped_op_ids.length > 0) {
                    console.log('⏭️ Skipped duplicate ops:', result.skipped_op_ids);
                }
                
                // Reset failure counter and hide warning
                this.consecutiveFailures = 0;
                this.hideHubWarning();
            } else {
                throw new Error(result.error || 'Flush failed');
            }
        } catch (error) {
            console.error('❌ Flush error:', error);
            
            // Increment retry count for failed ops
            pending.ops.forEach(op => op.retries++);
            
            // Remove ops with too many retries (>10)
            pending.ops = pending.ops.filter(op => op.retries <= 10);
            this.savePendingOps(pending);
            
            // Track failures and show warning
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= 3) {
                this.showHubWarning(this.consecutiveFailures >= 10);
            }
            
            console.warn('⚠️ Hub unreachable, will retry later');
        }
    }
    
    // ========== HUB WARNING BANNER ==========
    
    showHubWarning(isBlocking = false) {
        // Remove existing banner
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
                ❌ Unable to sync balance after multiple attempts. 
                Please stop earning activities and contact support.
                <button onclick="window.unifiedBalance.flushPendingOps('manual')" 
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
        console.log(`${isBlocking ? '🚨' : '⚠️'} Hub warning banner shown (failures: ${this.consecutiveFailures})`);
    }
    
    hideHubWarning() {
        const banner = document.getElementById('hub-warning-banner');
        if (banner) {
            banner.remove();
            console.log('✅ Hub warning banner hidden');
        }
    }
    
    showSyncNotification() {
        this.hideSyncNotification();
        
        const notification = document.createElement('div');
        notification.id = 'sync-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <style>
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="border: 2px solid white; border-top-color: transparent; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite;"></div>
                <span>Syncing balance...</span>
                <a href="#" onclick="alert('Your balance is being synchronized between sites. This takes ~5-10 seconds. Games and tasks will wait until sync completes to ensure accuracy.'); return false;"
                   style="color: white; text-decoration: underline; cursor: help;" title="Why is this syncing?">ℹ️</a>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
    }
    
    hideSyncNotification() {
        const notification = document.getElementById('sync-notification');
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }
    
    // ========== ORIGINAL METHODS (modified to use batching) ==========
    
    updateCurrencyDisplay() {
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        console.log(`💱 Updating currency display to: ${currency}`);
        
        // Update all currency display elements
        const currencyElements = document.querySelectorAll('.currency, [data-currency]');
        currencyElements.forEach(element => {
            element.textContent = currency;
        });
    }
    
    getValidUsername() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return null; // Expired
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
        // Get combined userID for API access (userID-username format)
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                
                // If combined_user_id exists, use it
                if (data.combined_user_id) {
                    return data.combined_user_id;
                }
                
                // Otherwise construct from user_id and username
                if (data.user_id && data.username) {
                    return `${data.user_id}-${data.username}`;
                }
                
                return 'guest';
            }
            
            // Try direct localStorage access
            const storedCombined = localStorage.getItem('combined_user_id');
            if (storedCombined) {
                return storedCombined;
            }
            
            // Fall back to constructing from individual items
            const userId = localStorage.getItem('user_id');
            const username = localStorage.getItem('username');
            if (userId && username) {
                return `${userId}-${username}`;
            }
            
            return 'guest';
        } catch (error) {
            console.error('Error getting combined user ID:', error);
            return 'guest';
        }
    }
    
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
            
            // Fetch from ClickForCharity balance API
            return await this.getBalanceFromAPI(combinedUserId);
        } catch (error) {
            console.error('💥 Balance fetch error:', error);
            throw error;
        }
    }
    
    async getBalanceFromAPI(combinedUserId) {
        try {
            // Read local balance file (synced from Hub via Syncthing)
            const response = await fetch(`/api/get_balance.php?user_id=${combinedUserId}`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.balance) || 0;
                    console.log('✅ Balance loaded:', this.balance);
                    return this.balance;
                }
            }
            
            // If endpoint doesn't exist yet, default to 0
            this.balance = 0;
            return this.balance;
        } catch (error) {
            console.warn('⚠️ Balance API not available, defaulting to 0');
            this.balance = 0;
            return this.balance;
        }
    }
    
    getGuestBalance() {
        const transactions = this.getGuestTransactions();
        this.balance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        console.log('👤 Guest balance calculated:', this.balance);
        return this.balance;
    }
    
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
    
    async addBalance(amount, source, description) {
        if (this.isLoggedIn) {
            return await this.addRealBalance(amount, source, description);
        } else {
            return this.addGuestBalance(amount, source, description);
        }
    }
    
    async addRealBalance(amount, source, description) {
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.addGuestBalance(amount, source, description);
            }
            
            // Wait if balance is syncing
            await this.waitForSync();
            
            // NEW: Queue the operation for batching
            this.enqueueDelta(amount, source, description);
            
            return { success: true, balance: this.balance };
        } catch (error) {
            console.error('💥 Add balance error:', error);
            throw error;
        }
    }
    
    addGuestBalance(amount, source, description) {
        this.saveGuestTransaction('earn', amount, source, description);
        this.balance += amount;
        
        console.log('🎁 Guest balance added:', amount, 'New balance:', this.balance);
        return { success: true, balance: this.balance };
    }
    
    async subtractBalance(amount, source, description) {
        if (this.isLoggedIn) {
            return await this.subtractRealBalance(amount, source, description);
        } else {
            return this.subtractGuestBalance(amount, source, description);
        }
    }
    
    async subtractRealBalance(amount, source, description) {
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.subtractGuestBalance(amount, source, description);
            }
            
            // Wait if balance is syncing
            await this.waitForSync();
            
            // NEW: Queue negative delta for batching
            this.enqueueDelta(-amount, source, description);
            
            return { success: true, balance: this.balance };
        } catch (error) {
            console.error('💥 Subtract balance error:', error);
            throw error;
        }
    }
    
    subtractGuestBalance(amount, source, description) {
        if (this.balance < amount) {
            console.log('❌ Insufficient guest balance');
            return { success: false, balance: this.balance, error: 'Insufficient balance' };
        }
        
        this.saveGuestTransaction('spend', amount, source, description);
        this.balance -= amount;
        
        console.log('💸 Guest balance subtracted:', amount, 'New balance:', this.balance);
        return { success: true, balance: this.balance };
    }
    
    refreshLoginStatus() {
        const wasLoggedIn = this.isLoggedIn;
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        
        if (wasLoggedIn !== this.isLoggedIn) {
            console.log(`💰 Login status changed: ${wasLoggedIn ? 'member' : 'guest'} → ${this.isLoggedIn ? 'member' : 'guest'}`);;
            this.updateCurrencyDisplay();
            setTimeout(updateBalanceDisplays, 100);
            
            // Setup flush triggers if newly logged in
            if (this.isLoggedIn && !wasLoggedIn) {
                this.setupFlushTriggers();
            }
            
            // Update login UI
            if (typeof updateLoginUI === 'function') {
                updateLoginUI();
            }
        }
    }
    
    getTerminology() {
        return {
            currency: this.isLoggedIn ? 'coins' : 'tokens',
            fullName: this.isLoggedIn ? 'Charity Coins' : 'Guest Tokens',
            action: this.isLoggedIn ? 'Earn Coins' : 'Earn Tokens'
        };
    }
    
    // Task completion tracking (for PTC ads)
    markTaskCompleted(taskId) {
        const completedTasks = this.getCompletedTasks();
        completedTasks[taskId] = new Date().toISOString();
        localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
        console.log('✅ Task marked complete:', taskId);
    }
    
    isTaskCompleted(taskId) {
        const completedTasks = this.getCompletedTasks();
        return !!completedTasks[taskId];
    }
    
    getCompletedTasks() {
        const stored = localStorage.getItem('completed_tasks');
        return stored ? JSON.parse(stored) : {};
    }
    
    // Clear all guest data (for testing)
    clearGuestData() {
        localStorage.removeItem('guest_transactions');
        localStorage.removeItem('completed_tasks');
        console.log('🗑️ Guest data cleared');
    }
    
    // Wait for sync to complete before processing balance operations
    async waitForSync() {
        if (!this.isSyncing) return;
        
        console.log('⏳ Waiting for balance sync to complete...');
        return new Promise(resolve => {
            const checkSync = setInterval(() => {
                if (!this.isSyncing) {
                    clearInterval(checkSync);
                    console.log('✅ Sync complete, processing operation');
                    resolve();
                }
            }, 100);
        });
    }
    
    // Update balance displays synchronously using current this.balance
    updateBalanceDisplaysSync() {
        const terminology = this.getTerminology();
        const balance = this.balance;
        
        const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
        balanceElements.forEach(element => {
            const formattedBalance = Math.floor(balance);
            element.textContent = formattedBalance;
            element.title = `${formattedBalance} ${terminology.fullName}`;
        });
        
        updateCurrencyDisplays();
    }
}

// Global instance
window.unifiedBalance = new UnifiedBalanceSystem();

// Also expose as window.UnifiedBalance for compatibility with app.js
window.UnifiedBalance = window.unifiedBalance;

// Global function to update all balance displays
window.updateBalanceDisplays = async () => {
    const balance = await window.unifiedBalance.getBalance();
    const terminology = window.unifiedBalance.getTerminology();
    
    // Find all elements with 'balance' class and update them
    const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
    balanceElements.forEach(element => {
        const formattedBalance = Math.floor(balance);
        element.textContent = formattedBalance;
        element.title = `${formattedBalance} ${terminology.fullName}`;
    });
    
    // Update currency terminology
    updateCurrencyDisplays();
};

// Global function to update currency terminology displays
window.updateCurrencyDisplays = () => {
    const terminology = window.unifiedBalance.getTerminology();
    
    // Find all elements with 'currency' class and update them
    const currencyElements = document.querySelectorAll('.currency, #user-balance-label');
    currencyElements.forEach(element => {
        element.textContent = terminology.currency;
        element.title = terminology.fullName;
    });
};

// Global convenience functions
window.getBalance = () => window.unifiedBalance.getBalance();
window.addBalance = (amount, source, description) => window.unifiedBalance.addBalance(amount, source, description);
window.subtractBalance = (amount, source, description) => window.unifiedBalance.subtractBalance(amount, source, description);
window.getTerminology = () => window.unifiedBalance.getTerminology();

// NEW: Manual flush function for testing
window.flushBalance = () => window.unifiedBalance.flushPendingOps('manual');

// Auto-update balance displays when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateBalanceDisplays, 100);
    console.log('💰 Balance system initialized');
});
