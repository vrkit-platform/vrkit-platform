//
// Created by jglanz on 2/5/2024.
//

#pragma once

#include <QtCore>
#include <QtQml>

namespace IRacingTools::App {

struct DataSourceConfig : public QObject {
    Q_OBJECT
    Q_PROPERTY(QUrl url READ url WRITE setUrl NOTIFY urlChanged FINAL)
    Q_PROPERTY(QString localFile READ localFile NOTIFY urlChanged FINAL)
    Q_PROPERTY(Type type READ type WRITE setType NOTIFY typeChanged FINAL)
    QML_ELEMENT
public:
    enum Type { Live, Disk };

    Q_ENUM(Type);

    DataSourceConfig(QObject *parent = nullptr);
    DataSourceConfig(Type type, const QUrl& url, QObject *parent = nullptr);
//    DataSourceConfig(const DataSourceConfig& other);
    ~DataSourceConfig();

    Type type() const;

    void setType(Type type);

    const QUrl& url() const;
    void setUrl(const QUrl &url);

    const QString localFile() const;

    bool operator==(const DataSourceConfig &rhs) const;
    bool operator!=(const DataSourceConfig &rhs) const;
    bool operator==(const DataSourceConfig *rhs) const;
    bool operator!=(const DataSourceConfig *rhs) const;

    signals:
        void urlChanged();
        void typeChanged();


private:
    QUrl url_{""};
    Type type_{Live};
};
} // namespace IRacingTools::App