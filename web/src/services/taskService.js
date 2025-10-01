console.log("🔄 ЗАГРУЖЕНА НОВАЯ ВЕРСИЯ taskService.js с поддержкой API!");
class TaskService {
    constructor() {
        this.tasks = [];
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Инициализация TaskService...');
            const apiTasks = await window.apiService.getTasks();
            this.tasks = apiTasks.map(task => this.convertFromApi(task));
            this.isInitialized = true;
            console.log('TaskService инициализирован, загружено задач:', this.tasks.length);
        } catch (error) {
            console.error('Failed to initialize tasks:', error);
            this.tasks = [];
            this.isInitialized = true;
        }
    }

    convertFromApi(apiTask) {
        return {
            id: apiTask.id,
            text: apiTask.text,
            completed: apiTask.status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    convertToApi(task) {
        return {
            text: task.text,
            status: task.completed
        };
    }

    async createTask(text) {
        if (!text || text.trim() === '') {
            throw new Error('Текст задачи не может быть пустым');
        }

        try {
            const newTask = await window.apiService.createTask({
                text: text.trim(),
                completed: false
            });

            const task = this.convertFromApi(newTask);
            this.tasks.push(task);
            return task;
        } catch (error) {
            throw new Error('Ошибка при создании задачи: ' + error.message);
        }
    }

    getAllTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    async updateTaskText(id, newText) {
        if (!newText || newText.trim() === '') {
            throw new Error('Текст задачи не может быть пустым');
        }

        try {
            const updatedTask = await window.apiService.updateTask(id, {
                text: newText.trim()
            });

            const task = this.convertFromApi(updatedTask);
            const index = this.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.tasks[index] = task;
            }
            return task;
        } catch (error) {
            throw new Error('Ошибка при обновлении задачи: ' + error.message);
        }
    }

    async toggleTaskStatus(id) {
        try {
            const task = this.getTaskById(id);
            if (!task) throw new Error('Задача не найдена');

            let updatedTask;
            if (task.completed) {
                updatedTask = await window.apiService.uncompleteTask(id);
            } else {
                updatedTask = await window.apiService.completeTask(id);
            }

            const convertedTask = this.convertFromApi(updatedTask);
            const index = this.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.tasks[index] = convertedTask;
            }
            return convertedTask;
        } catch (error) {
            throw new Error('Ошибка при изменении статуса задачи: ' + error.message);
        }
    }

    async deleteTask(id) {
        try {
            await window.apiService.deleteTask(id);
            const index = this.tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                this.tasks.splice(index, 1);
                return true;
            }
            return false;
        } catch (error) {
            throw new Error('Ошибка при удалении задачи: ' + error.message);
        }
    }

    async loadTasks(tasksData) {
        if (!Array.isArray(tasksData)) {
            throw new Error('Данные должны быть массивом');
        }

        try {
            await window.apiService.replaceTasks(tasksData);

            const apiTasks = await window.apiService.getTasks();
            this.tasks = apiTasks.map(task => this.convertFromApi(task));
        } catch (error) {
            throw new Error('Ошибка при загрузке задач: ' + error.message);
        }
    }

    async clearAllTasks() {
        try {
            await window.apiService.replaceTasks([]);
            this.tasks = [];
        } catch (error) {
            throw new Error('Ошибка при очистке задач: ' + error.message);
        }
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
}

window.taskService = new TaskService();
window.taskService.initialize().catch(console.error);