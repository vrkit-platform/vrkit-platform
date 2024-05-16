import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import Qt5Compat.GraphicalEffects
import ThemeEngine

import IRT
import IRTObjects

import ThemeEngine


// import SessionDataTableModel
Loader {
    id: screenMainView
    anchors.fill: parent


    function backAction() {
        if (screenLapTiming.status === Loader.Ready)
            screenLapTiming.item.backAction();
    }
    function loadScreen() {
        // load screen
        screenMainView.active = true;

        // change screen
        appContent.state = "MainView";
    }

    ////////////////////////////////////////////////////////////////////////////
    active: false
    // anchors.fill: parent
    asynchronous: false

    sourceComponent: Item {
        function backAction() {
            screenMainView.loadScreen();
        }

        anchors.fill: parent

        // MENUS ///////////////////////////////////////////////////////////////////
        Column {
            id: menusArea

            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            z: 20

            Rectangle {
                id: rectangleActions

                anchors.left: parent.left
                anchors.right: parent.right
                clip: true
                color: Theme.colorActionbar
                height: 56
                visible: (height > 0)

                Behavior on height  {
                    NumberAnimation {
                        duration: 133
                    }
                }

                // prevent clicks below this area
                MouseArea {
                    acceptedButtons: Qt.AllButtons
                    anchors.fill: parent
                }
                Row {
                    // left
                    anchors.left: parent.left
                    // anchors.leftMargin: 24
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: 16

                    // visible: !singleColumn
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        color: Theme.colorActionbarContent
                        font.bold: true
                        font.pixelSize: Theme.fontSizeContentBig
                        text: "Lap timing37"
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
        }

        // CONTENT /////////////////////////////////////////////////////////////////
        // Flickable {
        //     // LayoutMirroring.enabled: appHeader.componentsMirrored
        //     anchors.bottom: parent.bottom
        //     anchors.left: parent.left
        //     anchors.right: parent.right
        //     anchors.top: menusArea.bottom
        //     // boundsBehavior: Flickable.OvershootBounds
        //     contentHeight: contentColumn.height
        //     //layoutDirection: Qt.RightToLeft
        //     contentWidth: parent.width

        // Column {
        //     id: contentColumn
        //     anchors.bottom: parent.bottom
        //     anchors.left: parent.left
        //     // anchors.margins: Theme.componentMargin
        //     anchors.right: parent.right
        //     anchors.top: parent.top
        //     // bottomPadding: Theme.componentMargin
        //     // spacing: Theme.componentMargin
        //     // topPadding: Theme.componentMargin

        // anchors.fill: parent

        // anchors.right: parent.right
        // anchors.left: parent.left
        ////////////////

        Rectangle {
            anchors.fill: parent
            color: "red"
            z: -1
        }
    }

    ////////////////////////////////////////////////////////////////////////////
}
