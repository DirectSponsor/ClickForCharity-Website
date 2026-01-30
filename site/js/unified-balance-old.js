/**
 * Unified Balance System for Click for Charity PTC
 * Supports both guest (localStorage) and member (API) users
 * Based on ROFLFaucet unified token system architecture
 */

(function() {
    'use strict';

    const GUEST_STORAGE_KEY = 'ptc_guest_state';
    const JWT_KEY = 'jwt_token';

    // Check if user is logged in (has JWT token)
    function isLoggedIn() {
        return localStorage.getItem(JWT_KEY) !== null;
    }

    // Get terminology based on login status
    function getTerminology() {
        const loggedIn = isLoggedIn();
        return {
            single: loggedIn ? 'Coin' : 'Token',
            plural: loggedIn ? 'Coins' : 'Tokens',
            fullName: loggedIn ? 'Useless Coins' : 'Pointless Tokens'
        };
    }

    // Get guest state from localStorage
    function getGuestState() {
        const saved = localStorage.getItem(GUEST_STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Check if we need to reset completed tasks (daily at 1am UTC)
                checkAndResetCompletedTasks(state);
                return state;
            } catch (e) {
                console.error('Failed to parse guest state:', e);
            }
        }
        return {
            balance: 0,
            transactions: [],
            totalEarned: 0,
            totalTasks: 0,
            completedTasks: {},
            lastReset: getNextResetTime().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    // Get next 1am UTC reset time
    function getNextResetTime() {
        const now = new Date();
        const reset = new Date();
        reset.setUTCHours(1, 0, 0, 0);
        
        // If we're past 1am today, set to 1am tomorrow
        if (now >= reset) {
            reset.setUTCDate(reset.getUTCDate() + 1);
        }
        
        return reset;
    }

    // Check if we've passed reset time and clear completed tasks
    function checkAndResetCompletedTasks(state) {
        if (!state.lastReset) {
            state.lastReset = getNextResetTime().toISOString();
            state.completedTasks = state.completedTasks || {};
            return;
        }

        const now = new Date();
        const lastReset = new Date(state.lastReset);
        const nextReset = new Date(lastReset);
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        nextReset.setUTCHours(1, 0, 0, 0);

        // If we've passed the next reset time, clear completed tasks
        if (now >= nextReset) {
            state.completedTasks = {};
            state.lastReset = nextReset.toISOString();
            saveGuestState(state);
        }
    }

    // Save guest state to localStorage
    function saveGuestState(state) {
        state.lastUpdated = new Date().toISOString();
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
    }

    // Get current balance
    async function getBalance() {
        if (isLoggedIn()) {
            // TODO: Fetch from API when auth system is ready
            // For now, return guest balance even if "logged in"
            const state = getGuestState();
            return state.balance;
        } else {
            const state = getGuestState();
            return state.balance;
        }
    }

    // Add balance (reward for completing task)
    async function addBalance(amount, source, description) {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (isLoggedIn()) {
            // TODO: API call when auth system is ready
            // For now, use guest system
            return addGuestBalance(amount, source, description);
        } else {
            return addGuestBalance(amount, source, description);
        }
    }

    // Add balance for guest user
    function addGuestBalance(amount, source, description) {
        const state = getGuestState();
        state.balance += amount;
        state.totalEarned += amount;
        state.totalTasks += 1;
        
        state.transactions.push({
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            type: source,
            description,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 transactions to avoid localStorage bloat
        if (state.transactions.length > 100) {
            state.transactions = state.transactions.slice(-100);
        }

        saveGuestState(state);
        return state.balance;
    }

    // Subtract balance (for spending, if needed in future)
    async function subtractBalance(amount, source, description) {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        const currentBalance = await getBalance();
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        if (isLoggedIn()) {
            // TODO: API call when auth system is ready
            return subtractGuestBalance(amount, source, description);
        } else {
            return subtractGuestBalance(amount, source, description);
        }
    }

    // Subtract balance for guest user
    function subtractGuestBalance(amount, source, description) {
        const state = getGuestState();
        state.balance -= amount;
        
        state.transactions.push({
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: -amount,
            type: source,
            description,
            timestamp: new Date().toISOString()
        });

        if (state.transactions.length > 100) {
            state.transactions = state.transactions.slice(-100);
        }

        saveGuestState(state);
        return state.balance;
    }

    // Get transaction history
    function getTransactions(limit = 50) {
        if (isLoggedIn()) {
            // TODO: Fetch from API when auth system is ready
            const state = getGuestState();
            return state.transactions.slice(-limit);
        } else {
            const state = getGuestState();
            return state.transactions.slice(-limit);
        }
    }

    // Get user stats
    function getStats() {
        const state = getGuestState();
        return {
            balance: state.balance,
            totalEarned: state.totalEarned,
            totalTasks: state.totalTasks,
            isGuest: !isLoggedIn()
        };
    }

    // Mark task as completed
    function markTaskCompleted(taskId) {
        const state = getGuestState();
        if (!state.completedTasks) {
            state.completedTasks = {};
        }
        state.completedTasks[taskId] = new Date().toISOString();
        saveGuestState(state);
    }

    // Check if task is completed
    function isTaskCompleted(taskId) {
        const state = getGuestState();
        return state.completedTasks && state.completedTasks[taskId];
    }

    // Get time until next reset
    function getTimeUntilReset() {
        const state = getGuestState();
        const lastReset = new Date(state.lastReset);
        const nextReset = new Date(lastReset);
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        nextReset.setUTCHours(1, 0, 0, 0);
        
        const now = new Date();
        const msUntilReset = nextReset - now;
        
        return {
            ms: msUntilReset,
            hours: Math.floor(msUntilReset / (1000 * 60 * 60)),
            minutes: Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60)),
            nextResetTime: nextReset
        };
    }

    // Export functions to global scope
    window.UnifiedBalance = {
        getBalance,
        addBalance,
        subtractBalance,
        getTerminology,
        getTransactions,
        getStats,
        isLoggedIn,
        markTaskCompleted,
        isTaskCompleted,
        getTimeUntilReset
    };

})();
