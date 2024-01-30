import QtQuick
import QtQuick.Controls

import ThemeEngine

Item {
    id: screenMainView
    anchors.fill: parent

    function loadScreen() {
        if (isDesktop) screenLapTiming.loadScreen()
        else if (isMobile) screenMobileComponents.loadScreen()
        else appContent.state = "MainView"
    }

    function backAction() {
        //
    }
}
