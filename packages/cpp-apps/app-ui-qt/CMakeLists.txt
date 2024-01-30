
file(GLOB_RECURSE appSources
#  qml/*.js qml/*.qml
  src/app/*.cpp
  src/app/*.h
#  src/*.ui
#  src/SettingsManager.cpp src/SettingsManager.h
#  src/main.cpp
  qml/qml.qrc
  qml/components.qrc
  i18n/i18n.qrc
  assets/assets.qrc)
file(GLOB_RECURSE appHeaders include/*.h)


# App
set(targetName ${appUIQTTarget})

set(APP_NAME ${targetName})
set(APP_VERSION ${targetName})

#add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})
qt_add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE ON
  MACOSX_BUNDLE OFF
)


target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_LIST_DIR}/src/)
target_include_directories(${targetName} PUBLIC ${CMAKE_CURRENT_LIST_DIR}/src/thirdparty/)


# Include headers for generated files
target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

# Link configured deps
target_link_runtime_libs(${targetName})

target_compile_definitions(${targetName} PRIVATE QT_QML_DEBUG)
target_compile_definitions(${targetName} PUBLIC PROJECT_NAME="${targetName}")

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
#  ${DEP_TINYORM}
)

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE TRUE
)

#target_link_libraries(${targetName} PRIVATE
#    Qt6::Core
#    Qt6::Gui
#    Qt6::Widgets
#)

#install(TARGETS ${targetName}
#  RUNTIME DESTINATION "${INSTALL_EXAMPLEDIR}"
#  BUNDLE DESTINATION "${INSTALL_EXAMPLEDIR}"
#  LIBRARY DESTINATION "${INSTALL_EXAMPLEDIR}"
#)

## Android
if(ANDROID)
  set(QT_ANDROID_ABIS "armeabi-v7a;arm64-v8a;x86;x86_64")
  set(QT_ANDROID_BUILD_ALL_ABIS ON)
  set(QT_ANDROID_MIN_SDK_VERSION 23)
  set(QT_ANDROID_TARGET_SDK_VERSION 34)

  set_target_properties(${targetName} PROPERTIES QT_ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/assets/android/")
  target_link_libraries(${targetName} PRIVATE Qt::CorePrivate)
endif()

## macOS
if(APPLE AND NOT IOS)
  set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64")
  set(CMAKE_OSX_DEPLOYMENT_TARGET "10.15")
endif()

## iOS
if(IOS)
  set(IPHONEOS_DEPLOYMENT_TARGET "12.0")
  set(CMAKE_XCODE_ATTRIBUTE_IPHONEOS_DEPLOYMENT_TARGET 12.0)

  target_link_libraries(${targetName} PRIVATE Qt::GuiPrivate "-framework UIKit")
endif()

## Windows
if(WIN32)
  target_compile_definitions(${targetName} PRIVATE _USE_MATH_DEFINES)
endif()


# AppUtils
add_subdirectory(src/thirdparty/AppUtils)
target_link_libraries(${targetName} PRIVATE AppUtils)

# MobileUI
add_subdirectory(src/thirdparty/MobileUI)
target_link_libraries(${targetName} PRIVATE MobileUI)

# MobileSharing
add_subdirectory(src/thirdparty/MobileSharing)
target_link_libraries(${targetName} PRIVATE MobileSharing)

# SingleApplication
set(QAPPLICATION_CLASS QGuiApplication)
add_subdirectory(src/thirdparty/SingleApplication)
target_link_libraries(${targetName} PRIVATE SingleApplication)
