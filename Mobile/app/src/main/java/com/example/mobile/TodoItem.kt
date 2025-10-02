package com.example.mobile

import com.google.gson.annotations.SerializedName

data class TodoItem(
    @SerializedName("id")
    val id: Long = System.currentTimeMillis(),

    @SerializedName("text")
    var text: String,

    @SerializedName("status")
    var isCompleted: Boolean = false
)