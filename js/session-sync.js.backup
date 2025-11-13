// DirectSponsor Cross-Domain Session Sync
// Checks auth server for active session and syncs locally

(async function() {
    'use strict';
    
    const AUTH_SERVER = 'https://auth.directsponsor.org';
    const SESSION_KEY = 'directsponsor_session';
    const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    // Check if we already have a valid local session
    function hasValidLocalSession() {
        try {
            const sessionData = localStorage.getItem(SESSION_KEY);
            if (!sessionData) return false;
            
            const data = JSON.parse(sessionData);
            if (data.expires && Date.now() > data.expires) {
                return false;
            }
            
            return !!data.username;
        } catch (error) {
            return false;
        }
    }
    
    // Check auth server for session
    async function checkAuthServerSession() {
        try {
            const response = await fetch(`${AUTH_SERVER}/session-check.php`, {
                method: 'GET',
                credentials: 'include', // Important: include cookies for cross-domain
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('Session check failed:', response.status);
                return null;
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('Session check error:', error);
            return null;
        }
    }
    
    // Sync session from auth server to local storage
    async function syncSession() {
        // Skip if we already have a valid session
        if (hasValidLocalSession()) {
            console.log('📱 Local session valid - no sync needed');
            return;
        }
        
        console.log('🔄 Checking auth server for session...');
        
        const serverSession = await checkAuthServerSession();
        
        if (serverSession && serverSession.logged_in) {
            // Create local session from server session
            const sessionData = {
                user_id: serverSession.user_id,
                username: serverSession.username,
                combined_user_id: serverSession.combined_user_id,
                expires: Date.now() + SESSION_DURATION,
                created: Date.now(),
                synced_from_server: true
            };
            
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            // Also set individual items for backward compatibility
            localStorage.setItem('user_id', serverSession.user_id);
            localStorage.setItem('username', serverSession.username);
            localStorage.setItem('combined_user_id', serverSession.combined_user_id);
            
            console.log('✅ Session synced from auth server:', serverSession.username);
            
            // Reload page to show logged-in state
            window.location.reload();
        } else {
            console.log('👤 No active session on auth server');
        }
    }
    
    // Run sync on page load
    syncSession();
})();
