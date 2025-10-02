package com.example.mobile

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import java.io.File
import androidx.activity.result.contract.ActivityResultContracts
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var adapter: TodoAdapter
    private val todoItems = mutableListOf<TodoItem>()
    private lateinit var fileHelper: FileHelper
    private val STORAGE_PERMISSION_CODE = 100
    private val FILE_PICKER_REQUEST_CODE = 123

    private val handler = Handler(Looper.getMainLooper())
    private var isAutoRefreshEnabled = true
    private val AUTO_REFRESH_INTERVAL = 1000L // 5 секунд

    private val autoRefreshRunnable = object : Runnable {
        override fun run() {
            if (isAutoRefreshEnabled) {
                loadFromApiSilent()
                handler.postDelayed(this, AUTO_REFRESH_INTERVAL)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        fileHelper = FileHelper(this)
        setupRecyclerView()

        startAutoRefresh()

        val addButton: Button = findViewById(R.id.add_button)
        val saveButton: Button = findViewById(R.id.save_button)
        val loadButton: Button = findViewById(R.id.load_button)

        addButton.setOnClickListener { showAddDialog() }

        saveButton.setOnClickListener {
            Toast.makeText(this, "Выберите где сохранить файл", Toast.LENGTH_SHORT).show()
            showFileSaver()
        }

        loadButton.setOnClickListener {
            Toast.makeText(this, "Выберите файл для загрузки", Toast.LENGTH_SHORT).show()
            showFilePicker()
        }
    }

    private fun startAutoRefresh() {
        isAutoRefreshEnabled = true
        handler.postDelayed(autoRefreshRunnable, AUTO_REFRESH_INTERVAL)
    }

    private fun stopAutoRefresh() {
        isAutoRefreshEnabled = false
        handler.removeCallbacks(autoRefreshRunnable)
    }

    private fun loadFromApiSilent() {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val networkHelper = NetworkHelper()
                val todosFromApi = withContext(Dispatchers.IO) {
                    networkHelper.loadTodosFromApi()
                }

                if (hasDataChanged(todosFromApi)) {
                    todoItems.clear()
                    todoItems.addAll(todosFromApi)
                    adapter.notifyDataSetChanged()
                }
            } catch (e: Exception) {
                println("Ошибка автоматического обновления ${e.message}")
            }
        }
    }

    private fun hasDataChanged(newTodos: List<TodoItem>): Boolean {
        if (newTodos.size != todoItems.size) return true

        for (i in newTodos.indices) {
            val newTodo = newTodos[i]
            val oldTodo = todoItems.getOrNull(i)
            if (oldTodo == null ||
                newTodo.text != oldTodo.text ||
                newTodo.isCompleted != oldTodo.isCompleted) {
                return true
            }
        }
        return false
    }

    private fun loadFromApi() {
        stopAutoRefresh()

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val networkHelper = NetworkHelper()
                val todosFromApi = withContext(Dispatchers.IO) {
                    networkHelper.loadTodosFromApi()
                }

                todoItems.clear()
                todoItems.addAll(todosFromApi)
                adapter.notifyDataSetChanged()

                Toast.makeText(this@MainActivity, "Загружено ${todosFromApi.size} задач", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Ошибка загрузки: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                startAutoRefresh()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (!isAutoRefreshEnabled) {
            startAutoRefresh()
        }
    }

    override fun onPause() {
        super.onPause()
        stopAutoRefresh()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAutoRefresh()
    }

    private fun setupRecyclerView() {
        val recyclerView: RecyclerView = findViewById(R.id.recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = TodoAdapter(
            todoItems,
            onItemClick = { showEditDialog(it) },
            onItemLongClick = { deleteTodo(it) },
            onDeleteClick = { showDeleteConfirmation(it) }
        )
        recyclerView.adapter = adapter
    }

    private fun showDeleteConfirmation(todoItem: TodoItem) {
        AlertDialog.Builder(this)
            .setTitle("Удаление задачи")
            .setMessage("Точно удалить задачу \"${todoItem.text}\"?")
            .setPositiveButton("Удалить") { dialog, _ ->
                deleteTodo(todoItem)
                dialog.dismiss()
            }
            .setNegativeButton("Отмена") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    private fun showAddDialog() {
        val editText = EditText(this)
        editText.hint = "Введите описание дела"

        AlertDialog.Builder(this)
            .setTitle("Добавить дело")
            .setView(editText)
            .setPositiveButton("Добавить") { _, _ ->
                val text = editText.text.toString().trim()
                if (text.isNotBlank()) {
                    addTodo(TodoItem(text = text))
                }
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun showEditDialog(todoItem: TodoItem) {
        val editText = EditText(this).apply {
            setText(todoItem.text)
        }

        AlertDialog.Builder(this)
            .setTitle("Редактировать дело")
            .setView(editText)
            .setPositiveButton("Сохранить") { _, _ ->
                val newText = editText.text.toString().trim()
                if (newText.isNotBlank()) {
                    editTodo(todoItem, newText)
                }
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun addTodo(todoItem: TodoItem) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val networkHelper = NetworkHelper()
                val createdTodo = networkHelper.saveTodoToApi(todoItem)

                if (createdTodo != null) {
                    todoItems.add(createdTodo)
                    adapter.notifyItemInserted(todoItems.size - 1)
                    Toast.makeText(this@MainActivity, "Задача добавлена", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@MainActivity, "Ошибка при добавлении задачи", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Ошибка: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun editTodo(todoItem: TodoItem, newText: String) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val updatedTodo = todoItem.copy(text = newText)
                val networkHelper = NetworkHelper()
                val result = networkHelper.updateTodoInApi(updatedTodo)

                if (result != null) {
                    val index = todoItems.indexOfFirst { it.id == todoItem.id }
                    if (index != -1) {
                        todoItems[index] = result
                        adapter.notifyItemChanged(index)
                        Toast.makeText(this@MainActivity, "Задача обновлена", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Ошибка при обновлении задачи", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Ошибка: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun deleteTodo(todoItem: TodoItem) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val networkHelper = NetworkHelper()
                val success = networkHelper.deleteTodoFromApi(todoItem.id)

                if (success) {
                    val index = todoItems.indexOfFirst { it.id == todoItem.id }
                    if (index != -1) {
                        todoItems.removeAt(index)
                        adapter.notifyItemRemoved(index)
                        Toast.makeText(this@MainActivity, "Задача удалена", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Ошибка при удалении задачи", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Ошибка: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showFileSaver() {
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/json"
            putExtra(Intent.EXTRA_TITLE, "todos_${System.currentTimeMillis()}.json")
        }
        saveLauncher.launch(intent)
    }

    private fun showFilePicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/json"
        }
        loadLauncher.launch(intent)
    }

    private val saveLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                println("Сохранение в URI: $uri")
                val success = fileHelper.saveToUri(this, todoItems, uri)
                if (success) {
                    Toast.makeText(this, "Файл сохранен!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Ошибка сохранения", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private val loadLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                println("Загрузка из URI: $uri")
                val loadedTodos = fileHelper.readFromUri(this, uri)
                println("Получено ${loadedTodos.size} задач из файла")

                todoItems.clear()
                todoItems.addAll(loadedTodos)
                adapter.notifyDataSetChanged()
                Toast.makeText(this, "Загружено задач: ${loadedTodos.size}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}