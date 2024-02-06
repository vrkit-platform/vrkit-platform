/*!
 * COPYRIGHT (C) 2022 Emeric Grange - All Rights Reserved
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * \date      2022
 * \author    Emeric Grange <emeric.grange@gmail.com>
 */

#include <QQmlDebuggingEnabler>

#include <SingleApplication>
#include <utils_app.h>
#include <utils_language.h>
#include <utils_screen.h>
#include <utils_sysinfo.h>

#include <QLibraryInfo>
#include <QVersionNumber>
#include <QtGlobal>

#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QQuickWindow>
#include <QSurfaceFormat>
#include <QtUITypes.h>

#include "services/SessionDataTableModel.h"
#include "services/HotReloadService.h"
#include "AppState.h"
#include "SettingsManager.h"

/* ************************************************************************** */

using namespace IRacingTools::App;
using namespace IRacingTools::App::Services;

namespace {
const QString &EngineContextEntryKey(const QMLEngineContextEntry &entry) {
    return entry.first;
}
QObject *EngineContextEntryValue(const QMLEngineContextEntry &entry) {
    return entry.second;
}

AppState * configureQMLEngine(QQmlApplicationEngine &engine, const QList<QMLEngineContextEntry> &contextEntries) {
    QQmlContext *engineContext = engine.rootContext();
    std::for_each(contextEntries.begin(), contextEntries.end(), [&](auto &entry) {
        engineContext->setContextProperty(entry.first, entry.second);
    });

    // ThemeEngine
    qmlRegisterSingletonType(QUrl("qrc:/qml/ThemeEngine.qml"), "ThemeEngine", 1, 0, "Theme");
//    AppState * appState = new AppState();// engine.singletonInstance<AppState>();
//    qmlRegisterSingletonType<AppState>("AppState", 1, 0, "AppState", [&](QQmlEngine *engine, QJSEngine *scriptEngine) -> QObject * {
//        Q_UNUSED(engine)
//        Q_UNUSED(scriptEngine)
//
//        return appState;
//    });
//    qmlRegisterSingletonType("", 1, 0, "AppState", appState);
    AppState * appState = engine.singletonInstance<AppState*>("IRT","AppState");
    qDebug() << "DataSourceType == " << QMetaEnum::fromType<DataSourceConfig::Type>().valueToKey(appState->dataSourceConfig()->type());
#ifdef QML_HOT_RELOAD
    std::filesystem::path srcPath{APP_SRC_DIR};
    auto qmlPath = srcPath / "qml";
    auto qmlMainPath = qmlPath / "DesktopApplication.qml";
    auto qmlPathStr = QString::fromStdString(qmlPath.string());
    auto qmlMainPathStr = QString::fromStdString(qmlMainPath.string());
    //
    const auto appUrl = QUrl::fromLocalFile(qmlMainPathStr);
    const auto appContentUrl = QUrl::fromLocalFile(
                                   QString::fromStdString((qmlPath / "AppContent.qml").string())).toString();

    engine.addImportPath(QUrl::fromLocalFile(qmlPathStr).toString() + "/");
    for (auto childDir : {"components_generic", "components_themed", "components_js", "popups"}) {
        auto childStr = QUrl::fromLocalFile(QString::fromStdString((qmlPath / childDir).string())).toString() + "/";
        qInfo() << "Adding import: " << childStr;
        engine.addImportPath(childStr);
    }

    auto hotReloadService = new HotReloadService(engine, qmlPathStr, appUrl);
    engineContext->setContextProperty("HotReloadService", hotReloadService);
    engineContext->setContextProperty("QMLSourcePath", qmlPathStr);
    engineContext->setContextProperty("AppContentFilePath", appContentUrl);
    hotReloadService->load();

#else
    const auto appUrl = QUrl(QStringLiteral("qrc:/qml/DesktopApplication.qml"));
    engineContext->setContextProperty("AppContentFilePath", appUrl.toString());
    engine.load(appUrl);
#endif
   return appState;

}

} // namespace
int main(int argc, char *argv[]) {
    // GUI application /////////////////////////////////////////////////////////

    SingleApplication app(argc, argv);

    // Application name
    SingleApplication::setApplicationName(APP_NAME);
    SingleApplication::setApplicationDisplayName(APP_NAME);
    SingleApplication::setApplicationVersion(APP_VERSION);
    SingleApplication::setOrganizationName("3FV");
    SingleApplication::setOrganizationDomain("3FV");

    // Application icon
    QIcon appIcon(":/assets/logos/logo.svg");
    SingleApplication::setWindowIcon(appIcon);

    // Init app components
    SettingsManager *sm = SettingsManager::getInstance();
    if (!sm) {
        qWarning() << "Cannot init app components!";
        return EXIT_FAILURE;
    }

    auto liveSessionDataProvider = std::make_shared<IRacingTools::Shared::LiveSessionDataProvider>();
    auto sessionDataTableModel = new SessionDataTableModel(liveSessionDataProvider);
    //    QObject::connect(sessionDataTableModel, &SessionDataTableModel::sessionDataChanged, [&] (auto event) {
    //        qDebug() << "Received session update with car total = " << event->cars().size();
    //    });

    // Init generic utils

    UtilsApp *utilsApp = UtilsApp::getInstance();
    UtilsScreen *utilsScreen = UtilsScreen::getInstance();
    UtilsSysInfo *utilsSysInfo = UtilsSysInfo::getInstance();
    UtilsLanguage *utilsLanguage = UtilsLanguage::getInstance();
    if (!utilsScreen || !utilsApp || !utilsLanguage) {
        qWarning() << "Cannot init generic utils!";
        return EXIT_FAILURE;
    }

    // Translate the application
    utilsLanguage->loadLanguage(sm->getAppLanguage());



    // Force QtQuick components style? // Some styles are only available on target OS
    // Basic // Fusion // Imagine // macOS // iOS // Material // Universal // Windows
    //    QQuickStyle::setStyle("windows");
    QQuickStyle::setStyle("Material");

    QQmlApplicationEngine engine;
    configureQMLEngine(
        engine,
        QList<QMLEngineContextEntry>{
            {"sessionDataTableModel", sessionDataTableModel},
            {"settingsManager", sm},
            {"utilsApp", utilsApp},
            {"utilsLanguage", utilsLanguage},
            {"utilsScreen", utilsScreen},
            {"utilsSysInfo", utilsSysInfo}
        }
    );



    if (engine.rootObjects().isEmpty()) {
        qWarning() << "Cannot init QmlApplicationEngine!";
        return EXIT_FAILURE;
    }

    utilsLanguage->setQmlEngine(&engine);

    //    sessionDataTableModel->start();

    // React to secondary instances // QQuickWindow must be valid at this point
    auto *window = qobject_cast<QQuickWindow *>(engine.rootObjects().value(0));
    QObject::connect(&app, &SingleApplication::instanceStarted, window, &QQuickWindow::show);
    QObject::connect(&app, &SingleApplication::instanceStarted, window, &QQuickWindow::raise);
    //    QObject::connect(&app, &QAPPLICATION_CLASS::applicationStateChanged, [&](Qt::ApplicationState state) {
    //
    //    });

    //    dataServiceThread->

    auto res = app.exec();
    sessionDataTableModel->resetDataProvider();
    return res;
}

/* ************************************************************************** */
