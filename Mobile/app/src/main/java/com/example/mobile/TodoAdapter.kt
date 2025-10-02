package com.example.mobile

import android.graphics.Color
import android.graphics.Paint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.widget.Toast

class TodoAdapter(
    private var todoItems: MutableList<TodoItem>,
    private val onItemClick: (TodoItem) -> Unit,
    private val onItemLongClick: (TodoItem) -> Unit,
    private val onDeleteClick: (TodoItem) -> Unit
) : RecyclerView.Adapter<TodoAdapter.ViewHolder>() {

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val textView: TextView = itemView.findViewById(R.id.todo_text)
        val checkContainer: LinearLayout = itemView.findViewById(R.id.check_container)
        val checkIcon: ImageView = itemView.findViewById(R.id.check_icon)
        val deleteButton: ImageButton = itemView.findViewById(R.id.delete_button)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.todo_item, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = todoItems[position]
        holder.textView.text = item.text

        if (item.isCompleted) {
            holder.textView.paintFlags = holder.textView.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
            holder.textView.setTextColor(Color.GRAY)
            holder.checkIcon.visibility = View.VISIBLE
            holder.checkContainer.setBackgroundResource(R.drawable.checkbox_background_checked)
        } else {
            holder.textView.paintFlags = holder.textView.paintFlags and Paint.STRIKE_THRU_TEXT_FLAG.inv()
            holder.textView.setTextColor(Color.BLACK)
            holder.checkIcon.visibility = View.INVISIBLE
            holder.checkContainer.setBackgroundResource(R.drawable.checkbox_background)
        }

        holder.itemView.setOnClickListener { onItemClick(item) }

        holder.itemView.setOnLongClickListener {
            onItemLongClick(item)
            true
        }

        holder.deleteButton.setOnClickListener { onDeleteClick(item) }

        holder.checkContainer.setOnClickListener {
            // Сохраняем старый статус для отката
            val oldStatus = item.isCompleted
            val currentItemId = item.id

            // Немедленно меняем статус для отзывчивости UI
            item.isCompleted = !oldStatus
            notifyItemChanged(position)

            println("🔄 Изменение статуса задачи:")
            println("   ID: $currentItemId")
            println("   Старый статус: $oldStatus")
            println("   Новый статус: ${item.isCompleted}")

            CoroutineScope(Dispatchers.Main).launch {
                try {
                    val networkHelper = NetworkHelper()

                    // Используем новый метод для изменения статуса
                    val result = networkHelper.updateTodoStatus(currentItemId, !oldStatus)

                    if (result != null) {
                        // Успех - обновляем данные с сервера
                        val updatedIndex = todoItems.indexOfFirst { it.id == currentItemId }
                        if (updatedIndex != -1) {
                            todoItems[updatedIndex] = result
                            println("✅ Статус успешно синхронизирован с сервером")

                            // Проверяем, что статус действительно изменился
                            if (todoItems[updatedIndex].isCompleted != oldStatus) {
                                println("✅ Статус подтвержден сервером")
                            } else {
                                println("⚠️ Статус на сервере не изменился как ожидалось")
                            }
                        }
                    } else {
                        // Ошибка - откатываем изменение
                        val rollbackIndex = todoItems.indexOfFirst { it.id == currentItemId }
                        if (rollbackIndex != -1) {
                            todoItems[rollbackIndex].isCompleted = oldStatus
                            notifyItemChanged(rollbackIndex)
                            Toast.makeText(holder.itemView.context, "Ошибка синхронизации статуса", Toast.LENGTH_SHORT).show()
                            println("❌ Ошибка синхронизации статуса")
                        }
                    }
                } catch (e: Exception) {
                    // Откатываем при исключении
                    val rollbackIndex = todoItems.indexOfFirst { it.id == currentItemId }
                    if (rollbackIndex != -1) {
                        todoItems[rollbackIndex].isCompleted = oldStatus
                        notifyItemChanged(rollbackIndex)
                        Toast.makeText(holder.itemView.context, "Ошибка: ${e.message}", Toast.LENGTH_SHORT).show()
                        println("❌ Исключение при обновлении статуса: ${e.message}")
                    }
                }
            }
        }
    }

    override fun getItemCount(): Int = todoItems.size

    fun updateList(newList: List<TodoItem>) {
        todoItems.clear()
        todoItems.addAll(newList)
        notifyDataSetChanged()
    }
}