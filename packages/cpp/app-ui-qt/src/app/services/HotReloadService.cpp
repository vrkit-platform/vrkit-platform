#include "HotReloadService.h"

#include <QDebug>
#include <QFileSystemWatcher>
#include <QTimer>

HotReloadService::HotReloadService(
    QQmlApplicationEngine &engine, const QString &qmlPath, const QUrl &mainUrl, QObject *parent
) : QObject(parent), watcher_(new QFileSystemWatcher(this)), engine_(engine), mainUrl_(mainUrl) {
    qInfo() << "Watching " << qmlPath;
    watcher_->addPath(qmlPath);
    connect(watcher_, &QFileSystemWatcher::directoryChanged, this, [this, &engine](const QString &path) {
        emit watchedSourceChanged();
        //        load();
    });
}

void HotReloadService::clearCache() {
    //    engine_.findChild<QuickWindow>("appWindow")

    engine_.clearComponentCache();
}
void HotReloadService::load() {
    qInfo() << "(re)Loading Main " << mainUrl_;
    //    engine_.evaluate("appWindow.close();");
    //    clearCache();
    engine_.load(mainUrl_);
    //    for (auto o : engine_.rootObjects()) {
    //        o.
    //    }
}
