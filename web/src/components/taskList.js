class TaskList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tasks = [];
        this.taskItems = new Map();
    }

    updateTasks(tasks) {
        this.tasks = tasks;
        this.render();
    }

    addTask(task) {
        this.tasks.push(task);
        this.render();
    }

    updateTask(taskId, updatedTask) {
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.render();
        }
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.taskItems.delete(taskId);
        this.render();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.render();
        }
    }

    clearTasks() {
        this.tasks = [];
        this.taskItems.clear();
        this.render();
    }

    render() {
        if (!this.container) {
            console.error('Контейнер для списка задач не найден');
            return;
        }

        this.container.innerHTML = '';

        const emptyState = document.getElementById('emptyState');
        if (this.tasks.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        this.tasks.forEach(task => {
            const taskItem = new TaskItem(
                task,
                this.onTaskUpdate.bind(this),
                this.onTaskDelete.bind(this),
                this.onTaskToggle.bind(this)
            );

            const taskElement = taskItem.createElement();
            this.container.appendChild(taskElement);
            this.taskItems.set(task.id, taskItem);
        });

        this.addStats();
    }

    addStats() {
        const stats = this.getStats();
        const statsElement = document.createElement('div');
        statsElement.className = 'task-stats';
        statsElement.innerHTML = `
            <div class="stats-item">
                <span class="stats-label">Всего:</span>
                <span class="stats-value">${stats.total}</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">Выполнено:</span>
                <span class="stats-value completed">${stats.completed}</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">Осталось:</span>
                <span class="stats-value pending">${stats.pending}</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">Прогресс:</span>
                <span class="stats-value">${stats.completionRate}%</span>
            </div>
        `;
        this.container.appendChild(statsElement);
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            pending,
            completionRate
        };
    }

    async onTaskUpdate(taskId, newText) {
        try {
            const updatedTask = await window.taskService.updateTaskText(taskId, newText);
            if (updatedTask) {
                this.updateTask(taskId, updatedTask);
                this.showNotification('Задача обновлена', 'success');
            }
        } catch (error) {
            this.showNotification('Ошибка при обновлении задачи: ' + error.message, 'error');
        }
    }

    async onTaskDelete(taskId) {
        try {
            const deleted = await window.taskService.deleteTask(taskId);
            if (deleted) {
                this.removeTask(taskId);
                this.showNotification('Задача удалена', 'success');
            }
        } catch (error) {
            this.showNotification('Ошибка при удалении задачи: ' + error.message, 'error');
        }
    }

    async onTaskToggle(taskId) {
        try {
            const updatedTask = await window.taskService.toggleTaskStatus(taskId);
            if (updatedTask) {
                this.updateTask(taskId, updatedTask);
                const status = updatedTask.completed ? 'выполнена' : 'не выполнена';
                this.showNotification(`Задача отмечена как ${status}`, 'info');
            }
        } catch (error) {
            this.showNotification('Ошибка при изменении статуса задачи: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getAllTasks() {
        return [...this.tasks];
    }

    filterTasks(filter) {
        const taskElements = this.container.querySelectorAll('.task-item');

        taskElements.forEach(element => {
            const taskId = parseInt(element.dataset.taskId);
            const task = this.tasks.find(t => t.id === taskId);

            if (!task) return;

            let shouldShow = true;
            switch (filter) {
                case 'completed':
                    shouldShow = task.completed;
                    break;
                case 'pending':
                    shouldShow = !task.completed;
                    break;
                case 'all':
                default:
                    shouldShow = true;
                    break;
            }

            element.style.display = shouldShow ? 'flex' : 'none';
        });
    }
}

window.TaskList = TaskList;