from flask import request, jsonify
from app import db
from app.models import Todo

def init_routes(app):
    
    @app.route('/api/todos', methods=['GET'])
    def get_todos():
        status_filter = request.args.get('status')  # /api/todos?status=true
        sort_by = request.args.get('sort_by', 'id')  # /api/todos?sort_by=text
        
        todos = Todo.query
        
        if status_filter is not None:
            if status_filter.lower() == 'true':
                todos = todos.filter_by(status=True)
            elif status_filter.lower() == 'false':
                todos = todos.filter_by(status=False)
        
        if sort_by == 'text':
            todos = todos.order_by(Todo.text.asc())
        elif sort_by == 'status':
            todos = todos.order_by(Todo.status.desc())
        else:
            todos = todos.order_by(Todo.id.asc())
        
        return jsonify([todo.to_dict() for todo in todos.all()])
    
    @app.route('/api/todos', methods=['POST'])
    def add_todo():
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        new_todo = Todo(
            text=data['text'],
            status=data.get('status', False)
        )
        
        db.session.add(new_todo)
        db.session.commit()
        
        return jsonify(new_todo.to_dict()), 201
    
    @app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
    def delete_todo(todo_id):
        todo = Todo.query.get_or_404(todo_id)
        
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify({'message': 'Todo deleted successfully'})
    
    @app.route('/api/todos/<int:todo_id>', methods=['PUT'])
    def update_todo(todo_id):
        todo = Todo.query.get_or_404(todo_id)
        data = request.get_json()
        
        if 'text' in data:
            todo.text = data['text']
        
        db.session.commit()
        
        return jsonify(todo.to_dict())
    
    @app.route('/api/todos/<int:todo_id>/complete', methods=['PATCH'])
    def complete_todo(todo_id):
        todo = Todo.query.get_or_404(todo_id)
        todo.status = True
        db.session.commit()
        
        return jsonify(todo.to_dict())
    
    @app.route('/api/todos/<int:todo_id>/uncomplete', methods=['PATCH'])
    def uncomplete_todo(todo_id):
        todo = Todo.query.get_or_404(todo_id)
        todo.status = False
        db.session.commit()
        
        return jsonify(todo.to_dict())
    
    @app.route('/api/todos/batch', methods=['POST'])
    def batch_add_todos():
        data = request.get_json()
    
        if not isinstance(data, list):
            return jsonify({'error': 'Expected a list of todos'}), 400
    
        new_todos = []
        for item in data:
            if 'text' in item:
                todo = Todo(
                    text=item['text'],
                    status=item.get('status', False)
                )
                db.session.add(todo)
                new_todos.append(todo)
    
        db.session.commit()
    
        return jsonify([todo.to_dict() for todo in new_todos]), 201
    

    @app.route('/api/todos/bulk', methods=['POST'])
    def replace_todos():
        data = request.get_json()
    
        if not isinstance(data, list):
            return jsonify({'error': 'Expected a list of todos'}), 400
    
        Todo.query.delete()
    
        new_todos = []
        for item in data:
            if 'text' in item:
                todo = Todo(
                    text=item['text'],
                    status=item.get('status', False)
                )
                db.session.add(todo)
                new_todos.append(todo)
    
        db.session.commit()
    
        return jsonify({
            'message': f'Successfully replaced todos. Added {len(new_todos)} new items.',
            'todos': [todo.to_dict() for todo in new_todos]
        }), 201