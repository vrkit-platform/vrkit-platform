package com.github.stefandotti.mattermost.actions

import com.github.stefandotti.mattermost.services.MattermostNotifier
import com.github.stefandotti.mattermost.services.MattermostService
import com.github.stefandotti.mattermost.settings.MattermostSettings
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.DumbAware

class SendToMattermostAction : AnAction(), DumbAware {

    private val service = MattermostService.getInstance()
    private val settings = MattermostSettings.getInstance()

    override fun update(e: AnActionEvent) {
        val editor = e.getData(CommonDataKeys.EDITOR)
        e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project
        val editor = e.getData(CommonDataKeys.EDITOR)
        val selection = editor?.selectionModel?.selectedText?.trim()
        if (selection.isNullOrEmpty()) {
            MattermostNotifier.warn("Mattermost", "No text selected", project)
            return
        }
        val channelId = settings.state.defaultChannelId
        if (channelId.isNullOrBlank()) {
            MattermostNotifier.warn("Mattermost", "Configure the default channel in Mattermost settings", project)
            return
        }
        service.sendMessage(channelId, selection) { result ->
            result.onSuccess {
                MattermostNotifier.info("Mattermost", "Message sent", project)
            }.onFailure {
                MattermostNotifier.error("Mattermost", it.message ?: "Failed to send message", project)
            }
        }
    }
}
