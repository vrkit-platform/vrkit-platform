import QtQuick
import QtCore
import QtQuick.Controls
import QtQuick.Window
import QtQuick.Dialogs
import QtQuick.Layouts
import Qt.labs.platform as Platform
import QtQuick.Templates as T
import ThemeEngine

// import AppState
import IRT
import "components"

Rectangle {
    function isDataSourceLive(): bool {
        return AppState.dataSourceConfig.type === DataSourceConfig.Live;
    }

    anchors.left: parent.left
    anchors.right: parent.right
    anchors.top: appMenubar.bottom

    // border.color: Theme.colorSeparator
    // border.width: 3
    color: Theme.colorHeader
    implicitHeight: appHeaderContent.implicitHeight

    // anchors.fill: parent
    implicitWidth: parent.width

    DragHandler {
        target: null

        // Drag on the sidebar to drag the whole window // Qt 5.15+
        // Also, prevent clicks below this area
        onActiveChanged: if (active)
            appWindow.startSystemMove()
    }
    RowLayout {
        id: appHeaderContent

        function setPageTitle(title) {
            pageTitle.text = title;
        }

        anchors.left: parent.left
        anchors.right: parent.right

        // anchors.top: parent.parent.bottom
        // height: 60
        width: parent.width

        RowLayout {
            id: appHeaderButtons

            // height: 50
            // width: 100
            // anchors.left: pageTitle.right
            // anchors.right: parent.right
            // anchors.top: parent.top
            // anchors.bottom: parent.bottom
            Layout.margins: 15

            RoundButtonIcon {
                id: buttonMenu

                backgroundColor: isDataSourceLive() ? Theme.colorBlue : Theme.colorRed
                backgroundVisible: true //isDataSourceLive()
                height: 50
                source: isDataSourceLive() ? "qrc:/assets/icons_material/bolt-24dp.svg" : "qrc:/assets/icons_material/baseline-folder-24px.svg"
                // text: "Settings"
                width: 50

                // QQuickIcon {
                //     source:
                // }

                // anchors.verticalCenter: parent.verticalCenter
                // backgroundColor: Theme.colorHeaderHighlight
                // iconColor: Theme.colorHeaderContent
                // source: "qrc:/assets/icons_material/baseline-more_vert-24px.svg"
                onClicked: () => {
                    if (isDataSourceLive()) {
                        AppState.dataSourceConfig.type = DataSourceConfig.Disk;
                        AppState.dataSourceConfig.url = Qt.url("file://124");
                    } else {
                        AppState.dataSourceConfig.type = DataSourceConfig.Live;
                        AppState.dataSourceConfig.url = Qt.url(
                            // ActionMenuFloating {
                            //     id: actionMenu
                            //     model: ListModel {
                            //         id: lmActionMenu
                            //         ListElement {
                            //             idx: 1
                            //             src: "qrc:/assets/icons_material/baseline-accessibility-24px.svg"
                            //             t: "itm"
                            //             txt: "Action 1"
                            //         }
                            //         ListElement {
                            //             idx: 2
                            //             src: "qrc:/assets/icons_material/baseline-accessibility-24px.svg"
                            //             t: "itm"
                            //             txt: "Action 2"
                            //         }
                            //         ListElement {
                            //             t: "sep"
                            //         }
                            //         ListElement {
                            //             idx: 3
                            //             src: "qrc:/assets/icons_material/baseline-accessibility-24px.svg"
                            //             t: "itm"
                            //             txt: "Action 3"
                            //         }
                            //     }
                            //     onMenuSelected: index => {}
                            // }
                            "");
                    }
                }
                //     actionMenu.open()
            }
            Button {
                // active: !isDataSourceLive()
                text: (() => {
                        let file = AppState.dataSourceConfig.localFile;
                        console.log(`IBT file file string: ${file}`);
                        return (file === "") ? "Select an IBT file" : file;

                        //     Layout.fillWidth: true
                        //     clip: true
                        //     elide: Text.ElideRight
                        //     padding: 5
                        //     text: "DataSourceConfig type = " + JSON.stringify(AppState.dataSourceConfig.type === DataSourceConfig.Live)
                        //     // anchors.left: parent.left
                        //     // anchors.top: parent.top
                        //     // anchors.bottom: parent.bottom
                        //     // anchors.right: appHeaderButtons.left
                        //     verticalAlignment: Text.AlignVCenter
                        // }
                    })()
                visible: !isDataSourceLive()

                onClicked: openDialog.open()
            }
            FileDialog {
                id: openDialog

                currentFolder: StandardPaths.writableLocation(StandardPaths.DocumentsLocation)
                fileMode: FileDialog.OpenFile
                nameFilters: ["IBT files (*.ibt)"]
                selectedNameFilter.index: 1

                onAccepted: () => {
                    console.log("Selected file: " + selectedFile);

                    AppState.dataSourceConfig.url = Qt.url(selectedFile);
                }
            }
            // Text {
            //     id: pageTitle
        }
    }
}