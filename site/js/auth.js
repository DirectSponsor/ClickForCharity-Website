// ClickForCharity Authentication System
// Integrates with auth.directsponsor.org

class AuthSystem {
    constructor() {
        this.authUrl = 'https://auth.directsponsor.org';
        this.sessionKey = 'directsponsor_session'; // Shared across all DirectSponsor sites
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
        // Redirect to auth.directsponsor.org login with redirect_uri
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        window.location.href = `${this.authUrl}/jwt-login.php?redirect_uri=${redirectUri}`;
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
    
    async getUserRole() {
        if (!this.isLoggedIn()) return null;
        
        try {
            const session = this.getSession();
            const profileUrl = `/api/simple-profile.php?action=profile&user_id=${session.combined_user_id}`;
            
            const response = await fetch(profileUrl);
            if (!response.ok) return null;
            
            const result = await response.json();
            return result.success && result.user ? result.user.roles || [] : [];
        } catch (error) {
            console.error('Error fetching user role:', error);
            return null;
        }
    }
    
    async isAdmin() {
        const roles = await this.getUserRole();
        return roles && roles.includes('admin');
    }
    
    parseJWT(token) {
        try {
            // JWT has 3 parts separated by dots: header.payload.signature
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }
    
    handleAuthCallback() {
        // Check URL for JWT token from DirectSponsor auth
        const urlParams = new URLSearchParams(window.location.search);
        const jwtToken = urlParams.get('jwt');
        
        if (jwtToken) {
            // Decode JWT to get user info
            const payload = this.parseJWT(jwtToken);
            
            if (payload && payload.sub && payload.username) {
                const userId = payload.sub;
                const username = payload.username;
                const combinedUserId = `${userId}-${username}`;
                
                // Create session
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
                
                // Clear old completed tasks cache when user changes
                localStorage.removeItem('completed_tasks');
                
                // Clear old balance cache when user changes
                localStorage.removeItem('guest_transactions');
                localStorage.removeItem('last_balance_fetch');
                
                console.log('✅ Login successful:', username);
                
                // Clean URL and refresh to show logged-in state
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                window.location.reload();
            }
        }
    }
}

// Global instance
window.auth = new AuthSystem();

// Protect admin pages
window.requireAdmin = async () => {
    const isAdmin = await window.auth.isAdmin();
    if (!isAdmin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
};

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
window.updateLoginDependentContent = async () => {
    const isLoggedIn = window.auth.isLoggedIn();
    
    // Update guest mode notices
    const guestNotices = document.querySelectorAll('.guest-only');
    const memberContent = document.querySelectorAll('.member-only');
    const adminContent = document.querySelectorAll('.admin-only');
    
    guestNotices.forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    memberContent.forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    // Handle admin-only content
    if (isLoggedIn) {
        const isAdmin = await window.auth.isAdmin();
        adminContent.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
    } else {
        adminContent.forEach(el => {
            el.style.display = 'none';
        });
    }
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
