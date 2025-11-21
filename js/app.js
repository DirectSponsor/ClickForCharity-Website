document.addEventListener('DOMContentLoaded', async () => {

    const MOCK_ADS = [
        {
            id: 1,
            title: 'Visit Example.com',
            instructions: 'Open the site and note how quickly the homepage loads. Return here once you have scrolled to the footer.',
            url: 'https://example.com',
            reward: 10,
            duration: 15
        },
        {
            id: 2,
            title: 'Learn about PTC',
            instructions: 'Read the “Paid-to-Click” article on Wikipedia and write down one new fact you learned.',
            url: 'https://en.wikipedia.org/wiki/Paid_to_click',
            reward: 15,
            duration: 20
        },
        {
            id: 3,
            title: 'Support DirectSponsor',
            instructions: 'Visit DirectSponsor.net and check the latest roadmap update in the hero section.',
            url: 'https://directsponsor.net/',
            reward: 12,
            duration: 18
        }
    ];

    const userBalanceEl = document.getElementById('user-balance');
    const userBalanceLabelEl = document.getElementById('user-balance-label');
    const taskListEl = document.getElementById('task-list');

    const TIMER_UPDATE_INTERVAL_MS = 500;
    let timerIntervalId = null;
    const originalTitle = document.title;
    const COMPLETION_TITLE = '✅ Ad ready — Click for Charity';
    const COUNTDOWN_TITLE_SUFFIX = ' — Click for Charity';
    let titleMode = 'default';

    const completionAudio = new Audio('https://freesound.org/data/previews/341/341695_5121236-lq.mp3');
    completionAudio.preload = 'auto';
    let completionAudioPrimed = false;

    let ads = [];

    // --- API Data Fetching ---

    async function fetchAdsData() {
        const response = await fetch('/api/get-ads.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // --- Rendering ---

    async function renderBalance() {
        const balance = await window.UnifiedBalance.getBalance();
        const terms = window.UnifiedBalance.getTerminology();
        userBalanceEl.textContent = Math.floor(balance);
        userBalanceLabelEl.textContent = terms.currency;
    }

    function renderTasks() {
        taskListEl.innerHTML = ''; // Clear existing tasks

        if (!ads.length) {
            taskListEl.innerHTML = '<p class="empty-state">No tasks available yet.</p>';
            return;
        }

        const terms = window.UnifiedBalance.getTerminology();
        const rewardLabel = terms.currency;

        ads.forEach(ad => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.dataset.adId = ad.id;
            
            // Check if task was already completed today
            if (window.UnifiedBalance.isTaskCompleted(ad.id)) {
                taskItem.classList.add('done');
            }

            const isCompleted = window.UnifiedBalance.isTaskCompleted(ad.id);
            const statusText = isCompleted ? 'Completed today' : 'Ready when you are';
            const visitText = isCompleted ? 'Viewed' : 'Visit';
            
            taskItem.innerHTML = `
                <div class="info">
                    <h4>${ad.title} <span class="task-timer">(${ad.duration}s)</span></h4>
                    <p class="task-instructions">${ad.instructions || 'Follow the link and complete the task as described.'}</p>
                    <p class="task-meta">Reward: ${ad.reward} ${rewardLabel}</p>
                    <p class="task-status" aria-live="polite">${statusText}</p>
                </div>
                <div class="actions">
                    <a href="${ad.url}" target="_blank" class="btn-visit" role="button" rel="noopener">${visitText}</a>
                </div>
            `;
            taskListEl.appendChild(taskItem);
        });
    }

    function updateTaskStatus(taskItemEl, text) {
        if (!taskItemEl) return;
        const statusEl = taskItemEl.querySelector('.task-status');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    function setCountdownTitle(secondsLeft) {
        document.title = `⏳ ${secondsLeft}s${COUNTDOWN_TITLE_SUFFIX}`;
        titleMode = 'countdown';
    }

    function resetDocumentTitle() {
        if (titleMode === 'default') return;
        document.title = originalTitle;
        titleMode = 'default';
    }

    function stopTimerInterval() {
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }

    function updateTimerDisplay() {
        if (!adBeingViewed) return;
        const { ad, taskItemEl } = adBeingViewed;
        const timerEl = taskItemEl.querySelector('.task-timer');
        if (!timerEl) return;

        const elapsed = accumulatedTime + (adViewStartTime ? Date.now() - adViewStartTime : 0);
        const remainingMs = Math.max(0, ad.duration * 1000 - elapsed);
        const secondsLeft = Math.ceil(remainingMs / 1000);

        if (remainingMs <= 0) {
            timerEl.textContent = '(Complete)';
            updateTaskStatus(taskItemEl, 'Reward ready!');
            document.title = COMPLETION_TITLE;
            titleMode = 'complete';
        } else {
            timerEl.textContent = `(${secondsLeft}s left)`;
            updateTaskStatus(taskItemEl, `Timer running – ${secondsLeft}s remaining`);
            setCountdownTitle(secondsLeft);
        }
    }

    function startTimerInterval() {
        updateTimerDisplay();
        if (!timerIntervalId) {
            timerIntervalId = setInterval(updateTimerDisplay, TIMER_UPDATE_INTERVAL_MS);
        }
    }

    function notifyAdReady(taskItemEl) {
        if (!taskItemEl) return;
        const timerEl = taskItemEl.querySelector('.task-timer');
        if (timerEl) {
            timerEl.textContent = '(Complete)';
        }
        updateTaskStatus(taskItemEl, 'Reward ready!');
        try {
            completionAudio.muted = false;
            completionAudio.currentTime = 0;
            completionAudio.play().catch(() => {});
            completionAudioPrimed = true;
        } catch (err) {
            console.warn('Completion audio failed:', err);
        }
        if (navigator.vibrate) {
            navigator.vibrate([200, 80, 200]);
        }
        document.title = COMPLETION_TITLE;
        titleMode = 'complete';
    }

    // --- Initialization ---

    async function initialize() {
        stopTimerInterval();
        adBeingViewed = null;
        adViewStartTime = null;
        accumulatedTime = 0;
        resetDocumentTitle();

        try {
            ads = await fetchAdsData();
            await renderBalance();
            renderTasks();
        } catch (error) {
            console.error("Failed to initialize app:", error);
            taskListEl.innerHTML = '<p>Error loading data. Please try again later.</p>';
        }
    }

    let adBeingViewed = null;
    let adViewStartTime = null;
    let accumulatedTime = 0;

    // --- Event Listeners ---

    taskListEl.addEventListener('click', async (e) => {
        const visitLink = e.target.closest('.btn-visit');

        if (visitLink) {
            const taskItem = visitLink.closest('.task-item');
            const adId = parseInt(taskItem.dataset.adId, 10);
            
            // Prevent clicking if already completed today
            if (window.UnifiedBalance.isTaskCompleted(adId)) {
                e.preventDefault();
                return;
            }
            
            if (taskItem.classList.contains('done') || taskItem.classList.contains('viewing')) {
                e.preventDefault();
                return;
            }

            const ad = ads.find(a => a.id === adId);
            
            if (ad) {
                if (adBeingViewed && adBeingViewed.taskItemEl !== taskItem) {
                    const previousTask = adBeingViewed.taskItemEl;
                    previousTask.classList.remove('viewing');
                    if (!previousTask.classList.contains('done')) {
                        updateTaskStatus(previousTask, 'Ready when you are');
                        const previousTimer = previousTask.querySelector('.task-timer');
                        if (previousTimer) {
                            previousTimer.textContent = `(${adBeingViewed.ad.duration}s)`;
                        }
                    }
                }

                adBeingViewed = { ad, taskItemEl: taskItem };
                accumulatedTime = 0;
                adViewStartTime = null; // Will be set on blur

                visitLink.textContent = 'Viewing...';
                taskItem.classList.add('viewing');
                updateTaskStatus(taskItem, 'Timer running…');
                startTimerInterval();

                if (!completionAudioPrimed) {
                    completionAudio.muted = true;
                    completionAudio.play().then(() => {
                        completionAudio.pause();
                        completionAudio.currentTime = 0;
                        completionAudio.muted = false;
                        completionAudioPrimed = true;
                    }).catch(() => {
                        completionAudio.muted = false;
                    });
                }
            }
        }
    });

    // --- Focus & Blur for Timer ---

    // When the user leaves the tab (e.g., to view the ad)
    window.addEventListener('blur', () => {
        if (adBeingViewed) {
            // Start the timer
            adViewStartTime = Date.now();
            startTimerInterval();
        }
    });

    // When the user returns to the tab
    window.addEventListener('focus', () => {
        if (adBeingViewed && adViewStartTime) {
            // Pause the timer and add the elapsed time
            const elapsedTime = Date.now() - adViewStartTime;
            accumulatedTime += elapsedTime;
            adViewStartTime = null; // Reset start time

            const requiredTime = adBeingViewed.ad.duration * 1000;

            if (accumulatedTime >= requiredTime) {
                completeAdView(adBeingViewed.ad, adBeingViewed.taskItemEl);
                // Reset all state
                adBeingViewed = null;
                accumulatedTime = 0;
            }
        }
        if (!adBeingViewed) {
            resetDocumentTitle();
        }
        updateTimerDisplay();
    });

    async function completeAdView(ad, taskItemEl) {
        if (taskItemEl.classList.contains('done')) return;

        taskItemEl.classList.remove('viewing');
        taskItemEl.classList.add('done');
        const visitLink = taskItemEl.querySelector('.btn-visit');
        visitLink.textContent = 'Viewed';

        stopTimerInterval();

        try {
            await window.UnifiedBalance.addBalance(
                ad.reward,
                'ptc_task_complete',
                `Completed: ${ad.title}`
            );
            window.UnifiedBalance.markTaskCompleted(ad.id);
            // No need to renderBalance() - addBalance() already updated display optimistically
            notifyAdReady(taskItemEl);
        } catch (error) {
            console.error('Failed to update balance:', error);
            taskItemEl.classList.remove('done');
            visitLink.textContent = 'Visit';
            updateTaskStatus(taskItemEl, 'Ready when you are');
            alert(`Error updating balance: ${error.message}`);
            resetDocumentTitle();
        }
    }

    // Initial load
    initialize();
});
