import QtQuick 2.15
import QtQuick.Controls.impl 2.15
import QtQuick.Templates 2.15 as T
import QtQuick.Layouts 1.15

import ThemeEngine 1.0


T.Button {
    id: control

    implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset,
                            implicitContentWidth + leftPadding + rightPadding)
    implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset,
                             implicitContentHeight + topPadding + bottomPadding)

    leftPadding: 12
    rightPadding: 12+6
    spacing: 6

    font.pixelSize: Theme.componentFontSize
    font.bold: false

    focusPolicy: Qt.NoFocus

    // settings
    property url source
    // property int sourceSize: UtilsNumber.alignTo(height * 0.666, 2)
    property int sourceSize: height * 0.666
    property int layoutDirection: Qt.LeftToRight

        // settings
    property bool borderVisible: false
    property bool backgroundVisible: false
    property string highlightMode: "circle" // available: border, circle, color, both (circle+color), off

    // colors
    property string textColor: Theme.colorText
    property string highlightColor: Theme.colorPrimary
    property string borderColor: Theme.colorComponentBorder
    property string backgroundColor: Theme.colorComponent

    ////////////////

    background: Rectangle {
        implicitWidth: 80
        implicitHeight: Theme.componentHeight

        radius: Theme.componentRadius
        // opacity: enabled ? 1 : 0.33

        // color: control.down ? Theme.colorComponentDown : Theme.colorComponent
        visible: (control.highlightMode === "circle" || control.highlightMode === "both"  || control.highlightMode === "border" || control.backgroundVisible)
        color: control.backgroundColor

        opacity: {
            if (control.hovered) {
               return (control.highlightMode === "circle" || control.highlightMode === "both" || control.highlightMode === "border"  || control.borderVisible || control.backgroundVisible) ? 1 : 0.75
            } else {
                return control.backgroundVisible || control.borderVisible ? 0.75 : 0
            }
        }
        Behavior on opacity { NumberAnimation { duration: 333 } }

        Rectangle { // border
            anchors.fill: parent
            radius: width

            visible: control.borderVisible
            color: "transparent"
            border.width: Theme.componentBorderWidth
            border.color: control.borderColor
        }
    }

    ////////////////

    contentItem: RowLayout {
        spacing: control.spacing
        layoutDirection: control.layoutDirection

        IconSvg {
            source: control.source
            width: control.sourceSize
            height: control.sourceSize

            visible: control.source.toString().length
            Layout.maximumWidth: control.sourceSize
            Layout.maximumHeight: control.sourceSize
            Layout.alignment: Qt.AlignVCenter

            opacity: enabled ? 1.0 : 0.33
            color: Theme.colorComponentContent
        }

        Text {
            text: control.text
            textFormat: Text.PlainText

            visible: control.text
            Layout.fillWidth: true
            Layout.alignment: Qt.AlignVCenter

            font: control.font
            elide: Text.ElideMiddle
            //wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter

            opacity: enabled ? 1.0 : 0.33
            color: Theme.colorComponentContent
        }
    }

    ////////////////
}
