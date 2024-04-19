//
// Created by jglanz on 2/17/2024.
//

#pragma once
#include <windows.h>

#include <QtCore>
#include <QtQml>

#include <magic_enum.hpp>

#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::App::Utils {

//    class AppPaths : public SDK::Utils::Singleton<AppPaths> {
//
//      Q_OBJECT
//      QML_ELEMENT
//      QML_SINGLETON
//
//    public:
//      enum class Type : std::uint32_t {
//        Config,
//        Data,
//        Documents,
//        Temp
//      };
//
//      Q_ENUM(Type);
//
//
//      Q_INVOKABLE QStringList getAll(Type type){
//        auto locationType =  Locations[type];
//        return QStandardPaths::standardLocations(locationType);
//      };
//
//      Q_INVOKABLE QString get(Type type){
//        return getAll(type).first();
//      };
//
//      AppPaths() = delete;
//      AppPaths(const AppPaths &other) = delete;
//      AppPaths(AppPaths &&other) = delete;
//
//      virtual ~AppPaths() = default;
//
//      static constexpr std::size_t TypeCount = magic_enum::enum_count<Type>();
//      static constexpr SDK::Utils::LUT<AppPaths::Type, QStandardPaths::StandardLocation, TypeCount> Locations = {
//          {{Type::Data, QStandardPaths::AppDataLocation},
//              {Type::Config, QStandardPaths::AppConfigLocation},
//              {Type::Documents, QStandardPaths::DocumentsLocation},
//              {Type::Temp, QStandardPaths::TempLocation},},};
//
//      template<AppPaths::Type type>
//      static QStringList GetAll(){
//        auto locationType =  Locations[type];
//        return QStandardPaths::standardLocations(locationType);
//      };
//
//      template<AppPaths::Type type>
//      static QString Get(){
//        auto paths = GetAll<type>(type);
//        return paths.first();
//      };
//
//    private:
//      explicit AppPaths(token);
//      friend SDK::Utils::Singleton<AppPaths>;
//
//    };

}// namespace IRacingTools::App::Utils
