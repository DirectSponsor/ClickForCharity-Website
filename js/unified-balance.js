// ClickForCharity Unified Balance System
// Seamlessly handles both guest users (tokens in localStorage) and members (coins on server)

class UnifiedBalanceSystem {
    constructor() {
        // Check login status with localStorage expiration
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.balance = 0;
        
        console.log(`💰 ClickForCharity Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
        
        // Update currency display immediately
        this.updateCurrencyDisplay();
    }
    
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
            const sessionData = localStorage.getItem('clickforcharity_session');
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
            const sessionData = localStorage.getItem('clickforcharity_session');
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
            const sessionData = localStorage.getItem('clickforcharity_session');
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
            
            // Fetch from ClickForCharity profile API (which uses lazy loading)
            const response = await fetch(`/api/simple-profile.php?action=profile&user_id=${combinedUserId}&_t=` + Date.now(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // Profile gives us user info, now get balance from balance API
                    return await this.getBalanceFromAPI(combinedUserId);
                } else {
                    throw new Error(data.error || 'API returned error');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('💥 Balance fetch error:', error);
            throw error;
        }
    }
    
    async getBalanceFromAPI(combinedUserId) {
        try {
            // Read balance file directly via a simple balance API endpoint
            // For now, we'll need to create a get_balance.php endpoint
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
            
            // Use ClickForCharity update_balance API (with lazy loading)
            const response = await fetch('/api/update_balance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: combinedUserId,
                    reward: amount
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.newBalance) || 0;
                    console.log('✅ Real balance added:', amount, 'New balance:', this.balance);
                    return { success: true, balance: this.balance };
                } else {
                    throw new Error(data.error || 'API returned error');
                }
            } else {
                throw new Error('API request failed');
            }
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
        // For subtraction, we'd need a separate API or modify update_balance to accept negative
        // For now, throw an error as we don't have spending implemented yet
        throw new Error('Balance spending not yet implemented for members');
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
    
    // Clear all guest data (for testing)
    clearGuestData() {
        localStorage.removeItem('guest_transactions');
        console.log('🗑️ Guest data cleared');
    }
}

// Global instance
window.unifiedBalance = new UnifiedBalanceSystem();

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

// Auto-update balance displays when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateBalanceDisplays, 100);
    console.log('🔧 Unified Balance System ready for ClickForCharity!');
});

console.log('🔧 ClickForCharity Unified Balance System loaded!');
