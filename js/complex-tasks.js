/**
 * Complex Tasks - Social Media Tasks System
 * Handles tabbed interface, expandable cards, timer, and manual completion
 */

(function() {
    'use strict';

    let userId = null;
    let allTasks = [];
    let activeTab = 'follows';
    let expandedTaskId = null;
    let taskTimers = {};

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

        attachEventListeners();
        loadTasks();
    }

    function attachEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });
    }

    function switchTab(tabName) {
        activeTab = tabName;
        
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        renderTasks();
    }

    async function loadTasks() {
        try {
            const response = await fetch(`api/get-complex-tasks.php?user_id=${encodeURIComponent(userId)}`);
            const data = await response.json();

            if (data.success) {
                allTasks = data.tasks || [];
                
                if (data.userPlatforms.length === 0) {
                    document.getElementById('no-platforms-notice').style.display = 'block';
                } else {
                    document.getElementById('no-platforms-notice').style.display = 'none';
                }
                
                renderTasks();
            } else {
                console.error('Failed to load tasks:', data.error);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    function renderTasks() {
        const categories = ['follows', 'engagements', 'signups'];
        
        categories.forEach(category => {
            const tasks = allTasks.filter(t => t.category === category);
            const container = document.getElementById(`${category}-tasks`);
            const emptyState = container.nextElementSibling;
            const countElement = document.getElementById(`${category}-count`);
            
            if (countElement) {
                countElement.textContent = `(${tasks.length})`;
            }
            
            if (tasks.length === 0) {
                container.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                container.innerHTML = tasks.map(task => createTaskCard(task)).join('');
                attachTaskEventListeners();
            }
        });
    }

    function createTaskCard(task) {
        const isExpanded = expandedTaskId === task.id;
        const timerState = taskTimers[task.id] || { running: false, timeLeft: task.duration, completed: false };
        
        return `
            <div class="complex-task-card ${isExpanded ? 'expanded' : ''}" data-task-id="${task.id}">
                <div class="task-compact" onclick="toggleTask('${task.id}')">
                    <div class="task-compact-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-short-desc">${task.shortDescription}</div>
                        ${task.requiresLogin ? '<span class="login-badge">Login required</span>' : ''}
                        <span class="platform-badge">${task.platform}</span>
                    </div>
                    <button class="btn-skip-compact" onclick="event.stopPropagation(); skipTask('${task.id}')">Skip</button>
                </div>
                
                <div class="task-expanded" style="display: ${isExpanded ? 'block' : 'none'}">
                    <div class="task-details">
                        <h3>${task.title}</h3>
                        <div class="task-reward">Reward: <strong>${task.reward} coins</strong></div>
                        <div class="task-instructions">
                            <h4>Instructions:</h4>
                            <pre>${task.instructions}</pre>
                        </div>
                    </div>
                    
                    <div class="task-actions">
                        <button class="btn-visit" onclick="visitTask('${task.id}', '${task.url}', ${task.duration})" ${timerState.running ? 'disabled' : ''}>
                            ${timerState.running ? 'Visiting...' : 'Visit'}
                        </button>
                        
                        <div class="task-timer" id="timer-${task.id}" style="display: ${timerState.running ? 'block' : 'none'}">
                            <span class="timer-text">Time remaining: <strong><span class="timer-value">${timerState.timeLeft}</span>s</strong></span>
                        </div>
                        
                        <button class="btn-complete" id="complete-${task.id}" onclick="completeTask('${task.id}')" style="display: ${timerState.completed ? 'block' : 'none'}">
                            Complete Task
                        </button>
                        
                        <button class="btn-skip" onclick="skipTask('${task.id}')">Skip</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.toggleTask = function(taskId) {
        if (expandedTaskId === taskId) {
            expandedTaskId = null;
        } else {
            expandedTaskId = taskId;
        }
        renderTasks();
    };

    window.visitTask = function(taskId, url, duration) {
        window.open(url, '_blank');
        
        taskTimers[taskId] = {
            running: true,
            timeLeft: duration,
            completed: false
        };
        
        renderTasks();
        
        const interval = setInterval(() => {
            if (!taskTimers[taskId] || !taskTimers[taskId].running) {
                clearInterval(interval);
                return;
            }
            
            taskTimers[taskId].timeLeft--;
            
            const timerElement = document.querySelector(`#timer-${taskId} .timer-value`);
            if (timerElement) {
                timerElement.textContent = taskTimers[taskId].timeLeft;
            }
            
            if (taskTimers[taskId].timeLeft <= 0) {
                clearInterval(interval);
                taskTimers[taskId].running = false;
                taskTimers[taskId].completed = true;
                renderTasks();
            }
        }, 1000);
    };

    window.completeTask = async function(taskId) {
        try {
            const completeBtn = document.getElementById(`complete-${taskId}`);
            if (completeBtn) {
                completeBtn.disabled = true;
                completeBtn.textContent = 'Completing...';
            }

            const response = await fetch('api/update-user-tasks.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    task_id: taskId,
                    action: 'complete'
                })
            });

            const data = await response.json();

            if (data.success) {
                delete taskTimers[taskId];
                expandedTaskId = null;
                
                showNotification(`✓ ${data.message}`, 'success');
                
                if (window.unifiedBalance) {
                    window.unifiedBalance.syncBalance();
                }
                
                await loadTasks();
            } else {
                showNotification(`✗ ${data.error || 'Failed to complete task'}`, 'error');
                if (completeBtn) {
                    completeBtn.disabled = false;
                    completeBtn.textContent = 'Complete Task';
                }
            }
        } catch (error) {
            console.error('Error completing task:', error);
            showNotification('✗ Network error. Please try again.', 'error');
        }
    };

    window.skipTask = async function(taskId) {
        if (!confirm('Are you sure you want to skip this task? You can unskip it later from the Skipped Tasks page.')) {
            return;
        }

        try {
            const response = await fetch('api/update-user-tasks.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    task_id: taskId,
                    action: 'skip'
                })
            });

            const data = await response.json();

            if (data.success) {
                delete taskTimers[taskId];
                expandedTaskId = null;
                
                showNotification('Task skipped', 'success');
                
                await loadTasks();
            } else {
                showNotification(`✗ ${data.error || 'Failed to skip task'}`, 'error');
            }
        } catch (error) {
            console.error('Error skipping task:', error);
            showNotification('✗ Network error. Please try again.', 'error');
        }
    };

    function attachTaskEventListeners() {
        // Event listeners are attached via onclick in HTML for simplicity
        // This function is here for future enhancements
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.task-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `task-notification ${type}`;
        notification.textContent = message;
        
        const content = document.getElementById('complex-tasks-content');
        content.insertBefore(notification, content.firstChild);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
