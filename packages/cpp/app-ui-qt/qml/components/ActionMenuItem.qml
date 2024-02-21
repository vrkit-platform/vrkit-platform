import QtQuick 2.15
import QtQuick.Layouts 1.15
import QtQuick.Controls.impl 2.15
import QtQuick.Templates 2.15 as T
import QtQuick.Controls.Material.impl as QQuickMaterial
import Qt5Compat.GraphicalEffects // Qt6
import ThemeEngine 1.0

T.Button {
    id: control

    // settings
    property int index
    property int layoutDirection: Qt.RightToLeft
    property url source
    property int sourceSize: 20

    anchors.left: parent.left
    anchors.leftMargin: Theme.componentBorderWidth
    anchors.right: parent.right
    anchors.rightMargin: Theme.componentBorderWidth
    focusPolicy: Qt.NoFocus
    height: 36
    leftInset: Theme.componentMargin / 2
    leftPadding: Theme.componentMargin
    rightInset: Theme.componentMargin / 2
    rightPadding: Theme.componentMargin

    ////////////////
    background: Item {
        implicitHeight: 36
        layer.enabled: true

        layer.effect: OpacityMask {
            maskSource: Rectangle {
                height: background.height
                radius: Theme.componentRadius
                width: background.width
                x: background.x
                y: background.y
            }
        }

        Rectangle {
            anchors.fill: parent
            color: Theme.colorComponent
            //Behavior on color { ColorAnimation { duration: 133 } }
            opacity: control.hovered ? 1 : 0
            //Behavior on opacity { OpacityAnimator { duration: 233 } }
            radius: Theme.componentRadius
        }
        QQuickMaterial.Ripple {
            active: enabled && control.down
            anchors.fill: parent
            clip: visible
            color: Qt.rgba(Theme.colorForeground.r, Theme.colorForeground.g, Theme.colorForeground.b, 0.66)
            pressed: control.down
        }
    }

    ////////////////
    contentItem: RowLayout {
        layoutDirection: control.layoutDirection
        spacing: Theme.componentMargin / 2

        IconSvg {
            Layout.preferredHeight: control.sourceSize
            Layout.preferredWidth: control.sourceSize
            color: Theme.colorIcon
            source: control.source
        }
        Text {
            Layout.fillWidth: true
            Layout.preferredHeight: control.sourceSize
            color: Theme.colorText
            elide: Text.ElideRight
            font.bold: false
            font.pixelSize: Theme.componentFontSize
            horizontalAlignment: Text.AlignLeft
            text: control.text
            textFormat: Text.PlainText
            verticalAlignment: Text.AlignVCenter
        }
    }

    ////////////////
}
