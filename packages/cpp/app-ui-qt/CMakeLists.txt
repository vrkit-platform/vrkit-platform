
file(GLOB_RECURSE appSources
#  qml/*.js qml/*.qml
qml/qml.qrc

src/app/*.cpp
  src/app/*.h
  i18n/i18n.qrc
  assets/assets.qrc)
file(GLOB_RECURSE appHeaders include/*.h)
file(GLOB_RECURSE appQmls
  qml/*.js qml/*.qml
)
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})


# App
set(targetName ${appUIQTTarget})

set(APP_NAME ${targetName})
set(APP_VERSION ${targetName})

#add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})
qt_add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})
qt_add_qml_module(${targetName}
	URI IRT
	#	QML_FILES ${appQmls}
)



set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE ON
  MACOSX_BUNDLE OFF
)

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src/
	${CMAKE_CURRENT_LIST_DIR}/src/app/
	${CMAKE_CURRENT_LIST_DIR}/src/app/services/
	${CMAKE_CURRENT_LIST_DIR}/src/app/utils/
	${CMAKE_CURRENT_LIST_DIR}/src/thirdparty/
	${CMAKE_CURRENT_LIST_DIR}/include/
  ${CMAKE_CURRENT_BINARY_DIR}/
)

# Link configured deps
VRK_CONFIGURE_APP_LIBS(${targetName})
VRK_CONFIGURE_TARGET(${targetName})

target_compile_definitions(
  ${targetName}
  PRIVATE
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  APP_SRC_DIR="${CMAKE_CURRENT_LIST_DIR}"

  _USE_MATH_DEFINES
	QML_HOT_RELOAD
  QT_QML_DEBUG
)

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_QT_UI}
)

# AppUtils
add_subdirectory(src/thirdparty/AppUtils)
target_link_libraries(${targetName} PRIVATE AppUtils)

# SingleApplication
set(QAPPLICATION_CLASS QGuiApplication)
add_subdirectory(src/thirdparty/SingleApplication)
target_link_libraries(${targetName} PRIVATE SingleApplication)
