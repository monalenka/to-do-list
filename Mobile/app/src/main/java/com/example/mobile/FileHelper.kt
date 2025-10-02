package com.example.mobile

import android.content.Context
import android.net.Uri
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.*

class FileHelper(private val context: Context) {
    private val gson = Gson()

    //через путь
    fun saveToFile(todoItems: List<TodoItem>, filePath: String): Boolean {
        return try {
            println("Сохраняем ${todoItems.size} задач в: $filePath")

            val jsonString = gson.toJson(todoItems)
            File(filePath).writeText(jsonString)

            val file = File(filePath)
            if (file.exists()) {
                println("Файл создан, размер: ${file.length()} bytes")
                true
            } else {
                println("Файл не создался!")
                false
            }
        } catch (e: Exception) {
            println("Ошибка сохранения: ${e.message}")
            e.printStackTrace()
            false
        }
    }

    fun readFromFile(filePath: String): List<TodoItem> {
        return try {
            val file = File(filePath)
            println("Читаем файл: $filePath")
            println("Файл существует: ${file.exists()}")
            println("Размер файла: ${file.length()} bytes")

            if (!file.exists() || file.length() == 0L) {
                println("Файл не существует или пустой")
                return emptyList()
            }

            val jsonString = file.readText()
            println("Прочитано из файла: $jsonString")

            val type = object : TypeToken<List<TodoItem>>() {}.type
            val result = gson.fromJson<List<TodoItem>>(jsonString, type) ?: emptyList()

            println("Загружено ${result.size} задач:")
            result.forEach { println(" - ${it.text} (${it.isCompleted})") }

            result
        } catch (e: Exception) {
            println("Ошибка загрузки: ${e.message}")
            e.printStackTrace()
            emptyList()
        }
    }

    fun saveToUri(context: Context, todoItems: List<TodoItem>, uri: Uri): Boolean {
        return try {
            println("Сохраняем ${todoItems.size} задач в URI: $uri")

            if (todoItems.isEmpty()) {
                println("ВНИМАНИЕ: Нет задач для сохранения!")
                return false
            }

            val jsonString = gson.toJson(todoItems)
            println("JSON строка: $jsonString")

            context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                outputStream.write(jsonString.toByteArray())
                println("Данные записаны успешно")
                true
            } ?: run {
                println("Не удалось открыть OutputStream для URI")
                false
            }
        } catch (e: Exception) {
            println("Ошибка сохранения в URI: ${e.message}")
            e.printStackTrace()
            false
        }
    }

    fun readFromUri(context: Context, uri: Uri): List<TodoItem> {
        return try {
            println("Читаем из URI: $uri")

            val jsonString = context.contentResolver.openInputStream(uri)?.use { inputStream ->
                inputStream.bufferedReader().use { it.readText() }
            } ?: ""

            println("Прочитано из URI: '$jsonString'")

            if (jsonString.isEmpty()) {
                println("Файл пустой!")
                return emptyList()
            }

            val type = object : TypeToken<List<TodoItem>>() {}.type
            val result = gson.fromJson<List<TodoItem>>(jsonString, type) ?: emptyList()

            println("Загружено ${result.size} задач из URI")
            result
        } catch (e: Exception) {
            println("Ошибка чтения из URI: ${e.message}")
            e.printStackTrace()
            emptyList()
        }
    }
}