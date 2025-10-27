package com.github.stefandotti.mattermost.settings

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.service

@Service(Service.Level.APP)
@State(name = "MattermostSettings", storages = [Storage("mattermost.xml")])
class MattermostSettings : PersistentStateComponent<MattermostSettings.State> {

    data class State(
        var serverUrl: String = "",
        var personalAccessToken: String = "",
        var defaultTeamId: String? = null,
        var defaultChannelId: String? = null,
    )

    private var currentState = State()

    override fun getState(): State = currentState

    override fun loadState(state: State) {
        this.currentState = state
    }

    fun updateState(block: (State) -> State) {
        currentState = block(currentState)
    }

    fun copyState(): State = currentState.copy()

    val state: State
        get() = currentState

    val hasCredentials: Boolean
        get() = currentState.serverUrl.isNotBlank() && currentState.personalAccessToken.isNotBlank()

    companion object {
        fun getInstance(): MattermostSettings = service()
    }
}
