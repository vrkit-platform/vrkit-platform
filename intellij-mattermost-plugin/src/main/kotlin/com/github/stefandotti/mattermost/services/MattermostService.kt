package com.github.stefandotti.mattermost.services

import com.github.stefandotti.mattermost.api.MattermostChannel
import com.github.stefandotti.mattermost.api.MattermostClient
import com.github.stefandotti.mattermost.api.MattermostTeam
import com.github.stefandotti.mattermost.settings.MattermostSettings
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.util.concurrency.AppExecutorUtil
import java.util.concurrent.atomic.AtomicReference

@Service(Service.Level.APP)
class MattermostService {
    private val client = MattermostClient()
    private val settings: MattermostSettings = MattermostSettings.getInstance()
    private val teamsRef = AtomicReference<List<MattermostTeam>>(emptyList())
    private val channelsRef = AtomicReference<Map<String, List<MattermostChannel>>>(emptyMap())

    fun refreshTeams(onCompleted: (Result<List<MattermostTeam>>) -> Unit) {
        if (!settings.hasCredentials) {
            onCompleted(Result.failure(IllegalStateException("Mattermost credentials are not configured.")))
            return
        }
        executeAsync({ client.fetchTeams() }) { result ->
            result.onSuccess { teamsRef.set(it) }
            onCompleted(result)
        }
    }

    fun refreshChannels(teamId: String, onCompleted: (Result<List<MattermostChannel>>) -> Unit) {
        if (!settings.hasCredentials) {
            onCompleted(Result.failure(IllegalStateException("Mattermost credentials are not configured.")))
            return
        }
        val cached = channelsRef.get()[teamId]
        if (cached != null) {
            onCompleted(Result.success(cached))
            return
        }
        executeAsync({ client.fetchChannels(teamId) }) { result ->
            result.onSuccess { channels ->
                channelsRef.updateAndGet { current ->
                    val mutable = HashMap(current)
                    mutable[teamId] = channels
                    mutable
                }
            }
            onCompleted(result)
        }
    }

    fun sendMessage(channelId: String, message: String, onCompleted: (Result<Unit>) -> Unit) {
        if (!settings.hasCredentials) {
            onCompleted(Result.failure(IllegalStateException("Mattermost credentials are not configured.")))
            return
        }
        executeAsync({ client.postMessage(channelId, message) }) { result ->
            onCompleted(result)
        }
    }

    fun knownTeams(): List<MattermostTeam> = teamsRef.get()

    fun knownChannels(teamId: String): List<MattermostChannel> = channelsRef.get()[teamId].orEmpty()

    private fun <T> executeAsync(task: () -> Result<T>, callback: (Result<T>) -> Unit) {
        AppExecutorUtil.getAppExecutorService().submit {
            val result = task()
            ApplicationManager.getApplication().invokeLater({ callback(result) })
        }
    }

    companion object {
        fun getInstance(): MattermostService = service()
    }
}
