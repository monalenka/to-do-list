package com.example.mobile

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DataManager(private val context: Context) {
    private val fileHelper = FileHelper(context)
    private val networkHelper = NetworkHelper()

    private var todoItems = mutableListOf<TodoItem>()

    fun getTodos(): List<TodoItem> = todoItems.toList()

    fun setTodos(newTodos: List<TodoItem>) {
        todoItems.clear()
        todoItems.addAll(newTodos)
    }
}