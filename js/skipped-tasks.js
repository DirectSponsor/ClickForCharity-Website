/**
 * Skipped Tasks - Shows tasks user has skipped
 * Works with complex tasks API and server-side storage
 */

(function() {
    'use strict';

    let userId = null;
    let allTasks = [];
    let skippedTaskIds = [];
    let expandedTasks = new Set();

    function init() {
        if (!window.auth || typeof window.auth.getSession !== 'function') {
            console.log('Auth system not ready, waiting...');
            setTimeout(init, 500);
            return;
        }
        
        const session = window.auth.getSession();
        
        if (!session || !session.combined_user_id) {
            console.log('User not logged in');
            return;
        }
        
        userId = session.combined_user_id;
        loadSkippedTasks();
    }

    async function loadSkippedTasks() {
        try {
            // Load all tasks
            const tasksResponse = await fetch(`api/get-skipped-tasks.php?user_id=${encodeURIComponent(userId)}`);
            const data = await tasksResponse.json();

            if (data.success) {
                allTasks = data.tasks || [];
                skippedTaskIds = data.skippedTaskIds || [];
                renderSkippedTasks();
            } else {
                console.error('Failed to load skipped tasks:', data.error);
                showEmptyState('Error loading tasks. Please refresh the page.');
            }
        } catch (error) {
            console.error('Error loading skipped tasks:', error);
            showEmptyState('Network error. Please check your connection.');
        }
    }

    function renderSkippedTasks() {
        const container = document.getElementById('skipped-task-list');
        
        if (!container) return;

        if (allTasks.length === 0) {
            showEmptyState('No skipped tasks. You haven\'t skipped any tasks yet!');
            return;
        }

        container.innerHTML = allTasks.map(task => createSkippedTaskCard(task)).join('');
    }

    function createSkippedTaskCard(task) {
        const isExpanded = expandedTasks.has(task.id);
        
        return `
            <div class="task-item skipped-task" data-task-id="${task.id}">
                <div class="task-content" onclick="toggleSkippedTask('${task.id}')">
                    <div class="task-header">
                        <h4>${task.title}</h4>
                        <p class="task-short-description">${task.shortDescription}</p>
                        <p class="task-meta">Reward: ${task.reward} coins</p>
                        <span class="platform-badge">${task.platform}</span>
                    </div>
                    <div class="task-details ${isExpanded ? 'expanded' : ''}" style="display: ${isExpanded ? 'block' : 'none'};">
                        <div class="task-instructions">
                            <p><strong>Instructions:</strong></p>
                            <pre>${task.instructions}</pre>
                        </div>
                        <div class="task-actions">
                            <button class="btn-unskip" onclick="event.stopPropagation(); unskipTask('${task.id}')">Unskip Task</button>
                        </div>
                        <p class="task-status">This task was skipped. Click "Unskip Task" to restore it.</p>
                    </div>
                </div>
            </div>
        `;
    }

    window.toggleSkippedTask = function(taskId) {
        const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskItem) return;

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
    };

    window.unskipTask = async function(taskId) {
        try {
            const response = await fetch('api/unskip-task.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    task_id: taskId
                })
            });

            const data = await response.json();

            if (data.success) {
                const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskItem) {
                    taskItem.style.opacity = '0.5';
                    setTimeout(() => {
                        taskItem.remove();
                        
                        const container = document.getElementById('skipped-task-list');
                        if (container && container.querySelectorAll('.task-item').length === 0) {
                            showEmptyState('No skipped tasks. You haven\'t skipped any tasks yet!');
                        }
                    }, 300);
                }
                
                showNotification('✓ Task restored!', 'success');
            } else {
                showNotification(`✗ ${data.error || 'Failed to restore task'}`, 'error');
            }
        } catch (error) {
            console.error('Error unskipping task:', error);
            showNotification('✗ Network error. Please try again.', 'error');
        }
    };

    function showEmptyState(message) {
        const container = document.getElementById('skipped-task-list');
        if (container) {
            container.innerHTML = `<p class="empty-state">${message}</p>`;
        }
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.task-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `task-notification ${type}`;
        notification.textContent = message;
        
        const container = document.querySelector('.task-list-container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
