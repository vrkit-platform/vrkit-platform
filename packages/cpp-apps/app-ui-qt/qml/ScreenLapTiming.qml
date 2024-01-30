import QtQuick
import QtQuick.Controls

import QtQuick.Effects
import Qt5Compat.GraphicalEffects

import ThemeEngine

Loader {
    id: screenLapTiming
    anchors.fill: parent

    function loadScreen() {
        // load screen
        screenLapTiming.active = true

        // change screen
        appContent.state = "LapTiming"
    }

    function backAction() {
        if (screenLapTiming.status === Loader.Ready)
            screenLapTiming.item.backAction()
    }

    ////////////////////////////////////////////////////////////////////////////

    active: false
    asynchronous: false

    sourceComponent: Item {
        anchors.fill: parent

        function backAction() {
            screenMainView.loadScreen()
        }

        // MENUS ///////////////////////////////////////////////////////////////////

        Column {
            id: menusArea
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.right: parent.right
            z: 20

            Rectangle {
                id: rectangleActions
                anchors.left: parent.left
                anchors.right: parent.right

                height: 56
                Behavior on height { NumberAnimation { duration: 133 } }

                clip: true
                visible: (height > 0)
                color: Theme.colorActionbar

                // prevent clicks below this area
                MouseArea { anchors.fill: parent; acceptedButtons: Qt.AllButtons; }

                Row { // left
                    anchors.left: parent.left
                    anchors.leftMargin: 24
                    anchors.verticalCenter: parent.verticalCenter
                    visible: !singleColumn
                    spacing: 16

                    Text {
                        anchors.verticalCenter: parent.verticalCenter

                        text: "Action bar"
                        font.bold: true
                        font.pixelSize: Theme.fontSizeContentBig
                        color: Theme.colorActionbarContent
                        verticalAlignment: Text.AlignVCenter
                    }
                }
                //
                // Row { // middle
                //     anchors.centerIn: parent
                //     visible: !singleColumn
                //     spacing: 16
                //
                //     ButtonCompactable {
                //         text: "oneone"
                //         source: "qrc:/assets/icons_material/baseline-warning-24px.svg"
                //
                //         textColor: Theme.colorActionbarContent
                //         iconColor: Theme.colorActionbarContent
                //         backgroundColor: Theme.colorActionbarHighlight
                //
                //         compact: false
                //         onClicked: compact = !compact
                //     }
                //
                //     ButtonCompactable {
                //         text: "twotwo"
                //         source: "qrc:/assets/icons_material/baseline-warning-24px.svg"
                //
                //         compact: false
                //         onClicked: compact = !compact
                //     }
                // }
                //
                // Row { // right
                //     anchors.right: itemImageButtonX.left
                //     anchors.rightMargin: 24
                //     anchors.verticalCenter: parent.verticalCenter
                //     spacing: 16
                //
                //     ButtonWireframeIcon {
                //         fullColor: true
                //         primaryColor: Theme.colorActionbarHighlight
                //         source: "qrc:/assets/icons_material/baseline-warning-24px.svg"
                //     }
                //     ButtonWireframeIcon {
                //         fullColor: true
                //         primaryColor: Theme.colorActionbarHighlight
                //         text: "Action 1"
                //         source: "qrc:/assets/icons_material/baseline-warning-24px.svg"
                //     }
                //     ButtonWireframeIcon {
                //         fullColor: true
                //         primaryColor: Theme.colorActionbarHighlight
                //         text: "Action 2"
                //     }
                // }
                //
                // RoundButtonIcon {
                //     id: itemImageButtonX
                //     width: 40
                //     height: 40
                //     anchors.right: parent.right
                //     anchors.rightMargin: 24
                //     anchors.verticalCenter: parent.verticalCenter
                //
                //     source: "qrc:/assets/icons_material/baseline-close-24px.svg"
                //     iconColor: "white"
                //     backgroundColor: Theme.colorActionbarHighlight
                //
                //     onClicked: {
                //         rectangleActions.height = 0
                //     }
                // }
            }
        }

        // CONTENT /////////////////////////////////////////////////////////////////

        Flickable {
            anchors.top: menusArea.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.bottom: parent.bottom

            enabled: appHeader.componentsEnabled

            LayoutMirroring.enabled: appHeader.componentsMirrored
            //layoutDirection: Qt.RightToLeft

            contentWidth: parent.width
            contentHeight: contentColumn.height

            boundsBehavior: isDesktop ? Flickable.OvershootBounds : Flickable.DragAndOvershootBounds
            ScrollBar.vertical: ScrollBar { visible: isDesktop; }

            Column {
                id: contentColumn

                anchors.left: parent.left
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                anchors.margins: Theme.componentMargin

                topPadding: Theme.componentMargin
                bottomPadding: Theme.componentMargin
                spacing: Theme.componentMargin

                ////////////////


            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////
}
