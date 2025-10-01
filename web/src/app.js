class TodoApp {
    constructor() {
        this.taskList = null;
        this.taskInput = null;
        this.addTaskBtn = null;
        this.saveBtn = null;
        this.loadBtn = null;
        this.fileInput = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        try {
            this.taskList = new TaskList('taskList');
            this.taskInput = document.getElementById('taskInput');
            this.addTaskBtn = document.getElementById('addTaskBtn');
            this.saveBtn = document.getElementById('saveBtn');
            this.loadBtn = document.getElementById('loadBtn');
            this.fileInput = document.getElementById('fileInput');

            if (!this.taskInput || !this.addTaskBtn || !this.saveBtn || !this.loadBtn || !this.fileInput) {
                throw new Error('Не все необходимые элементы DOM найдены');
            }

            this.bindEvents();
            this.loadFromLocalStorage();
            this.updateTaskList();

            console.log('TO-DO List приложение успешно инициализировано');
        } catch (error) {
            console.error('Ошибка при инициализации приложения:', error);
            this.showError('Ошибка при инициализации приложения: ' + error.message);
        }
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        this.saveBtn.addEventListener('click', () => this.saveToFile());

        this.loadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.loadFromFile(e.target.files[0]));

        document.addEventListener('taskChanged', () => {
            this.saveToLocalStorage();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveToFile();
            }
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.fileInput.click();
            }
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        
        if (!text) {
            this.showError('Введите текст задачи');
            this.taskInput.focus();
            return;
        }

        try {
            const newTask = window.taskService.createTask(text);
            this.taskList.addTask(newTask);
            this.taskInput.value = '';
            this.taskInput.focus();
            
            this.saveToLocalStorage();
            this.dispatchTaskChanged();
            
            this.showSuccess('Задача добавлена');
        } catch (error) {
            this.showError('Ошибка при добавлении задачи: ' + error.message);
        }
    }

    saveToFile() {
        try {
            const tasks = window.taskService.getAllTasks();
            const filename = `todo-list-${new Date().toISOString().split('T')[0]}.json`;
            
            const success = StorageUtils.downloadAsJSON(tasks, filename);
            if (success) {
                this.showSuccess('Список сохранен в файл');
            } else {
                this.showError('Ошибка при сохранении файла');
            }
        } catch (error) {
            this.showError('Ошибка при сохранении: ' + error.message);
        }
    }

    async loadFromFile(file) {
        if (!file) return;

        try {
            const data = await StorageUtils.loadFromJSON(file);
            
            if (!Array.isArray(data)) {
                throw new Error('Файл должен содержать массив задач');
            }

            window.taskService.loadTasks(data);
            this.updateTaskList();
            this.saveToLocalStorage();
            this.dispatchTaskChanged();
            
            this.showSuccess(`Загружено ${data.length} задач из файла`);
        } catch (error) {
            this.showError('Ошибка при загрузке файла: ' + error.message);
        }
    }

    saveToLocalStorage() {
        try {
            const tasks = window.taskService.getAllTasks();
            const success = StorageUtils.saveToLocalStorage('todoList', tasks);
            
            if (!success) {
                console.warn('Не удалось сохранить в localStorage');
            }
        } catch (error) {
            console.error('Ошибка при сохранении в localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = StorageUtils.loadFromLocalStorage('todoList');
            if (data && Array.isArray(data)) {
                window.taskService.loadTasks(data);
                console.log(`Загружено ${data.length} задач из localStorage`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке из localStorage:', error);
        }
    }

    updateTaskList() {
        const tasks = window.taskService.getAllTasks();
        this.taskList.updateTasks(tasks);
    }

    dispatchTaskChanged() {
        const event = new CustomEvent('taskChanged', {
            detail: { tasks: window.taskService.getAllTasks() }
        });
        document.dispatchEvent(event);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
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

    getStats() {
        return window.taskService.getStats();
    }

    clearAllTasks() {
        if (confirm('Вы уверены, что хотите удалить все задачи?')) {
            window.taskService.clearAllTasks();
            this.updateTaskList();
            this.saveToLocalStorage();
            this.dispatchTaskChanged();
            this.showSuccess('Все задачи удалены');
        }
    }
}

const app = new TodoApp();
window.todoApp = app;