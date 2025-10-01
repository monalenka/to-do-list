class TaskService {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
    }

    createTask(text) {
        if (!text || text.trim() === '') {
            throw new Error('Текст задачи не может быть пустым');
        }

        const task = {
            id: this.nextId++,
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        return task;
    }

    getAllTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    }

    updateTaskText(id, newText) {
        if (!newText || newText.trim() === '') {
            throw new Error('Текст задачи не может быть пустым');
        }

        const task = this.getTaskById(id);
        if (task) {
            task.text = newText.trim();
            task.updatedAt = new Date().toISOString();
        }
        return task;
    }

    toggleTaskStatus(id) {
        const task = this.getTaskById(id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
        }
        return task;
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            return true;
        }
        return false;
    }

    loadTasks(tasksData) {
        if (!Array.isArray(tasksData)) {
            throw new Error('Данные должны быть массивом');
        }

        this.tasks = tasksData.map(task => ({
            id: task.id || this.nextId++,
            text: task.text || '',
            completed: Boolean(task.completed),
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt
        }));

        if (this.tasks.length > 0) {
            this.nextId = Math.max(...this.tasks.map(t => t.id)) + 1;
        }
    }

    clearAllTasks() {
        this.tasks = [];
        this.nextId = 1;
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
