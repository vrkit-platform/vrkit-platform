import QtQuick
import QtQuick.Controls

import ThemeEngine

Item {
    id: screenMainView
    anchors.fill: parent

    function loadScreen() {
        screenLapTiming.loadScreen()
    }

    function backAction() {
        //
    }
}
