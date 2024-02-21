
#include "AppSessionConfig.h"

namespace IRacingTools::App {
//void AppSessionConfig::setType(AppSessionConfig::Type type) {
//    if (type != type_) {
//        type_ = type;
//        emit changed();
//    }
//}
AppSessionConfig::Type AppSessionConfig::type() const {
    return type_;
  }

  const QUrl &AppSessionConfig::url() const {
    return url_;
  }

  /**
   * @brief cleanup
   */
  AppSessionConfig::~AppSessionConfig() {}

/**
 * @brief Create new instance
 *
 * @param parent
 */
  AppSessionConfig::AppSessionConfig(QObject *parent) : QObject(parent) {}

/**
 * @brief AppSessionConfig
 *
 * @param type
 * @param url
 * @param parent
 */
  AppSessionConfig::AppSessionConfig(Type type, const QUrl &url, QObject *parent) :
      QObject(parent), url_(url), type_(type) {}

  bool AppSessionConfig::operator==(const AppSessionConfig &rhs) const {
    return url_ == rhs.url_ && type_ == rhs.type_;
  }

  bool AppSessionConfig::operator!=(const AppSessionConfig &rhs) const {
    return !(rhs == *this);
  }

  bool AppSessionConfig::operator==(const AppSessionConfig *rhs) const {
    return rhs && (*rhs == *this);
  }

  bool AppSessionConfig::operator!=(const AppSessionConfig *rhs) const {
    return rhs && !(*rhs == *this);
  }

  QString AppSessionConfig::localFile() const {
    auto &fileUrl = url();
    QString file = fileUrl.isValid() && fileUrl.isLocalFile() ? fileUrl.toLocalFile() : "";

    return !file.isEmpty() && QFile::exists(file) ? file : "";
  }

//
//void AppSessionConfig::set(AppSessionConfig::Type type, const QUrl &url) {
//    url_ = url;
//    type_ = type;
//    emit changed();
//}
//
//void AppSessionConfig::set(const AppSessionConfig *config) {
//    set(config->type(), config->url());
//}

  bool AppSessionConfig::isValidDiskConfig() const {
    return type_ == Disk && !localFile().isEmpty();
  }

  bool AppSessionConfig::isValidLiveConfig() const {
    return type_ == Live;
  }

  bool AppSessionConfig::isValidConfig() const {
    return isValidLiveConfig() || isValidDiskConfig();
  }

} // namespace IRacingTools::App