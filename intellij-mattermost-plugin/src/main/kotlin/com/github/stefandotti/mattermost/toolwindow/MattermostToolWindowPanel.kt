package com.github.stefandotti.mattermost.toolwindow

import com.github.stefandotti.mattermost.api.MattermostChannel
import com.github.stefandotti.mattermost.api.MattermostTeam
import com.github.stefandotti.mattermost.services.MattermostNotifier
import com.github.stefandotti.mattermost.services.MattermostService
import com.github.stefandotti.mattermost.settings.MattermostSettings
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.ComboBox
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.panels.VerticalLayout
import java.awt.BorderLayout
import java.awt.event.ItemEvent
import javax.swing.JButton
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JTextArea
import javax.swing.ListCellRenderer

class MattermostToolWindowPanel(private val project: Project) {

    private val settings = MattermostSettings.getInstance()
    private val service = MattermostService.getInstance()

    private val teamComboBox = ComboBox<MattermostTeam>()
    private val channelComboBox = ComboBox<MattermostChannel>()
    private val messageArea = JTextArea(8, 40)
    private val sendButton = JButton("Send Message")
    private val refreshButton = JButton("Refresh")
    private val statusLabel = JLabel()

    val component: JComponent = JPanel(BorderLayout()).apply {
        val formPanel = JPanel(VerticalLayout(8)).apply {
            add(JLabel("Team"))
            add(teamComboBox)
            add(JLabel("Channel"))
            add(channelComboBox)
            add(JLabel("Message"))
            add(JBScrollPane(messageArea))
            add(sendButton)
            add(refreshButton)
            add(statusLabel)
        }
        add(formPanel, BorderLayout.NORTH)
    }

    init {
        teamComboBox.renderer = MattermostTeamRenderer()
        channelComboBox.renderer = MattermostChannelRenderer()

        teamComboBox.addItemListener { event ->
            if (event.stateChange == ItemEvent.SELECTED) {
                val team = event.item as? MattermostTeam ?: return@addItemListener
                settings.updateState { it.copy(defaultTeamId = team.id) }
                loadChannels(team)
            }
        }

        channelComboBox.addItemListener { event ->
            if (event.stateChange == ItemEvent.SELECTED) {
                val channel = event.item as? MattermostChannel ?: return@addItemListener
                settings.updateState { it.copy(defaultChannelId = channel.id) }
            }
        }

        refreshButton.addActionListener {
            refresh()
        }

        sendButton.addActionListener {
            val channel = channelComboBox.selectedItem as? MattermostChannel
            val message = messageArea.text.trim()
            if (channel == null) {
                MattermostNotifier.warn("Mattermost", "Select a channel before sending a message", project)
                return@addActionListener
            }
            if (message.isEmpty()) {
                MattermostNotifier.warn("Mattermost", "Message cannot be empty", project)
                return@addActionListener
            }
            sendButton.isEnabled = false
            service.sendMessage(channel.id, message) { result ->
                sendButton.isEnabled = true
                result.onSuccess {
                    messageArea.text = ""
                    MattermostNotifier.info("Mattermost", "Message sent", project)
                }.onFailure {
                    MattermostNotifier.error("Mattermost", it.message ?: "Unable to send message", project)
                }
            }
        }

        refresh()
    }

    private fun refresh() {
        if (!settings.hasCredentials) {
            statusLabel.text = "Configure Mattermost credentials in Settings"
            return
        }
        statusLabel.text = "Loading teams..."
        service.refreshTeams { result ->
            result.onSuccess { teams ->
                updateTeams(teams)
                statusLabel.text = if (teams.isEmpty()) {
                    "No teams available"
                } else {
                    "Teams loaded"
                }
            }.onFailure {
                statusLabel.text = it.message ?: "Failed to load teams"
                MattermostNotifier.error("Mattermost", statusLabel.text, project)
            }
        }
    }

    private fun loadChannels(team: MattermostTeam) {
        statusLabel.text = "Loading channels..."
        service.refreshChannels(team.id) { result ->
            result.onSuccess { channels ->
                updateChannels(channels)
                statusLabel.text = if (channels.isEmpty()) {
                    "No channels available"
                } else {
                    "Channels loaded"
                }
            }.onFailure {
                statusLabel.text = it.message ?: "Failed to load channels"
                MattermostNotifier.error("Mattermost", statusLabel.text, project)
            }
        }
    }

    private fun updateTeams(teams: List<MattermostTeam>) {
        teamComboBox.removeAllItems()
        teams.forEach { teamComboBox.addItem(it) }
        val defaultTeamId = settings.state.defaultTeamId
        val selected = teams.firstOrNull { it.id == defaultTeamId }
            ?: teams.firstOrNull()
        if (selected != null) {
            teamComboBox.selectedItem = selected
            loadChannels(selected)
        } else {
            updateChannels(emptyList())
        }
    }

    private fun updateChannels(channels: List<MattermostChannel>) {
        channelComboBox.removeAllItems()
        channels.forEach { channelComboBox.addItem(it) }
        val defaultChannelId = settings.state.defaultChannelId
        val selected = channels.firstOrNull { it.id == defaultChannelId }
            ?: channels.firstOrNull()
        if (selected != null) {
            channelComboBox.selectedItem = selected
        }
    }

    private class MattermostTeamRenderer : ListCellRenderer<MattermostTeam> {
        private val label = JLabel()
        override fun getListCellRendererComponent(
            list: javax.swing.JList<out MattermostTeam>,
            value: MattermostTeam?,
            index: Int,
            isSelected: Boolean,
            cellHasFocus: Boolean,
        ): java.awt.Component {
            label.text = value?.displayName ?: ""
            if (isSelected) {
                label.background = list.selectionBackground
                label.foreground = list.selectionForeground
            } else {
                label.background = list.background
                label.foreground = list.foreground
            }
            label.isOpaque = true
            return label
        }
    }

    private class MattermostChannelRenderer : ListCellRenderer<MattermostChannel> {
        private val label = JLabel()
        override fun getListCellRendererComponent(
            list: javax.swing.JList<out MattermostChannel>,
            value: MattermostChannel?,
            index: Int,
            isSelected: Boolean,
            cellHasFocus: Boolean,
        ): java.awt.Component {
            label.text = value?.displayName ?: ""
            if (isSelected) {
                label.background = list.selectionBackground
                label.foreground = list.selectionForeground
            } else {
                label.background = list.background
                label.foreground = list.foreground
            }
            label.isOpaque = true
            return label
        }
    }
}
