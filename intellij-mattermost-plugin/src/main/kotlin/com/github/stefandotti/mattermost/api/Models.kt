package com.github.stefandotti.mattermost.api

data class MattermostTeam(
    val id: String,
    val displayName: String,
)

data class MattermostChannel(
    val id: String,
    val teamId: String,
    val displayName: String,
)

internal data class MattermostPostRequest(
    val channel_id: String,
    val message: String,
)
