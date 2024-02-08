import QtQuick
import QtQuick.Controls
import QtQuick.Window
import QtQuick.Layouts
import QtQuick.Templates as T
import "components"

//  as ActionMenuFloating
import ThemeEngine

Item {

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
            // right: parent.right
        }

        Menu {
            title: qsTr("File")

            MenuItem {
                text: qsTr("Do nothing")

                onTriggered: console.log("Do nothing action triggered")
            }
            MenuItem {
                text: qsTr("&Exit")

                onTriggered: Qt.quit()
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
