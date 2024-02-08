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

    function setDataSourceLive() {
        DataSourceActions.changeDataSource(DataSourceConfig.Live);
    }
    function setDataSourceReplay() {
        DataSourceActions.changeDataSource(DataSourceConfig.Disk);
    }
    function changeDataSourceDiskFile() {
        openDialog.open();
    }

    function isDataSourceDisk(): bool {
        return AppState.dataSourceConfig.type === DataSourceConfig.Disk;
    }
    function isDataSourceLive(): bool {
        return AppState.dataSourceConfig.type === DataSourceConfig.Live;
    }
    function isDataSourceNone(): bool {
        return !isDataSourceSet();
    }
    function isDataSourceSet(): bool {
        return AppState.dataSourceConfig.type !== DataSourceConfig.None;
    }
    function showErrorMessage(e, info = "") {
        errorDialog.text = typeof e === "string" ? e : e.message;
        if (info.length) {
            errorDialog.informativeText = info;
        }
        console.error("Error message", e);
        errorDialog.open();
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
            RowLayout {
                Layout.margins: {
                    left: 15;
                    right: 15;
                }
                visible: isDataSourceNone()

                Text {
                    anchors.verticalCenter: parent.verticalCenter
                    color: Theme.colorActionbarContent
                    font.bold: true
                    font.pixelSize: Theme.fontSizeContentBig
                    text: "Configure a data source"
                    verticalAlignment: Text.AlignVCenter
                }

                RoundButtonText {
                    backgroundColor: Theme.colorBlue

                    text: "LIVE"

                    onClicked: () => setDataSourceLive()
                }

                RoundButtonText {
                    backgroundColor: Theme.colorRed
                    text: "REPLAY"

                    onClicked: () => setDataSourceReplay()
                }
            }
            RowLayout {
                Layout.margins: {
                    left: 15;
                    right: 15;
                }
                visible: isDataSourceLive()

                RoundButtonIcon {
                    id: buttonMenu

                    backgroundColor: isDataSourceLive() ? Theme.colorBlue : Theme.colorRed
                    backgroundVisible: true //isDataSourceLive()
                    height: 50
                    source: isDataSourceLive() ? "qrc:/assets/icons_material/bolt-24dp.svg" : "qrc:/assets/icons_material/baseline-folder-24px.svg"
                    width: 50

                    onClicked: () => changeDataSource(DataSourceConfig.Live)

                    //     actionMenu.open()
                }

                Button {
                    // active: !isDataSourceLive()
                    text: (() => {
                            let file = AppState.dataSourceConfig.localFile;
                            console.log(`IBT file file string: ${file}`);
                            return (file === "") ? "Select an IBT file" : file;
                        })()
                    visible: !isDataSourceLive()

                    onClicked: () => changeDataSourceDiskFile()
                }
            }
            MessageDialog {
                id: errorDialog

                buttons: MessageDialog.Ok
                informativeText: "Do you want to save your changes?"
                text: "The document has been modified."

                onAccepted: () => {}
            }
            FileDialog {
                id: openDialog

                fileMode: FileDialog.OpenFile
                nameFilters: ["IBT files (*.ibt)"]
                selectedNameFilter.index: 1

                onAccepted: () => {
                    console.log("Selected file: " + selectedFile);
                    try {
                        DataSourceActions.changeDataSource(DataSourceConfig.Disk, Qt.url(selectedFile));
                    } catch (e) {
                        showErrorMessage(e);
                    }
                }
            }
            // Text {
            //     id: pageTitle
        }
    }
}