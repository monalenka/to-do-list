from app.main import app
def print_current_todos():
    with app.app_context():
        from app.models import Todo
        todos = Todo.query.all()
        print("\n=== БД ===")
        for todo in todos:
            status = "ВЫПОЛНЕНО" if todo.status else "НЕ ВЫПОЛНЕНО"
            print(f"ID: {todo.id} | {status} | {todo.text}")

if __name__ == '__main__':
    print_current_todos()
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

#   venv\Scripts\activate
#   python run.py