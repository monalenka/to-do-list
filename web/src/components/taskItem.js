class TaskItem {
    constructor(task, onUpdate, onDelete, onToggle) {
        this.task = task;
        this.onUpdate = onUpdate;
        this.onDelete = onDelete;
        this.onToggle = onToggle;
        this.isEditing = false;
    }

    createElement() {
        const li = document.createElement('li');
        li.className = `task-item ${this.task.completed ? 'completed' : ''}`;
        li.dataset.taskId = this.task.id;

        li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${this.task.completed ? 'checked' : ''}>
                <span class="task-text">${this.escapeHtml(this.task.text)}</span>
                <input type="text" class="task-edit-input" value="${this.escapeHtml(this.task.text)}" style="display: none;">
            </div>
            <div class="task-actions">
                <button class="btn-edit" title="Редактировать">✏️</button>
                <button class="btn-delete" title="Удалить">🗑️</button>
            </div>
        `;

        this.bindEvents(li);
        return li;
    }

    bindEvents(element) {
        const checkbox = element.querySelector('.task-checkbox');
        const editBtn = element.querySelector('.btn-edit');
        const deleteBtn = element.querySelector('.btn-delete');
        const taskText = element.querySelector('.task-text');
        const editInput = element.querySelector('.task-edit-input');

        checkbox.addEventListener('change', () => {
            this.onToggle(this.task.id);
        });

        editBtn.addEventListener('click', () => {
            this.toggleEditMode(element);
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                this.onDelete(this.task.id);
            }
        });

        editInput.addEventListener('blur', () => {
            this.saveEdit(element);
        });

        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveEdit(element);
            } else if (e.key === 'Escape') {
                this.cancelEdit(element);
            }
        });

        taskText.addEventListener('dblclick', () => {
            this.toggleEditMode(element);
        });
    }

    toggleEditMode(element) {
        const taskText = element.querySelector('.task-text');
        const editInput = element.querySelector('.task-edit-input');
        const editBtn = element.querySelector('.btn-edit');

        if (this.isEditing) {
            this.saveEdit(element);
        } else {
            this.isEditing = true;
            taskText.style.display = 'none';
            editInput.style.display = 'block';
            editInput.focus();
            editInput.select();
            editBtn.textContent = '💾';
            editBtn.title = 'Сохранить';
        }
    }

    saveEdit(element) {
        const taskText = element.querySelector('.task-text');
        const editInput = element.querySelector('.task-edit-input');
        const editBtn = element.querySelector('.btn-edit');

        const newText = editInput.value.trim();

        if (newText && newText !== this.task.text) {
            try {
                this.onUpdate(this.task.id, newText);
                this.task.text = newText;
                taskText.textContent = newText;
            } catch (error) {
                alert('Ошибка при обновлении задачи: ' + error.message);
                editInput.value = this.task.text;
            }
        }

        this.isEditing = false;
        taskText.style.display = 'block';
        editInput.style.display = 'none';
        editBtn.textContent = '✏️';
        editBtn.title = 'Редактировать';
    }

    cancelEdit(element) {
        const taskText = element.querySelector('.task-text');
        const editInput = element.querySelector('.task-edit-input');
        const editBtn = element.querySelector('.btn-edit');

        this.isEditing = false;
        editInput.value = this.task.text;
        taskText.style.display = 'block';
        editInput.style.display = 'none';
        editBtn.textContent = '✏️';
        editBtn.title = 'Редактировать';
    }

    updateDisplay(element) {
        const checkbox = element.querySelector('.task-checkbox');
        const taskText = element.querySelector('.task-text');
        const editInput = element.querySelector('.task-edit-input');

        checkbox.checked = this.task.completed;
        taskText.textContent = this.task.text;
        editInput.value = this.task.text;

        if (this.task.completed) {
            element.classList.add('completed');
        } else {
            element.classList.remove('completed');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.TaskItem = TaskItem;