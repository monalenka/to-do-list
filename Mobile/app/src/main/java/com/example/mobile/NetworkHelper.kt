package com.example.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

class NetworkHelper {
    private val useRealApi = true

    suspend fun loadTodosFromApi(): List<TodoItem> {
        return withContext(Dispatchers.IO) {
            try {
                val todos = TodoApi.service.getTodos()
                println("ПОБЕДА загружено ${todos.size} задач с сервера")

                todos.take(3).forEachIndexed { index, todo ->
                    println("   ${index + 1}. '${todo.text}' (id: ${todo.id}, выполнена: ${todo.isCompleted})")
                }

                todos
            } catch (e: Exception) {
                println("Ошибка загрузки ${e.message}")
                emptyList()
            }
        }
    }

    suspend fun saveTodoToApi(todo: TodoItem): TodoItem? {
        return withContext(Dispatchers.IO) {
            try {
                println("Отправляется задача на сервер '${todo.text}'")
                val result = TodoApi.service.createTodo(todo)
                println("ЗАДАЧА СОХРАНЕНА '${result.text}' (id: ${result.id})")
                result
            } catch (e: Exception) {
                println("Ошибка ${e.message}")
                null
            }
        }
    }

    suspend fun updateTodoStatus(todoId: Long, isCompleted: Boolean): TodoItem? {
        return withContext(Dispatchers.IO) {
            try {

                val result = if (isCompleted) {
                    TodoApi.service.completeTodo(todoId)
                } else {
                    TodoApi.service.uncompleteTodo(todoId)
                }

                result
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }


    suspend fun updateTodoInApi(todo: TodoItem): TodoItem? {
        return withContext(Dispatchers.IO) {
            try {
                val result = TodoApi.service.updateTodo(todo.id, todo)

                result
            } catch (e: Exception) {
                println("Ошибка обновления ${e.message}")
                e.printStackTrace()
                null
            }
        }
    }

    suspend fun deleteTodoFromApi(todoId: Long): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                TodoApi.service.deleteTodo(todoId)
                println("ЗАДАЧА УДАЛЕНА")
                true
            } catch (e: Exception) {
                println("Ошибка ${e.message}")
                false
            }
        }
    }
}