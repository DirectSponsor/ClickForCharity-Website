// DirectSponsor Cross-Domain Session Sync (iframe-based)
// Checks auth server for active session via invisible iframe
// No cookies needed - works around cross-site cookie blocking!

(async function() {
    'use strict';
    
    const AUTH_SERVER = 'https://auth.directsponsor.org';
    const SESSION_KEY = 'directsponsor_session';
    const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
    const IFRAME_TIMEOUT = 5000; // 5 seconds
    
    let iframeLoaded = false;
    let sessionCheckComplete = false;
    
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
    
    // Save session data to localStorage
    function saveSession(serverSession) {
        const sessionData = {
            user_id: serverSession.user_id,
            username: serverSession.username,
            combined_user_id: serverSession.combined_user_id,
            email: serverSession.email,
            expires: Date.now() + SESSION_DURATION,
            created: Date.now(),
            synced_from: 'auth_server_iframe'
        };
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        // Also set individual items for backward compatibility
        localStorage.setItem('user_id', serverSession.user_id);
        localStorage.setItem('username', serverSession.username);
        localStorage.setItem('combined_user_id', serverSession.combined_user_id);
        if (serverSession.email) {
            localStorage.setItem('email', serverSession.email);
        }
        
        console.log('✅ Session synced from auth server:', serverSession.username);
    }
    
    // Handle message from iframe
    function handleAuthMessage(event) {
        // Verify origin for security
        if (event.origin !== AUTH_SERVER) {
            return;
        }
        
        // Check message type
        if (event.data && event.data.type === 'directsponsor-sso') {
            sessionCheckComplete = true;
            const sessionData = event.data.data;
            
            if (sessionData.logged_in) {
                console.log('🔄 Received session from auth server via iframe');
                saveSession(sessionData);
                
                // Reload page to show logged-in state
                console.log('🔄 Reloading page to apply session...');
                window.location.reload();
            } else {
                console.log('👤 No active session on auth server');
            }
            
            // Clean up iframe after a moment
            setTimeout(() => {
                const iframe = document.getElementById('directsponsor-sso-iframe');
                if (iframe) {
                    iframe.remove();
                }
            }, 1000);
        }
    }
    
    // Create invisible iframe to check auth server
    function createAuthIframe() {
        console.log('🔄 Checking auth server via iframe...');
        
        const iframe = document.createElement('iframe');
        iframe.id = 'directsponsor-sso-iframe';
        iframe.src = `${AUTH_SERVER}/sso-bridge.php`;
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        
        // Add timeout in case iframe fails to load
        const timeout = setTimeout(() => {
            if (!sessionCheckComplete) {
                console.warn('⚠️  SSO iframe timeout - continuing without sync');
                if (iframe.parentNode) {
                    iframe.remove();
                }
            }
        }, IFRAME_TIMEOUT);
        
        // Clear timeout if iframe loads successfully
        iframe.onload = () => {
            iframeLoaded = true;
            clearTimeout(timeout);
        };
        
        document.body.appendChild(iframe);
    }
    
    // Main sync function
    function syncSession() {
        // Skip if we already have a valid session
        if (hasValidLocalSession()) {
            console.log('📱 Local session valid - no sync needed');
            return;
        }
        
        // Listen for messages from iframe
        window.addEventListener('message', handleAuthMessage);
        
        // Wait for DOM to be ready before creating iframe
        if (document.body) {
            createAuthIframe();
        } else {
            // DOM not ready yet, wait for it
            document.addEventListener('DOMContentLoaded', createAuthIframe);
        }
    }
    
    // Run sync on page load
    syncSession();
})();
