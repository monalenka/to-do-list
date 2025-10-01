class TodoApp {
    constructor() {
        console.log("🔧 TodoApp создан");
        this.taskList = null;
        this.taskInput = null;
        this.addTaskBtn = null;
        this.saveBtn = null;
        this.loadBtn = null;
        this.fileInput = null;

        this.init();
    }

    async init() {

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            await this.setupApp();
        }
    }

    async setupApp() {

        try {
            this.taskList = new TaskList('taskList');
            this.taskInput = document.getElementById('taskInput');
            this.addTaskBtn = document.getElementById('addTaskBtn');
            this.saveBtn = document.getElementById('saveBtn');
            this.loadBtn = document.getElementById('loadBtn');
            this.fileInput = document.getElementById('fileInput');


            if (!this.taskInput || !this.addTaskBtn) {
                throw new Error('Не найдены необходимые элементы DOM');
            }

            this.bindEvents();

            console.log("🔄 Инициализируем TaskService...");
            await window.taskService.initialize();

            const tasks = window.taskService.getAllTasks();
            this.taskList.updateTasks(tasks);

            console.log("🎉 Приложение полностью инициализировано с API!");

        } catch (error) {
            console.error("!!Ошибка инициализации:", error);
            this.showError('Ошибка инициализации: ' + error.message);
        }
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveToFile());
        }

        if (this.loadBtn && this.fileInput) {
            this.loadBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.loadFromFile(e.target.files[0]));
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveToFile();
            }
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                if (this.fileInput) this.fileInput.click();
            }
        });
    }

    async addTask() {
        const text = this.taskInput.value.trim();

        if (!text) {
            this.showError('Введите текст задачи');
            this.taskInput.focus();
            return;
        }

        try {
            const newTask = await window.taskService.createTask(text);
            this.taskList.addTask(newTask);
            this.taskInput.value = '';
            this.taskInput.focus();

            this.showSuccess('Задача добавлена');
        } catch (error) {
            this.showError('Ошибка при добавлении задачи: ' + error.message);
        }
    }

    async saveToFile() {
        try {
            const tasks = window.taskService.getAllTasks();
            const dataStr = JSON.stringify(tasks, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `todo-list-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(link.href);
            this.showSuccess('Список сохранен в файл');
        } catch (error) {
            this.showError('Ошибка при сохранении: ' + error.message);
        }
    }

    async loadFromFile(file) {
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!Array.isArray(data)) {
                        throw new Error('Файл должен содержать массив задач');
                    }

                    await window.taskService.loadTasks(data);
                    const tasks = window.taskService.getAllTasks();
                    this.taskList.updateTasks(tasks);

                    this.showSuccess(`Загружено ${data.length} задач из файла`);
                } catch (parseError) {
                    this.showError('Ошибка при чтении файла: ' + parseError.message);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            this.showError('Ошибка при загрузке файла: ' + error.message);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        if (this.taskList && this.taskList.showNotification) {
            this.taskList.showNotification(message, type);
        } else {
            alert(type === 'error' ? '❌ ' + message : '✅ ' + message);
        }
    }
}

window.todoApp = new TodoApp();