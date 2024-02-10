//
// Created by jglanz on 2/5/2024.
//

#pragma once

#include <QtCore>
#include <QtQml>

namespace IRacingTools::App {

  struct AppSessionConfig : public QObject {
  Q_OBJECT

    Q_PROPERTY(QUrl url READ url NOTIFY configChanged  FINAL)
    Q_PROPERTY(QString localFile READ localFile NOTIFY configChanged  FINAL)
    Q_PROPERTY(Type type READ type NOTIFY configChanged FINAL)

    QML_ELEMENT
  public:
    enum Type {
      None, Live, Disk
    };

    Q_ENUM(Type);

    explicit AppSessionConfig(QObject *parent = nullptr);

    AppSessionConfig(Type type, const QUrl &url, QObject *parent = nullptr);

    //    AppSessionConfig(const AppSessionConfig& other);
    ~AppSessionConfig() override;

    //    Q_INVOKABLE void set(Type type, const QUrl& url = {""});
    //    Q_INVOKABLE void set(const AppSessionConfig * config);

    Q_INVOKABLE bool isValidLiveConfig() const;

    Q_INVOKABLE bool isValidDiskConfig() const;

    Q_INVOKABLE bool isValidConfig() const;


    Type type() const;
    //    void setType(Type type);

    const QUrl &url() const;
    //    void setUrl(const QUrl &url);

    QString localFile() const;

    bool operator==(const AppSessionConfig &rhs) const;

    bool operator!=(const AppSessionConfig &rhs) const;

    bool operator==(const AppSessionConfig *rhs) const;

    bool operator!=(const AppSessionConfig *rhs) const;

  signals:
    void configChanged();

    //        void typeChanged();


  private:
    QUrl url_{""};
    Type type_{Live};


  };
} // namespace IRacingTools::App
