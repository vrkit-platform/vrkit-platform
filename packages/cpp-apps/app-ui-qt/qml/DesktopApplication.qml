// noinspection JSVoidFunctionReturnValueUsed
import QtQuick
import QtQuick.Controls
import QtQuick.Window
import ThemeEngine
import QtQuick.Controls.Material

ApplicationWindow {
    id: appWindow

    Material.theme: Material.Dark
    Material.accent: Material.BlueGrey;

    // UI sizes ////////////////////////////////////////////////////////////////
    property bool headerUnicolor: (Theme.colorHeader === Theme.colorBackground)
    property bool isHdpi: (utilsScreen.screenDpi >= 128 || utilsScreen.screenPar >= 2.0)
    property bool sidebarUnicolor: (Theme.colorSidebar === Theme.colorBackground)
    property bool singleColumn: false
    property bool wideMode: (width >= 560)
    property bool wideWideMode: (width >= 640)

    // User generated events handling //////////////////////////////////////////
    function backAction() {

    }

    function deselectAction() {
    }

    function forwardAction() {
    }

    // color: settingsManager.appThemeCSD ? "transparent" : Theme.colorBackground
    // flags: settingsManager.appThemeCSD ? Qt.Window | Qt.FramelessWindowHint : Qt.Window
    color: Theme.colorWindowBackground
    flags: Qt.Window | Qt.FramelessWindowHint
    height: {
        if (settingsManager.initialSize.height > 0)
            return settingsManager.initialSize.height;
        else
            return isHdpi ? 560 : 720;
    }
    minimumHeight: 560

    // Desktop stuff ///////////////////////////////////////////////////////////
    minimumWidth: 800
    visibility: settingsManager.initialVisibility
    visible: true
    width: {
        if (settingsManager.initialSize.width > 0)
            return settingsManager.initialSize.width;
        else
            return isHdpi ? 800 : 1280;
    }
    x: settingsManager.initialPosition.width
    y: settingsManager.initialPosition.height

    onClosing: (close) =>{

    }

    WindowGeometrySaver {
        windowInstance: appWindow

        Component.onCompleted: {
            // Make sure we handle window visibility correctly
            visibility = settingsManager.initialVisibility;
        }
    }

    // Events handling /////////////////////////////////////////////////////////
    Connections {
        function onStateChanged() {
            switch (Qt.application.state) {
            case Qt.ApplicationActive:
                Theme.loadTheme(settingsManager.appTheme);
                break;
            }
        }

        target: Qt.application
    }
    Loader {
        id: mainLoader

        anchors.fill: parent
        scale: 1
        source: AppContentFilePath
    }
    Connections {
        target: HotReloadService

        function onWatchedSourceChanged() {
            console.log("Reloading " + AppContentFilePath);
            mainLoader.active = false;
            HotReloadService.clearCache();
            mainLoader.setSource(AppContentFilePath);
            mainLoader.active = true;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
}
