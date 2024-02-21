// noinspection JSValidateTypes
pragma Singleton
import QtQuick
import QtQuick.Controls.Material

Item {
    enum ThemeNames {
        // WatchFlower
        THEME_SNOW,
        THEME_PLANT,
        THEME_RAIN,
        THEME_DAY,
        THEME_NIGHT,

        // Offloadbuddy
        THEME_LIGHT_AND_WARM,
        THEME_DARK_AND_SPOOKY,
        THEME_PLAIN_AND_BORING,
        THEME_BLOOD_AND_TEARS,
        THEME_MIGHTY_KITTENS,
        THEME_LAST
    }

    // Action bar
    property color colorActionbar
    property color colorActionbarContent
    property color colorActionbarHighlight

    // Content
    property color colorWindowBackground
    property color colorBackground
    property color colorBlue: "#4cafe9"

    // App specific
    property color colorBox: "white"
    property color colorBoxBorder: "#f4f4f4"

    ////////////////

    // Qt Quick Controls & theming
    property color colorComponent
    property color colorComponentBackground
    property color colorComponentBorder
    property color colorComponentContent
    property color colorComponentDown
    property color colorComponentText
    property color colorDeviceWidget
    property color colorError
    property color colorForeground
    property color colorGreen: "#8cd200"
    property color colorGrey: "#555151"

    // Header
    property color colorHeader
    property color colorHeaderContent
    property color colorHeaderHighlight
    property color colorHighContrast
    property color colorIcon
    property color colorLowContrast
    readonly property color colorMaterialAmber: "#FFC107"
    readonly property color colorMaterialBlue: "#2196F3"
    readonly property color colorMaterialBrown: "#795548"
    readonly property color colorMaterialCyan: "#00BCD4"
    readonly property color colorMaterialDarkGrey: "#ececec"
    readonly property color colorMaterialDeepOrange: "#FF5722"
    readonly property color colorMaterialDeepPurple: "#673AB7"
    readonly property color colorMaterialGreen: "#4CAF50"
    readonly property color colorMaterialGrey: "#9E9E9E"
    readonly property color colorMaterialIndigo: "#3F51B5"
    readonly property color colorMaterialLightBlue: "#03A9F4"
    readonly property color colorMaterialLightGreen: "#8BC34A"
    readonly property color colorMaterialLightGrey: "#f8f8f8"
    readonly property color colorMaterialLime: "#CDDC39"
    readonly property color colorMaterialOrange: "#FF9800"
    readonly property color colorMaterialPink: "#E91E63"
    readonly property color colorMaterialPurple: "#9C27B0"

    // Material colors
    readonly property color colorMaterialRed: "#F44336"
    readonly property color colorMaterialTeal: "#009688"
    readonly property color colorMaterialYellow: "#FFEB3B"
    property color colorOrange: "#ffa635"
    property color colorPrimary

    ////////////////

    // Palette colors
    property color colorRed: "#ff7657"
    property color colorSecondary
    property color colorSeparator

    // Side bar (desktop)
    property color colorSidebar
    property color colorSidebarContent
    property color colorSidebarHighlight
    property color colorStatusbar
    property color colorSubText
    property color colorSuccess

    // Tablet bar (mobile)
    property color colorTabletmenu
    property color colorTabletmenuContent
    property color colorTabletmenuHighlight
    property color colorText
    property color colorWarning
    property color colorYellow: "#ffcf00"
    property int componentBorderWidth: 2
    property int componentFontSize: 15
    property int componentHeight: 36
    property int componentHeightL: 44
    property int componentHeightXL: 48
    property int componentMargin: 16
    property int componentMarginL: 20
    property int componentMarginXL: 24
    property int componentRadius: 4
    property int currentTheme: -1
    readonly property int fontSizeContent: 16
    readonly property int fontSizeContentBig: 18
    readonly property int fontSizeContentSmall: 14
    readonly property int fontSizeContentVeryBig: 20
    readonly property int fontSizeContentVerySmall: 12
    readonly property int fontSizeContentVeryVeryBig: 22
    readonly property int fontSizeContentVeryVerySmall: 10

    ////////////////

    property int headerHeight: 50

    // Fonts (sizes in pixel)
    readonly property int fontSizeHeader: 26
    readonly property int fontSizeTitle: 28

    // Fonts
    property font headerFont: Qt.font({
            "family": 'Encode Sans',
            "weight": Font.Black,
            "italic": false,
            "pixelSize": fontSizeHeader
        })
    property bool isDesktop: true

    ////////////////
    property bool isHdpi: (utilsScreen.screenDpi >= 128 || utilsScreen.screenPar >= 2.0)
    property string sidebarSelector // 'arrow' or 'bar'

    ////////////////

    // Status bar (mobile)
    property int themeStatusbar

    ////////////////////////////////////////////////////////////////////////////
    function getThemeIndex(name) {
        return ThemeEngine.THEME_NIGHT;
    }
    function getThemeName(index) {
        return "THEME_NIGHT";
    }

    ////////////////////////////////////////////////////////////////////////////
    function loadTheme(newIndex: int) {
        console.log("ThemeEngine.loadTheme(" + newIndex + ")");
        let themeIndex = ThemeEngine.THEME_NIGHT;
        colorGreen = "#58CF77";
        colorBlue = "#0079fe";
        colorYellow = "#fcc632";
        colorOrange = "#ff8f35";
        colorRed = "#e8635a";
        themeStatusbar = Material.Dark;
        colorStatusbar = "#494949";
        colorWindowBackground = "#1f1f1f";
        colorHeader = Qt.lighter(colorWindowBackground, 1.1);
        colorHeaderContent = "#c7c6c6";
        colorHeaderHighlight = Qt.darker(colorHeader, 1.1);
        colorSidebar = "#3A3A3A";
        colorSidebarContent = "white";
        colorSidebarHighlight = Qt.lighter(colorSidebar, 1.5);
        colorActionbar = "#282827";
        colorActionbarContent = "white";
        colorActionbarHighlight = "#383833";
        colorTabletmenu = "#f3f3f3";
        colorTabletmenuContent = "#9d9d9d";
        colorTabletmenuHighlight = "#0079fe";

        colorBackground = "#313236";
        colorForeground = "#292929";
        colorPrimary = "#bb86fc";
        colorSecondary = "#b16bee";
        colorSuccess = colorGreen;
        colorWarning = colorOrange;
        colorError = colorRed;
        colorText = "#EEE";
        colorSubText = "#AAA";
        colorIcon = "#EEE";
        colorSeparator = "#404040";
        colorLowContrast = "#111";
        colorHighContrast = "white";
        colorDeviceWidget = "#333";
        colorComponent = "#555";
        colorComponentText = "#EAEAEA";
        colorComponentContent = "#EAEAEA";
        colorComponentBorder = "#DDD";
        colorComponentDown = "#E6E6E6";
        colorComponentBackground = Qt.darker(colorComponent,1.1);
        componentRadius = 6;
        sidebarSelector = "";
        // colorStatusbar = "#725595";
        // colorHeader = "#b16bee";
        // colorHeaderContent = "white";
        // colorHeaderHighlight = "#725595";
        // colorSidebar = "#b16bee";
        // colorSidebarContent = "white";
        // colorSidebarHighlight = "#725595";
        // colorActionbar = colorBlue;
        // colorActionbarContent = "white";
        // colorActionbarHighlight = "#4dabeb";
        // colorTabletmenu = "#292929";
        // colorTabletmenuContent = "#808080";
        // colorTabletmenuHighlight = "#bb86fc";
        // colorBackground = "#313236";
        // colorForeground = "#292929";
        // colorPrimary = "#bb86fc";
        // colorSecondary = "#b16bee";
        // colorSuccess = colorGreen;
        // colorWarning = colorOrange;
        // colorError = colorRed;
        // colorText = "#EEE";
        // colorSubText = "#AAA";
        // colorIcon = "#EEE";
        // colorSeparator = "#404040";
        // colorLowContrast = "#111";
        // colorHighContrast = "white";
        // colorDeviceWidget = "#333";
        // componentRadius = 4;
        // colorComponent = "#757575";
        // colorComponentText = "#eee";
        // colorComponentContent = "white";
        // colorComponentBorder = "#777";
        // colorComponentDown = "#595959";
        // colorComponentBackground = "#292929";

        // This will emit the signal 'onCurrentThemeChanged'
        currentTheme = themeIndex;
    }

    Component.onCompleted: loadTheme(settingsManager.appTheme)

    Connections {
        function onAppThemeChanged() {
            loadTheme(settingsManager.appTheme);
        }

        target: settingsManager
    }
}
