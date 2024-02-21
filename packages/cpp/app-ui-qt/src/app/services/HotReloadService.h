#pragma once

#include <filesystem>

#include <QObject>
#include <QQmlApplicationEngine>

class QFileSystemWatcher;

class HotReloadService : public QObject {
    Q_OBJECT
public:
    explicit HotReloadService(
        QQmlApplicationEngine &engine, const QString &directory, const QUrl &mainUrl, QObject *parent = nullptr
    );

    void load();

signals:
    void watchedSourceChanged();

public slots:
    void clearCache();

private:

    QFileSystemWatcher *watcher_;
    QQmlApplicationEngine &engine_;
    const QUrl mainUrl_;
};
