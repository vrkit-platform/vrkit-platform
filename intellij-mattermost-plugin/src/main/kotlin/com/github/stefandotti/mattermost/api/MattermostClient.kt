package com.github.stefandotti.mattermost.api

import com.github.stefandotti.mattermost.services.MattermostNotifier
import com.github.stefandotti.mattermost.settings.MattermostSettings
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.IOException
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

class MattermostClient(
    private val settings: MattermostSettings = MattermostSettings.getInstance(),
) {
    private val httpClient: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()

    fun fetchTeams(): Result<List<MattermostTeam>> = executeRequest("/api/v4/users/me/teams") { body ->
        parseArray(body) { element ->
            val obj = element.asJsonObject
            MattermostTeam(
                id = obj["id"].asString,
                displayName = obj["display_name"].asString,
            )
        }
    }

    fun fetchChannels(teamId: String): Result<List<MattermostChannel>> =
        executeRequest("/api/v4/users/me/teams/$teamId/channels") { body ->
            parseArray(body) { element ->
                val obj = element.asJsonObject
                MattermostChannel(
                    id = obj["id"].asString,
                    teamId = obj["team_id"].asString,
                    displayName = obj["display_name"].asString,
                )
            }
        }

    fun postMessage(channelId: String, message: String): Result<Unit> {
        val requestBody = JsonObject().apply {
            addProperty("channel_id", channelId)
            addProperty("message", message)
        }.toString()

        return executeRequest("/api/v4/posts", method = "POST", body = requestBody) {
            Result.success(Unit)
        }
    }

    private fun <T> executeRequest(
        endpoint: String,
        method: String = "GET",
        body: String? = null,
        parser: (String) -> Result<T>,
    ): Result<T> {
        val state = settings.state
        val baseUrl = state.serverUrl.trim().removeSuffix("/")
        val token = state.personalAccessToken.trim()

        if (baseUrl.isEmpty() || token.isEmpty()) {
            return Result.failure(IllegalStateException("Mattermost credentials are not configured."))
        }

        val requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl$endpoint"))
            .header("Authorization", "Bearer $token")
            .header("Accept", "application/json")
            .timeout(Duration.ofSeconds(15))

        if (method.equals("POST", ignoreCase = true)) {
            requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body ?: ""))
            requestBuilder.header("Content-Type", "application/json")
        } else {
            requestBuilder.GET()
        }

        return try {
            val response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString())
            when (response.statusCode()) {
                in 200..299 -> parser(response.body())
                401 -> Result.failure(IllegalStateException("Mattermost rejected the provided credentials."))
                else -> Result.failure(IOException("Mattermost request failed with status ${response.statusCode()}"))
            }
        } catch (ex: Exception) {
            MattermostNotifier.warn("Mattermost request failed", ex.message ?: ex.javaClass.simpleName)
            Result.failure(ex)
        }
    }

    private fun <T> parseArray(body: String, mapper: (element: com.google.gson.JsonElement) -> T): Result<List<T>> {
        return try {
            val json = JsonParser.parseString(body)
            if (json is JsonArray) {
                Result.success(json.map(mapper))
            } else {
                Result.failure(IllegalStateException("Unexpected response from Mattermost."))
            }
        } catch (ex: Exception) {
            Result.failure(ex)
        }
    }
}
