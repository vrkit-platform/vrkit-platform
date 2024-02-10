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
import IRTObjects
import "components"

Rectangle {
    function changeDataSourceDiskFile() {
        openDialog.open();
    }
    function formateSessionTime(millis) {
        let date = new Date(millis);
        const fmtPart = (part, zeros) => part.toString().padStart(zeros, '0');
        return `${fmtPart(date.getUTCHours(), 2)}:${fmtPart(date.getUTCMinutes(), 2)}:${fmtPart(date.getUTCSeconds(), 2)}.${fmtPart(date.getUTCMilliseconds(), 3)}`;
    }
    function isDataSourceDisk(): bool {
        return AppSessionManager.config.type === AppSessionConfig.Disk;
    }
    function isDataSourceLive(): bool {
        return AppSessionManager.config.type === AppSessionConfig.Live;
    }
    function isDataSourceNone(): bool {
        return !isDataSourceSet();
    }
    function isDataSourceSet(): bool {
        return AppSessionManager.config.type !== AppSessionConfig.None;
    }
    function setDataSourceLive() {
        AppSessionManager.setConfig(AppSessionConfig.Live);
    }
    function setDataSourceReplay() {
        AppSessionManager.setConfig(AppSessionConfig.Disk);
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

    color: Qt.lighter(Theme.colorHeader, 1.3)
    implicitHeight: appHeaderContent.implicitHeight
    implicitWidth: parent.width

    RowLayout {
        id: appHeaderContent

        anchors.left: parent.left
        anchors.right: parent.right

        width: parent.width

        RowLayout {
            id: appHeaderButtons

            Layout.fillWidth: true

            RowLayout {
                Layout.fillWidth: true
                Layout.margins: {
                    left: 15;
                    right: 15;
                }
                clip: true
                visible: isDataSourceNone()

                Text {
                    Layout.alignment: Qt.AlignVCenter
                    Layout.fillWidth: true
                    Layout.horizontalStretchFactor: 2
                    // anchors.verticalCenter: parent.verticalCenter
                    color: Theme.colorActionbarContent
                    font.bold: true
                    font.pixelSize: Theme.fontSizeContentBig
                    text: "Configure a data source"
                }
                BorderedButton {
                    Layout.fillWidth: true
                    source: "qrc:/assets/icons_material/bolt-24dp.svg"
                    text: "LIVE"

                    onClicked: () => setDataSourceLive()
                }
                BorderedButton {
                    Layout.fillWidth: true
                    borderColor: Theme.colorRed
                    source: "qrc:/assets/icons_material/baseline-folder-24px.svg"
                    text: "REPLAY"

                    onClicked: () => setDataSourceReplay()
                }
            }

            // LIVE DATA SOURCE PANEL
            RowLayout {
                id: liveDataSourcePanel

                Layout.margins: {
                    top: 10;
                    bottom: 10;
                }
                spacing: 15
                visible: isDataSourceLive()

                Rectangle {
                    id: liveModeIconRect

                    color: Theme.colorBlue
                    height: 0.666 * Theme.headerHeight
                    implicitWidth: Math.max(liveModeIcon.width, height)
                    radius: height / 2

                    IconSvg {
                        id: liveModeIcon

                        anchors.verticalCenter: parent.verticalCenter
                        color: "white"
                        source: "qrc:/assets/icons_material/bolt-24dp.svg"
                    }
                }
                Text {
                    id: liveModeText

                    color: "white"
                    font: Theme.headerFont

                    // anchors {
                    //     left: liveModeIconRect.right
                    //     verticalCenter: liveModeIconRect.verticalCenter
                    // }
                    rightPadding: 15
                    text: "LIVE"
                }
                Text {
                    id: liveModeDetails

                    color: "white"
                    font.pixelSize: Theme.fontSizeContentSmall

                    // anchors {
                    //     left: liveModeIcon.right
                    //     verticalCenter: liveModeIcon.verticalCenter
                    // }
                    // leftPadding: 10
                    rightPadding: 15
                    text: AppSessionManager.config.available ? "Connected" : "Not Connected"
                }

                // Button {
                //     // active: !isDataSourceLive()
                //     text: (() => {
                //             let file = AppSessionManager.config.localFile;
                //             console.log(`IBT file file string: ${file}`);
                //             return (file === "") ? "Select an IBT file" : file;
                //         })()
                //     visible: !isDataSourceLive()
            }

            // REPLAY DATA SOURCE PANEL
            RowLayout {
                id: replayDataSourcePanel

                Layout.margins: {
                    top: 10;
                    bottom: 10;
                }
                spacing: 15
                visible: isDataSourceDisk()

                Rectangle {
                    color: Theme.colorRed
                    height: 0.666 * Theme.headerHeight
                    implicitWidth: Math.max(replayModeIcon.width, height)
                    radius: height / 2

                    IconSvg {
                        id: replayModeIcon

                        anchors.centerIn: parent
                        color: "white"
                        height: parent.height * 0.666
                        source: "qrc:/assets/icons_material/baseline-folder-24px.svg"
                        width: height
                    }
                }
                Text {
                    id: replayModeText

                    color: "white"
                    font: Theme.headerFont
                    rightPadding: 15
                    text: "REPLAY"

                    // anchors {
                    //     left: replayModeIcon.right
                    //     verticalCenter: replayModeIcon.verticalCenter
                    // }
                }
                Text {
                    id: replayModeDetails

                    color: "white"
                    font.pixelSize: Theme.fontSizeContentSmall
                    // leftPadding: 10
                    rightPadding: 15
                    text: AppSessionManager.dataAvailable ? `Using ${AppSessionManager.config.localFile}` : "No file selected"
                }
                Text {
                    id: replayModeSessionTime

                    color: "white"
                    font.pixelSize: Theme.fontSizeContentSmall
                    leftPadding: 15
                    text: AppSessionManager.session.time > 0 ? formateSessionTime(AppSessionManager.session.time) : "00:00:00.000"
                }

                // Button {
                //     // active: !isDataSourceReplay()
                //     text: (() => {
                //             let file = AppSessionManager.config.localFile;
                //             console.log(`IBT file file string: ${file}`);
                //             return (file === "") ? "Select an IBT file" : file;
                //         })()
                //     visible: !isDataSourceLive()
            }

            // Text {
            //     id: pageTitle
        }
    }
}
