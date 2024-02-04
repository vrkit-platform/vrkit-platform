
file(GLOB_RECURSE appSources
#  qml/*.js qml/*.qml
  src/app/*.cpp
  src/app/*.h
  qml/qml.qrc
  qml/components.qrc
  i18n/i18n.qrc
  assets/assets.qrc)
file(GLOB_RECURSE appHeaders include/*.h)

set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})


# App
set(targetName ${appUIQTTarget})

set(APP_NAME ${targetName})
set(APP_VERSION ${targetName})

#add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})
qt_add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})
#qt_add_qml_module(${targetName}
#  URI SessionDataTableModel
#  NO_RESOURCE_TARGET_PATH
#)

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE ON
  MACOSX_BUNDLE OFF
)

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src/
  ${CMAKE_CURRENT_LIST_DIR}/include/
  ${CMAKE_CURRENT_LIST_DIR}/src/thirdparty/
  ${CMAKE_CURRENT_BINARY_DIR}/
)

# Link configured deps
target_link_runtime_libs(${targetName})

target_compile_definitions(
  ${targetName}
  PRIVATE
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  QT_QML_DEBUG
)

target_compile_definitions(${targetName} PRIVATE _USE_MATH_DEFINES)

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_QT_UI}
)

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE TRUE
)

#install(TARGETS ${targetName}
#  RUNTIME DESTINATION "${INSTALL_EXAMPLEDIR}"
#  BUNDLE DESTINATION "${INSTALL_EXAMPLEDIR}"
#  LIBRARY DESTINATION "${INSTALL_EXAMPLEDIR}"
#)

# AppUtils
add_subdirectory(src/thirdparty/AppUtils)
target_link_libraries(${targetName} PRIVATE AppUtils)

## MobileUI
#add_subdirectory(src/thirdparty/MobileUI)
#target_link_libraries(${targetName} PRIVATE MobileUI)
#
## MobileSharing
#add_subdirectory(src/thirdparty/MobileSharing)
#target_link_libraries(${targetName} PRIVATE MobileSharing)

# SingleApplication
set(QAPPLICATION_CLASS QGuiApplication)
add_subdirectory(src/thirdparty/SingleApplication)
target_link_libraries(${targetName} PRIVATE SingleApplication)
