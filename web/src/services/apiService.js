console.log("🌐 API Service загружен!");

class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getTasks() {
        return this.request('/todos');
    }

    async createTask(taskData) {
        return this.request('/todos', {
            method: 'POST',
            body: JSON.stringify({
                text: taskData.text,
                status: taskData.completed || false
            })
        });
    }

    async updateTask(id, taskData) {
        return this.request(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                text: taskData.text
            })
        });
    }

    async deleteTask(id) {
        return this.request(`/todos/${id}`, {
            method: 'DELETE'
        });
    }

    async completeTask(id) {
        return this.request(`/todos/${id}/complete`, {
            method: 'PATCH'
        });
    }

    async uncompleteTask(id) {
        return this.request(`/todos/${id}/uncomplete`, {
            method: 'PATCH'
        });
    }

    async replaceTasks(tasks) {
        return this.request('/todos/bulk', {
            method: 'POST',
            body: JSON.stringify(tasks.map(task => ({
                text: task.text,
                status: task.completed || false
            })))
        });
    }
}

window.apiService = new ApiService();