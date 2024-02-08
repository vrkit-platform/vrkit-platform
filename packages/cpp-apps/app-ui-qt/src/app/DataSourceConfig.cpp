
#include "DataSourceConfig.h"

namespace IRacingTools::App {
//void DataSourceConfig::setType(DataSourceConfig::Type type) {
//    if (type != type_) {
//        type_ = type;
//        emit changed();
//    }
//}
DataSourceConfig::Type DataSourceConfig::type() const {
    return type_;
}

const QUrl &DataSourceConfig::url() const {
    return url_;
}
//
//void DataSourceConfig::setUrl(const QUrl &url) {
//    if (url_ != url) {
//        url_ = url;
//        emit changed();
//    }
//}

/**
 * @brief cleanup
 */
DataSourceConfig::~DataSourceConfig() {}

/**
 * @brief Create new instance
 *
 * @param parent
 */
DataSourceConfig::DataSourceConfig(QObject *parent) : QObject(parent) {}

/**
 * @brief DataSourceConfig
 *
 * @param type
 * @param url
 * @param parent
 */
DataSourceConfig::DataSourceConfig(Type type, const QUrl &url, QObject *parent) :
    QObject(parent), url_(url), type_(type) {}

bool DataSourceConfig::operator==(const DataSourceConfig &rhs) const {
    return url_ == rhs.url_ && type_ == rhs.type_;
}
bool DataSourceConfig::operator!=(const DataSourceConfig &rhs) const {
    return !(rhs == *this);
}

bool DataSourceConfig::operator==(const DataSourceConfig *rhs) const {
    return rhs && (*rhs == *this);
}

bool DataSourceConfig::operator!=(const DataSourceConfig *rhs) const {
    return rhs && !(*rhs == *this);
}
const QString DataSourceConfig::localFile() const {
    auto &fileUrl = url();
    QString file = fileUrl.isValid() && fileUrl.isLocalFile() ? fileUrl.toLocalFile() : "";

    return !file.isEmpty() && QFile::exists(file) ? file : "";
}

//
//void DataSourceConfig::set(DataSourceConfig::Type type, const QUrl &url) {
//    url_ = url;
//    type_ = type;
//    emit changed();
//}
//
//void DataSourceConfig::set(const DataSourceConfig *config) {
//    set(config->type(), config->url());
//}

bool DataSourceConfig::isValidDiskConfig() const {
    return type_ == Disk && !localFile().isEmpty();
}

bool DataSourceConfig::isValidLiveConfig() const {
    return type_ == Live;
}

bool DataSourceConfig::isValidConfig() const {
    return isValidLiveConfig() || isValidDiskConfig();
}
} // namespace IRacingTools::App