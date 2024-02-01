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
#include "SettingsManager.h"
#include "services/IRDataService.h"

#include <utils_app.h>
#include <utils_screen.h>
#include <utils_sysinfo.h>
#include <utils_language.h>
#include <SingleApplication>

#include <QtGlobal>
#include <QLibraryInfo>
#include <QVersionNumber>

#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickWindow>
#include <QQuickStyle>
#include <QSurfaceFormat>

/* ************************************************************************** */

using namespace IRacingTools::App::Services;

int main(int argc, char *argv[])
{
    // GUI application /////////////////////////////////////////////////////////

    SingleApplication app(argc, argv);

    // Application name
    app.setApplicationName(PROJECT_NAME);
    app.setApplicationDisplayName(PROJECT_NAME);
    app.setOrganizationName("3FV");
    app.setOrganizationDomain("3FV");

#if !defined(Q_OS_ANDROID) && !defined(Q_OS_IOS)
    // Application icon
    QIcon appIcon(":/assets/logos/logo.svg");
    app.setWindowIcon(appIcon);
#endif

    // Init app components
    SettingsManager *sm = SettingsManager::getInstance();
    if (!sm)
    {
        qWarning() << "Cannot init app components!";
        return EXIT_FAILURE;
    }

    auto dataServiceThread = new IRDataServiceThread();
    QObject::connect(dataServiceThread, &IRDataServiceThread::sessionUpdated, [&] (IRSessionUpdateEvent& event) {
        qDebug() << "Received session update with car total = " << event.getCars().size();
    });

    // Init generic utils
    UtilsApp *utilsApp = UtilsApp::getInstance();
    UtilsScreen *utilsScreen = UtilsScreen::getInstance();
    UtilsSysInfo *utilsSysinfo = UtilsSysInfo::getInstance();
    UtilsLanguage *utilsLanguage = UtilsLanguage::getInstance();
    if (!utilsScreen || !utilsApp || !utilsLanguage)
    {
        qWarning() << "Cannot init generic utils!";
        return EXIT_FAILURE;
    }

    // Translate the application
    utilsLanguage->loadLanguage(sm->getAppLanguage());

    // ThemeEngine
    qmlRegisterSingletonType(QUrl("qrc:/qml/ThemeEngine.qml"), "ThemeEngine", 1, 0, "Theme");

    // Force QtQuick components style? // Some styles are only available on target OS
    // Basic // Fusion // Imagine // macOS // iOS // Material // Universal // Windows
    //QQuickStyle::setStyle("Universal");

//    MobileUI::registerQML();

    // Then we start the UI
    QQmlApplicationEngine engine;
    QQmlContext *engine_context = engine.rootContext();

    engine_context->setContextProperty("dataServiceThread",dataServiceThread);
    engine_context->setContextProperty("settingsManager", sm);
    engine_context->setContextProperty("utilsApp", utilsApp);
    engine_context->setContextProperty("utilsLanguage", utilsLanguage);
    engine_context->setContextProperty("utilsScreen", utilsScreen);
    engine_context->setContextProperty("utilsSysinfo", utilsSysinfo);

    // Load the main view

    engine.load(QUrl(QStringLiteral("qrc:/qml/DesktopApplication.qml")));

    if (engine.rootObjects().isEmpty())
    {
        qWarning() << "Cannot init QmlApplicationEngine!";
        return EXIT_FAILURE;
    }

    // For i18n retranslate
    utilsLanguage->setQmlEngine(&engine);

    dataServiceThread->start();

    // React to secondary instances // QQuickWindow must be valid at this point
    auto *window = qobject_cast<QQuickWindow *>(engine.rootObjects().value(0));
    QObject::connect(&app, &SingleApplication::instanceStarted, window, &QQuickWindow::show);
    QObject::connect(&app, &SingleApplication::instanceStarted, window, &QQuickWindow::raise);


//    dataServiceThread->

    auto res = app.exec();
    dataServiceThread->requestInterruption();
    dataServiceThread->wait();
    return res;
}

/* ************************************************************************** */
