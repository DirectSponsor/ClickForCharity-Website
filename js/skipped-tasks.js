document.addEventListener('DOMContentLoaded', async () => {

    const MOCK_SIMPLE_TASKS = [
        {
            id: 'complex_1',
            title: 'Follow DirectSponsor on X',
            shortDescription: 'Follow @DirectSponsorNet and like their latest post',
            instructions: '1. Click the Visit button to open DirectSponsor\'s X profile\n2. Click the Follow button\n3. Like their most recent post\n4. Return here and click Complete when done',
            url: 'https://twitter.com/DirectSponsorNet',
            reward: 25,
            duration: 20,
            type: 'social_follow'
        },
        {
            id: 'complex_2',
            title: 'Sign up for Publish0x',
            shortDescription: 'Create an account on Publish0x and earn crypto for reading',
            instructions: '1. Click Visit to go to Publish0x\n2. Click "Sign Up" and create your account\n3. Verify your email if required\n4. Browse the platform and read at least one article\n5. Return here and click Complete',
            url: 'https://www.publish0x.com/',
            reward: 50,
            duration: 45,
            type: 'signup'
        },
        {
            id: 'complex_3',
            title: 'Subscribe on Odysee',
            shortDescription: 'Follow DirectSponsor on Odysee platform',
            instructions: '1. Visit the DirectSponsor Odysee channel\n2. Click the Follow/Subscribe button\n3. Watch at least one short video\n4. Return and click Complete when finished',
            url: 'https://odysee.com/@DirectSponsor',
            reward: 30,
            duration: 25,
            type: 'social_follow'
        }
    ];

    const userBalanceEl = document.getElementById('user-balance');
    const userBalanceLabelEl = document.getElementById('user-balance-label');
    const taskListEl = document.getElementById('skipped-task-list');

    let simpleTasks = [];
    let expandedTasks = new Set(); // Track which tasks are expanded

    // --- API Data Fetching ---

    async function fetchSimpleTasksData() {
        // For now, return mock data. Later, replace with actual API call
        // const response = await fetch('/api/get-complex-tasks.php');
        // if (!response.ok) {
        //     throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // return response.json();
        
        return MOCK_SIMPLE_TASKS;
    }

    // --- Rendering ---

    async function renderBalance() {
        const balance = await window.UnifiedBalance.getBalance();
        const terms = window.UnifiedBalance.getTerminology();
        userBalanceEl.textContent = Math.floor(balance);
        userBalanceLabelEl.textContent = terms.currency;
    }

    function renderSkippedTasks() {
        taskListEl.innerHTML = ''; // Clear existing tasks

        if (!simpleTasks.length) {
            taskListEl.innerHTML = '<p class="empty-state">No tasks available.</p>';
            return;
        }

        const terms = window.UnifiedBalance.getTerminology();
        const rewardLabel = terms.currency;

        console.log('Rendering skipped tasks, total:', simpleTasks.length);

        // Filter only skipped tasks
        const skippedTasks = simpleTasks.filter(task => {
            const isSkipped = window.UnifiedBalance.isTaskSkipped(task.id);
            console.log(`Task ${task.id}: skipped=${isSkipped}`);
            return isSkipped;
        });

        console.log('Skipped tasks after filtering:', skippedTasks.length);

        if (skippedTasks.length === 0) {
            taskListEl.innerHTML = '<p class="empty-state">No skipped tasks. You haven\'t skipped any tasks yet!</p>';
            return;
        }

        skippedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item skipped-task';
            taskItem.dataset.taskId = task.id;
            
            const isExpanded = expandedTasks.has(task.id);
            const skippedTimestamp = window.UnifiedBalance.getTaskSkipTimestamp(task.id);
            const skipDate = skippedTimestamp ? new Date(skippedTimestamp).toLocaleDateString() : 'Unknown';
            
            taskItem.innerHTML = `
                <div class="task-content" data-task-content>
                    <div class="task-header">
                        <h4>${task.title}</h4>
                        <p class="task-short-description">${task.shortDescription}</p>
                        <p class="task-meta">Reward: ${task.reward} ${rewardLabel} | Skipped: ${skipDate}</p>
                    </div>
                    <div class="task-details ${isExpanded ? 'expanded' : ''}" style="display: ${isExpanded ? 'block' : 'none'};">
                        <div class="task-instructions">
                            <p><strong>Instructions:</strong></p>
                            <pre>${task.instructions}</pre>
                        </div>
                        <div class="task-actions">
                            <button class="btn-unskip" data-unskip-btn>Unskip Task</button>
                        </div>
                        <p class="task-status">This task was skipped. Click "Unskip Task" to restore it.</p>
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

    // --- Initialization ---

    async function initialize() {
        // Enable guest access with warning - data stored in localStorage only
        try {
            simpleTasks = await fetchSimpleTasksData();
            console.log('Simple tasks loaded for skipped page:', simpleTasks);
            await renderBalance();
            renderSkippedTasks();
        } catch (error) {
            console.error("Failed to initialize skipped tasks:", error);
            taskListEl.innerHTML = '<p>Error loading data. Please try again later.</p>';
        }
    }

    // --- Cross-Page Sync ---

    // Listen for storage changes from other pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'skipped_tasks' || e.key === 'completed_tasks') {
            console.log('🔄 Skipped tasks: Storage changed, refreshing...');
            renderSkippedTasks();
        }
    });

    // Refresh when page gains focus (user returns from another tab)
    window.addEventListener('focus', () => {
        console.log('🔄 Skipped tasks: Page focused, refreshing...');
        renderSkippedTasks();
    });

    // --- Event Listeners ---

    taskListEl.addEventListener('click', async (e) => {
        const taskContent = e.target.closest('[data-task-content]');
        const unskipBtn = e.target.closest('[data-unskip-btn]');

        // Handle task expansion/collapse
        if (taskContent && !unskipBtn) {
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

        // Handle unskip button
        if (unskipBtn) {
            const taskItem = unskipBtn.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            
            try {
                await window.UnifiedBalance.unskipTask(taskId);
                updateTaskStatus(taskItem, 'Task restored!');
                
                // Remove from view after a short delay
                setTimeout(() => {
                    taskItem.style.opacity = '0.5';
                    setTimeout(() => {
                        taskItem.remove();
                        // Check if no tasks left
                        if (taskListEl.querySelectorAll('.task-item').length === 0) {
                            taskListEl.innerHTML = '<p class="empty-state">No skipped tasks. You haven\'t skipped any tasks yet!</p>';
                        }
                    }, 300);
                }, 500);
            } catch (error) {
                console.error('Failed to unskip task:', error);
                alert('Error restoring task. Please try again.');
            }
        }
    });

    // Initial load
    initialize();
});
