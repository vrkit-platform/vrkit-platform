
#include "DataSourceConfig.h"

namespace IRacingTools::App {
void DataSourceConfig::setType(DataSourceConfig::Type type) {
    if (type != type_) {
        type_ = type;
        emit typeChanged();
    }
}
DataSourceConfig::Type DataSourceConfig::type() const {
    return type_;
}
const QUrl& DataSourceConfig::url() const {
    return url_;
}
void DataSourceConfig::setUrl(const QUrl &url) {
    if (url_ != url) {
        url_ = url;
        emit urlChanged();
    }
}

DataSourceConfig::~DataSourceConfig() {}

DataSourceConfig::DataSourceConfig(QObject *parent) : QObject(parent) {}

DataSourceConfig::DataSourceConfig(Type type, const QUrl &url,QObject *parent) :
    url_(url), type_(type) {

}
//DataSourceConfig::DataSourceConfig(const DataSourceConfig &other) : QObject(nullptr), url_(other.url()), type_(other.type())  {
//
//}

bool DataSourceConfig::operator==(const DataSourceConfig &rhs) const {
    return url_ == rhs.url_
        && type_ == rhs.type_;
}
bool DataSourceConfig::operator!=(const DataSourceConfig &rhs) const {
    return !(rhs == *this);
}

bool DataSourceConfig::operator==(const DataSourceConfig *rhs) const {
    return (*rhs == *this);
}

bool DataSourceConfig::operator!=(const DataSourceConfig *rhs) const {
    return !(*rhs == *this);
}
const QString DataSourceConfig::localFile() const {
    auto& fileUrl = url();
    QString file = fileUrl.isValid() && fileUrl.isLocalFile() ? fileUrl.toLocalFile() : "";

    return !file.isEmpty() && QFile::exists(file) ? file : "";
}
} // namespace IRacingTools::App