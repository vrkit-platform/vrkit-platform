import QtQuick
import QtCore
import QtQuick.Controls
import QtQuick.Window
import QtQuick.Dialogs
import QtQuick.Layouts
import Qt.labs.platform as Platform
import QtQuick.Templates as T

import ThemeEngine

ButtonIconThemed {
    id: control
    backgroundColor: "transparent"
    borderColor: Theme.colorBlue

    // settings
    backgroundVisible: false
    borderVisible: control.hovered
    highlightColor: Theme.colorBlue
    highlightMode: "border"



}
