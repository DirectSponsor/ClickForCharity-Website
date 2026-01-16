/**
 * My Platforms - Platform Membership Manager
 * Allows users to select platforms they're members of
 * Awards 25 coins for rewarded platforms (one-time)
 */

(function() {
    'use strict';

    let userPlatforms = [];
    let rewardedPlatforms = [];
    let userId = null;

    function init() {
        userId = window.auth?.getUserId();
        
        if (!userId) {
            console.log('User not logged in, waiting for auth...');
            setTimeout(init, 500);
            return;
        }

        loadUserPlatforms();
        attachEventListeners();
    }

    async function loadUserPlatforms() {
        try {
            const response = await fetch(`api/get-user-platforms.php?user_id=${encodeURIComponent(userId)}`);
            const data = await response.json();

            if (data.success) {
                userPlatforms = data.memberPlatforms || [];
                rewardedPlatforms = data.rewardedPlatforms || [];
                
                updateCheckboxes();
            } else {
                console.error('Failed to load platforms:', data.error);
            }
        } catch (error) {
            console.error('Error loading platforms:', error);
        }
    }

    function updateCheckboxes() {
        const checkboxes = document.querySelectorAll('input[name="platform"]');
        
        checkboxes.forEach(checkbox => {
            const platformId = checkbox.value;
            const isRewarded = checkbox.dataset.rewarded === 'true';
            
            if (userPlatforms.includes(platformId)) {
                checkbox.checked = true;
            }
            
            if (isRewarded && rewardedPlatforms.includes(platformId)) {
                const label = checkbox.closest('.platform-checkbox');
                label.classList.add('already-rewarded');
                
                const existingBadge = label.querySelector('.rewarded-badge');
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'rewarded-badge';
                    badge.textContent = 'Rewarded';
                    label.appendChild(badge);
                }
            }
        });
    }

    function attachEventListeners() {
        const saveBtn = document.getElementById('save-platforms-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', savePlatforms);
        }
    }

    async function savePlatforms() {
        const checkboxes = document.querySelectorAll('input[name="platform"]:checked');
        const selectedPlatforms = Array.from(checkboxes).map(cb => cb.value);

        const newRewardedPlatforms = [];
        checkboxes.forEach(cb => {
            const platformId = cb.value;
            const isRewarded = cb.dataset.rewarded === 'true';
            
            if (isRewarded && !rewardedPlatforms.includes(platformId)) {
                newRewardedPlatforms.push(platformId);
            }
        });

        try {
            const saveBtn = document.getElementById('save-platforms-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            const response = await fetch('api/update-user-platforms.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    platforms: selectedPlatforms
                })
            });

            const data = await response.json();

            if (data.success) {
                userPlatforms = selectedPlatforms;
                rewardedPlatforms = data.rewardedPlatforms || rewardedPlatforms;
                
                updateCheckboxes();
                
                if (data.reward && data.reward > 0) {
                    showRewardNotification(data.reward, data.rewardedPlatformNames);
                    
                    if (window.unifiedBalance) {
                        window.unifiedBalance.syncBalance();
                    }
                } else {
                    showSuccessNotification('Platforms saved successfully!');
                }
            } else {
                showErrorNotification(data.error || 'Failed to save platforms');
            }

            saveBtn.disabled = false;
            saveBtn.textContent = 'Save My Platforms';

        } catch (error) {
            console.error('Error saving platforms:', error);
            showErrorNotification('Network error. Please try again.');
            
            const saveBtn = document.getElementById('save-platforms-btn');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save My Platforms';
        }
    }

    function showRewardNotification(amount, platformNames) {
        const notification = document.getElementById('reward-notification');
        if (!notification) return;

        const platformList = platformNames.join(', ');
        notification.innerHTML = `
            <div class="reward-animation">
                🎉 Congratulations! You earned <strong>${amount} coins</strong> for joining ${platformList}!
            </div>
        `;
        notification.className = 'reward-notification success';
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 8000);
    }

    function showSuccessNotification(message) {
        const notification = document.getElementById('reward-notification');
        if (!notification) return;

        notification.innerHTML = `<div>✓ ${message}</div>`;
        notification.className = 'reward-notification success';
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function showErrorNotification(message) {
        const notification = document.getElementById('reward-notification');
        if (!notification) return;

        notification.innerHTML = `<div>✗ ${message}</div>`;
        notification.className = 'reward-notification error';
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
