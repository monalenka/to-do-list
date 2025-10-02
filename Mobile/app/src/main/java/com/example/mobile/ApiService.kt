package com.example.mobile

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface TodoApiService {
    @GET("todos")
    suspend fun getTodos(): List<TodoItem>

    @POST("todos")
    suspend fun createTodo(@Body todo: TodoItem): TodoItem

    @PUT("todos/{id}")
    suspend fun updateTodo(@Path("id") id: Long, @Body todo: TodoItem): TodoItem

    @PATCH("todos/{id}/complete")
    suspend fun completeTodo(@Path("id") id: Long): TodoItem

    @PATCH("todos/{id}/uncomplete")
    suspend fun uncompleteTodo(@Path("id") id: Long): TodoItem

    @DELETE("todos/{id}")
    suspend fun deleteTodo(@Path("id") id: Long)
}

object TodoApi {
    private const val BASE_URL = "https://b24700db8daca2.lhr.life/api/"

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val service: TodoApiService = retrofit.create(TodoApiService::class.java)
}