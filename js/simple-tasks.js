document.addEventListener('DOMContentLoaded', async () => {

    const userBalanceEl = document.getElementById('user-balance');
    const userBalanceLabelEl = document.getElementById('user-balance-label');
    const taskListEl = document.getElementById('simple-task-list');

    const TIMER_UPDATE_INTERVAL_MS = 500;
    let timerIntervalId = null;
    const originalTitle = document.title;
    const COMPLETION_TITLE = '✅ Task ready — Click for Charity';
    const COUNTDOWN_TITLE_SUFFIX = ' — Click for Charity';
    let titleMode = 'default';

    const completionAudio = new Audio('https://freesound.org/data/previews/341/341695_5121236-lq.mp3');
    completionAudio.preload = 'auto';
    let completionAudioPrimed = false;

    let simpleTasks = [];
    let expandedTasks = new Set(); // Track which tasks are expanded

    // --- API Data Fetching ---

    async function fetchSimpleTasksData() {
        try {
            const response = await fetch('/api/get-simple-tasks.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Failed to fetch simple tasks:', error);
            return []; // Return empty array on error
        }
    }

    // --- Rendering ---

    async function renderBalance() {
        const balance = await window.UnifiedBalance.getBalance();
        const terms = window.UnifiedBalance.getTerminology();
        userBalanceEl.textContent = Math.floor(balance);
        userBalanceLabelEl.textContent = terms.currency;
    }

    function renderSimpleTasks() {
        taskListEl.innerHTML = ''; // Clear existing tasks

        if (!simpleTasks.length) {
            taskListEl.innerHTML = '<p class="empty-state">No simple tasks available yet.</p>';
            return;
        }

        const terms = window.UnifiedBalance.getTerminology();
        const rewardLabel = terms.currency;

        console.log('Rendering tasks, total:', simpleTasks.length);

        // Filter out completed and skipped tasks
        const availableTasks = simpleTasks.filter(task => {
            const isCompleted = window.UnifiedBalance.isTaskCompleted(task.id);
            const isSkipped = window.UnifiedBalance.isTaskSkipped(task.id);
            console.log(`Task ${task.id}: completed=${isCompleted}, skipped=${isSkipped}`);
            return !isCompleted && !isSkipped;
        });

        console.log('Available tasks after filtering:', availableTasks.length);

        if (availableTasks.length === 0) {
            taskListEl.innerHTML = '<p class="empty-state">No available tasks. Check back later!</p>';
            return;
        }

        availableTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item simple-task';
            taskItem.dataset.taskId = task.id;
            
            const isExpanded = expandedTasks.has(task.id);
            
            taskItem.innerHTML = `
                <div class="task-content" data-task-content>
                    <div class="task-header">
                        <h4>${task.title} <span class="task-timer">(${task.duration}s)</span></h4>
                        <p class="task-short-description">${task.shortDescription}</p>
                        <p class="task-meta">Reward: ${task.reward} ${rewardLabel}</p>
                    </div>
                    <div class="task-details ${isExpanded ? 'expanded' : ''}" style="display: ${isExpanded ? 'block' : 'none'};">
                        <div class="task-instructions">
                            <p><strong>Instructions:</strong></p>
                            <pre>${task.instructions}</pre>
                        </div>
                        <div class="task-actions">
                            <a href="${task.url}" target="_blank" class="btn-visit" role="button" rel="noopener">Visit</a>
                            <button class="btn-skip" data-skip-btn>Skip</button>
                            <button class="btn-complete" data-complete-btn style="display: none;">Complete</button>
                        </div>
                        <p class="task-status" aria-live="polite">Ready when you are</p>
                    </div>
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
        if (!taskBeingViewed) return;
        const { task, taskItemEl } = taskBeingViewed;
        const timerEl = taskItemEl.querySelector('.task-timer');
        if (!timerEl) return;

        const elapsed = accumulatedTime + (taskViewStartTime ? Date.now() - taskViewStartTime : 0);
        const remainingMs = Math.max(0, task.duration * 1000 - elapsed);
        const secondsLeft = Math.ceil(remainingMs / 1000);

        if (remainingMs <= 0) {
            timerEl.textContent = '(Complete)';
            updateTaskStatus(taskItemEl, 'Click Complete to claim reward');
            document.title = COMPLETION_TITLE;
            titleMode = 'complete';
            
            // Show complete button, hide visit button and skip button
            const visitBtn = taskItemEl.querySelector('.btn-visit');
            const skipBtn = taskItemEl.querySelector('.btn-skip');
            const completeBtn = taskItemEl.querySelector('.btn-complete');
            if (visitBtn) visitBtn.style.display = 'none';
            if (skipBtn) skipBtn.style.display = 'none';
            if (completeBtn) completeBtn.style.display = 'inline-block';
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

    function notifyTaskReady(taskItemEl) {
        if (!taskItemEl) return;
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
        // Enable guest access with warning - data stored in localStorage only
        stopTimerInterval();
        taskBeingViewed = null;
        taskViewStartTime = null;
        accumulatedTime = 0;
        resetDocumentTitle();

        try {
            simpleTasks = await fetchSimpleTasksData();
            console.log('Simple tasks loaded:', simpleTasks);
            await renderBalance();
            renderSimpleTasks();
        } catch (error) {
            console.error("Failed to initialize simple tasks:", error);
            taskListEl.innerHTML = '<p>Error loading data. Please try again later.</p>';
        }
    }

    let taskBeingViewed = null;
    let taskViewStartTime = null;
    let accumulatedTime = 0;

    // --- Event Listeners ---

    taskListEl.addEventListener('click', async (e) => {
        const taskContent = e.target.closest('[data-task-content]');
        const visitLink = e.target.closest('.btn-visit');
        const skipBtn = e.target.closest('[data-skip-btn]');
        const completeBtn = e.target.closest('[data-complete-btn]');

        // Handle task expansion/collapse
        if (taskContent && !visitLink && !skipBtn && !completeBtn) {
            const taskItem = taskContent.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            const taskDetails = taskItem.querySelector('.task-details');
            
            if (expandedTasks.has(taskId)) {
                expandedTasks.delete(taskId);
                taskDetails.style.display = 'none';
                taskDetails.classList.remove('expanded');
            } else {
                expandedTasks.add(taskId);
                taskDetails.style.display = 'block';
                taskDetails.classList.add('expanded');
            }
            return;
        }

        // Handle visit button
        if (visitLink) {
            const taskItem = visitLink.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            
            if (taskItem.classList.contains('done')) {
                e.preventDefault();
                return;
            }

            // Prevent default link behavior - we'll handle it programmatically
            e.preventDefault();

            const task = simpleTasks.find(t => t.id === taskId);
            
            if (task) {
                // If this is a re-open (button text is "Re-open"), just reopen the link
                const isReopen = visitLink.textContent === 'Re-open';
                
                if (taskBeingViewed && taskBeingViewed.taskItemEl !== taskItem) {
                    const previousTask = taskBeingViewed.taskItemEl;
                    previousTask.classList.remove('viewing');
                    if (!previousTask.classList.contains('done')) {
                        updateTaskStatus(previousTask, 'Ready when you are');
                        const previousTimer = previousTask.querySelector('.task-timer');
                        if (previousTimer) {
                            previousTimer.textContent = `(${taskBeingViewed.task.duration}s)`;
                        }
                    }
                }

                taskBeingViewed = { task, taskItemEl: taskItem };
                
                if (isReopen) {
                    // Re-opening: timer was already running, just continue
                    visitLink.textContent = 'Viewing...';
                    updateTaskStatus(taskItem, 'Timer running…');
                    startTimerInterval();
                } else {
                    // First time opening: reset timer
                    accumulatedTime = 0;
                    taskViewStartTime = null; // Will be set on blur
                    visitLink.textContent = 'Viewing...';
                    taskItem.classList.add('viewing');
                    updateTaskStatus(taskItem, 'Timer running…');
                    startTimerInterval();
                }

                // Force new tab opening for automation compatibility
                window.open(task.url, '_blank', 'noopener,noreferrer');

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

        // Handle skip button
        if (skipBtn) {
            const taskItem = skipBtn.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            
            try {
                await window.UnifiedBalance.markTaskSkipped(taskId);
                taskItem.style.opacity = '0.5';
                updateTaskStatus(taskItem, 'Task skipped');
                
                // Remove from view after a short delay
                setTimeout(() => {
                    taskItem.remove();
                    // Check if no tasks left
                    if (taskListEl.querySelectorAll('.task-item').length === 0) {
                        taskListEl.innerHTML = '<p class="empty-state">No available tasks. Check back later!</p>';
                    }
                }, 500);
            } catch (error) {
                console.error('Failed to skip task:', error);
                alert('Error skipping task. Please try again.');
            }
        }

        // Handle complete button
        if (completeBtn) {
            const taskItem = completeBtn.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            const task = simpleTasks.find(t => t.id === taskId);
            
            if (task) {
                await completeSimpleTask(task, taskItem);
            }
        }
    });

    // --- Focus & Blur for Timer ---

    window.addEventListener('blur', () => {
        if (taskBeingViewed) {
            taskViewStartTime = Date.now();
            startTimerInterval();
        }
    });

    window.addEventListener('focus', () => {
        if (taskBeingViewed && taskViewStartTime) {
            const elapsedTime = Date.now() - taskViewStartTime;
            accumulatedTime += elapsedTime;
            taskViewStartTime = null;

            const requiredTime = taskBeingViewed.task.duration * 1000;

            if (accumulatedTime >= requiredTime) {
                // Timer completed, show complete button and hide skip button
                const visitBtn = taskBeingViewed.taskItemEl.querySelector('.btn-visit');
                const skipBtn = taskBeingViewed.taskItemEl.querySelector('.btn-skip');
                const completeBtn = taskBeingViewed.taskItemEl.querySelector('.btn-complete');
                if (visitBtn) visitBtn.style.display = 'none';
                if (skipBtn) skipBtn.style.display = 'none';
                if (completeBtn) completeBtn.style.display = 'inline-block';
            } else {
                // Timer not completed yet, show modal with time remaining
                const remainingTime = Math.ceil((requiredTime - accumulatedTime) / 1000);
                showModal(remainingTime);
            }
        }
        
        if (!taskBeingViewed) {
            resetDocumentTitle();
        }
        updateTimerDisplay();
    });

    // Simple modal function
    function showModal(seconds) {
        // Remove existing modal if any
        const existingModal = document.getElementById('task-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'task-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #e74c3c;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        modal.innerHTML = `
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
            ">×</button>
            <div style="color: #e74c3c; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                ${seconds} seconds left
            </div>
            <div style="color: #333; font-size: 14px;">
                Please return to the task page to continue
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 5000);
    }

    // Simple tab close detection
    window.addEventListener('beforeunload', () => {
        if (taskBeingViewed) {
            // Mark that we closed the tab
            sessionStorage.setItem('simpleTaskClosed', taskBeingViewed.task.id);
            sessionStorage.setItem('simpleTaskClosedTime', Date.now().toString());
        }
    });

    // Check if tab was closed on load
    document.addEventListener('DOMContentLoaded', () => {
        const closedTaskId = sessionStorage.getItem('simpleTaskClosed');
        const closedTime = sessionStorage.getItem('simpleTaskClosedTime');
        
        if (closedTaskId && closedTime) {
            // Clear the storage immediately
            sessionStorage.removeItem('simpleTaskClosed');
            sessionStorage.removeItem('simpleTaskClosedTime');
            
            // Show "closed too soon" modal after page loads
            setTimeout(() => {
                showClosedTooSoonModal(closedTaskId);
            }, 100);
        }
    });

    function showClosedTooSoonModal(taskId) {
        // Remove existing modal if any
        const existingModal = document.getElementById('closed-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'closed-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #e74c3c;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
        `;

        modal.innerHTML = `
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
            ">×</button>
            <div style="color: #e74c3c; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                You closed the task too soon
            </div>
            <div style="color: #333; font-size: 14px; margin-bottom: 15px;">
                The timer was reset. Click "Visit" to try again.
            </div>
            <div style="color: #666; font-size: 12px;">
                Tip: Keep the task tab open until the timer completes
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 8000);
    }

    async function completeSimpleTask(task, taskItemEl) {
        if (taskItemEl.classList.contains('done')) return;

        taskItemEl.classList.remove('viewing');
        taskItemEl.classList.add('done');
        const completeBtn = taskItemEl.querySelector('.btn-complete');
        completeBtn.textContent = 'Completed';
        completeBtn.disabled = true;

        stopTimerInterval();

        try {
            await window.UnifiedBalance.addBalance(
                task.reward,
                'simple_task_complete',
                `Completed: ${task.title}`
            );
            window.UnifiedBalance.markTaskCompleted(task.id);
            
            // Update balance display
            await renderBalance();
            
            // Remove task immediately after completion (like PTC page)
            setTimeout(() => {
                taskItemEl.remove();
                
                // Check if no tasks left and show empty state
                if (taskListEl.querySelectorAll('.task-item').length === 0) {
                    taskListEl.innerHTML = '<p class="empty-state">No available tasks. Check back later!</p>';
                }
            }, 1000); // Brief delay to show completion before removal
            
            notifyTaskReady(taskItemEl);
        } catch (error) {
            console.error('Failed to update balance:', error);
            taskItemEl.classList.remove('done');
            completeBtn.textContent = 'Complete';
            completeBtn.disabled = false;
            updateTaskStatus(taskItemEl, 'Ready when you are');
            alert(`Error updating balance: ${error.message}`);
            resetDocumentTitle();
        }
    }

    // Initial load
    initialize();
});
