import QtQuick
import QtQuick.Controls
import QtQuick.Dialogs
import QtQuick.Window
import QtQuick.Layouts
import QtQuick.Templates as T
import "components"

import IRT
import IRTObjects

//  as ActionMenuFloating
import ThemeEngine

Item {
    MessageDialog {
        id: errorDialog

        buttons: MessageDialog.Ok
        informativeText: "Do you want to save your changes?"
        text: "The document has been modified."

        onAccepted: () => {}
    }

    FileDialog {
        id: openIBTFileDialog

        fileMode: FileDialog.OpenFile
        nameFilters: ["IBT files (*.ibt)"]
        selectedNameFilter.index: 1

        onAccepted: () => {
            console.log("Selected file: " + selectedFile);
            try {
                AppSessionManager.setConfig(AppSessionConfig.Disk, Qt.url(selectedFile));
            } catch (e) {
                showErrorMessage(e);
            }
        }
    }
    // MouseArea {
    //     acceptedButtons: Qt.BackButton | Qt.ForwardButton
    //     anchors.fill: parent
    //     z: 99
    //
    //     onClicked: mouse => {
    //         if (mouse.button === Qt.BackButton) {
    //             backAction();
    //         } else if (mouse.button === Qt.ForwardButton) {
    //             forwardAction();
    //         }
    //     }
    // }
    Shortcut {
        sequences: [StandardKey.Back, StandardKey.Backspace]

        onActivated: backAction()
    }
    Shortcut {
        sequences: [StandardKey.Forward]

        onActivated: () => {
            forwardAction();
        }
    }
    Shortcut {
        sequences: [StandardKey.Refresh]
        //onActivated: //
    }
    Shortcut {
        sequence: "Ctrl+F5"
        //onActivated: //
    }
    Shortcut {
        sequences: [StandardKey.Deselect, StandardKey.Cancel]

        onActivated: () => {
            deselectAction();
        }
    }
    Shortcut {
        sequences: [StandardKey.Close]

        onActivated: appWindow.close()
    }
    Shortcut {
        sequence: StandardKey.Quit

        onActivated: appWindow.exit(0)
    }

    CsdWindows {
    }

    // Menubar /////////////////////////////////////////////////////////////////
    MenuBar {
        id: appMenubar
        anchors {
            top: parent.top
            left: parent.left
        }
        Menu {
            title: qsTr("File")

            MenuItem {
                text: qsTr("&Exit")

                onTriggered: Qt.quit()
            }
        }

        Menu {
            title: qsTr("Mode")

            MenuItem {
                text: qsTr("Live")
                checkable: false
                checked: AppSessionManager.config.type === AppSessionConfig.Live
                onTriggered: AppSessionManager.setConfig(AppSessionConfig.Live)
            }
            MenuItem {
                checkable: false
                checked: AppSessionManager.config.type === AppSessionConfig.Disk
                text: qsTr("Replay")

                onTriggered: AppSessionManager.setConfig(AppSessionConfig.Disk)
            }

            MenuSeparator {
                visible: AppSessionManager.config.type === AppSessionConfig.Disk

            }

            MenuItem {
                enabled: AppSessionManager.config.type === AppSessionConfig.Disk
                text: qsTr("Open IBT file...")

                onTriggered: openIBTFileDialog.open()
            }

        }
    }

    DragHandler {
        target: appMenubar

        // Drag on the sidebar to drag the whole window // Qt 5.15+
        // Also, prevent clicks below this area
        onActiveChanged: if (active)
            appWindow.startSystemMove()
    }

    AppHeader {
        id: appHeader

    }
    Rectangle {
        id: appContent

        // function onStateChanged() {
        // }
        // anchors.fill: parent
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: appHeader.bottom
        color: Theme.colorBackground

        // Initial state
        state: "MainView"

        states: [
            State {
                name: "MainView"

                PropertyChanges {
                    enabled: true
                    focus: true
                    target: screenMainView
                    visible: true
                }
                PropertyChanges {
                    enabled: false
                    target: screenLapTiming
                    visible: false
                }
            },
            State {
                name: "LapTiming"

                PropertyChanges {
                    enabled: false
                    target: screenMainView
                    visible: false
                }
                PropertyChanges {
                    enabled: true
                    focus: true
                    target: screenLapTiming
                    visible: true
                }
            }
        ]

        Component.onCompleted: {
            screenLapTiming.loadScreen();
        }

        ScreenMainView {
            id: screenMainView

        }
        ScreenLapTiming {
            id: screenLapTiming

        }
    }
}
