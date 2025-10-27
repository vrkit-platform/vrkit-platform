package com.github.stefandotti.mattermost.settings

import com.github.stefandotti.mattermost.services.MattermostNotifier
import com.github.stefandotti.mattermost.services.MattermostService
import com.intellij.openapi.options.BoundConfigurable
import com.intellij.openapi.options.ConfigurationException
import com.intellij.ui.dsl.builder.Align
import com.intellij.ui.dsl.builder.COLUMNS_LARGE
import com.intellij.ui.dsl.builder.bindText
import com.intellij.ui.dsl.builder.panel

class MattermostConfigurable : BoundConfigurable("Mattermost") {

    private val settings = MattermostSettings.getInstance()
    private val state = settings.copyState()

    override fun reset() {
        val stored = settings.state
        state.serverUrl = stored.serverUrl
        state.personalAccessToken = stored.personalAccessToken
        state.defaultTeamId = stored.defaultTeamId
        state.defaultChannelId = stored.defaultChannelId
        super.reset()
    }

    override fun apply() {
        if (state.serverUrl.isBlank() xor state.personalAccessToken.isBlank()) {
            throw ConfigurationException("Both the server URL and the personal access token must be provided.")
        }
        settings.loadState(state.copy())
        if (settings.hasCredentials) {
            MattermostService.getInstance().refreshTeams { _ -> }
        }
    }

    override fun isModified(): Boolean = state != settings.state

    override fun createPanel() = panel {
        group("Connection") {
            row("Server URL") {
                textField()
                    .columns(COLUMNS_LARGE)
                    .bindText(state::serverUrl)
                    .comment("Example: https://mattermost.example.com")
            }
            row("Personal Token") {
                passwordField()
                    .columns(COLUMNS_LARGE)
                    .bindText(state::personalAccessToken)
                    .comment("Create a personal access token in your Mattermost profile")
            }
        }
        group("Defaults") {
            row("Default Team ID") {
                textField()
                    .columns(COLUMNS_LARGE)
                    .bindText({ state.defaultTeamId.orEmpty() }, { state.defaultTeamId = it.ifBlank { null } })
            }
            row("Default Channel ID") {
                textField()
                    .columns(COLUMNS_LARGE)
                    .bindText({ state.defaultChannelId.orEmpty() }, { state.defaultChannelId = it.ifBlank { null } })
            }
        }
        row {
            button("Test Connection") {
                MattermostService.getInstance().refreshTeams { result ->
                    result.onSuccess {
                        MattermostNotifier.info("Mattermost", "Successfully connected to Mattermost")
                    }.onFailure {
                        MattermostNotifier.error("Mattermost", it.message ?: "Unknown error")
                    }
                }
            }.align(Align.LEFT)
        }
    }
}
