// ClickForCharity Authentication System
// Integrates with auth.directsponsor.org

class AuthSystem {
    constructor() {
        this.authUrl = 'https://auth.directsponsor.org';
        this.sessionKey = 'clickforcharity_session';
        this.sessionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    }
    
    isLoggedIn() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return false;
            
            const data = JSON.parse(sessionData);
            if (data.expires && Date.now() > data.expires) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking login status:', error);
            return false;
        }
    }
    
    getSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return null;
            
            const data = JSON.parse(sessionData);
            if (data.expires && Date.now() > data.expires) {
                this.logout();
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
    
    login() {
        // Redirect to auth.directsponsor.org login with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `${this.authUrl}/jwt-login.php?return_url=${returnUrl}`;
    }
    
    logout() {
        // Clear local session
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('combined_user_id');
        
        // Refresh the page to update UI
        window.location.reload();
    }
    
    handleAuthCallback() {
        // Check URL for auth parameters from DirectSponsor auth
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user_id');
        const username = urlParams.get('username');
        
        if (userId && username) {
            // Create session
            const combinedUserId = `${userId}-${username}`;
            const sessionData = {
                user_id: userId,
                username: username,
                combined_user_id: combinedUserId,
                expires: Date.now() + this.sessionDuration,
                created: Date.now()
            };
            
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            
            // Also set individual items for backward compatibility
            localStorage.setItem('user_id', userId);
            localStorage.setItem('username', username);
            localStorage.setItem('combined_user_id', combinedUserId);
            
            console.log('✅ Login successful:', username);
            
            // Clean URL and refresh to show logged-in state
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            window.location.reload();
        }
    }
}

// Global instance
window.auth = new AuthSystem();

// Update login UI based on auth status
window.updateLoginUI = () => {
    const session = window.auth.getSession();
    const isLoggedIn = window.auth.isLoggedIn();
    
    // Update user menu in sidebar
    const userMenu = document.getElementById('user-menu');
    const loginButton = document.getElementById('login-button');
    const usernameDisplay = document.getElementById('username-display');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (isLoggedIn && session) {
        // Show user menu
        if (loginButton) loginButton.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (usernameDisplay) usernameDisplay.textContent = session.username;
    } else {
        // Show login button
        if (loginButton) loginButton.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
    
    // Also update any login-dependent content
    updateLoginDependentContent();
};

// Update content that depends on login status (can be overridden by pages)
window.updateLoginDependentContent = () => {
    const isLoggedIn = window.auth.isLoggedIn();
    
    // Update guest mode notices
    const guestNotices = document.querySelectorAll('.guest-only');
    const memberContent = document.querySelectorAll('.member-only');
    
    guestNotices.forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    memberContent.forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
};

// Toggle user dropdown menu
window.toggleUserDropdown = () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.getElementById('user-dropdown');
    
    if (dropdown && userMenu && !userMenu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Handle auth callback
    window.auth.handleAuthCallback();
    
    // Update login UI
    setTimeout(updateLoginUI, 50);
    
    console.log('🔐 Auth system ready!');
});

console.log('🔐 ClickForCharity Auth System loaded!');
