
file(GLOB_RECURSE appSources
  src/*.cpp
  src/*.h
)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName ${appCLITarget})
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

#qt_add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})
add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src
  ${CMAKE_CURRENT_LIST_DIR}/include
  ${CMAKE_CURRENT_BINARY_DIR}
)

set_target_properties(
  ${targetName}
  PROPERTIES
  VS_GLOBAL_RootNamespace IRacingTools
  VS_GLOBAL_CppWinRTOptimized true
  VS_GLOBAL_CppWinRTRootNamespaceAutoMerge true
  VS_GLOBAL_WindowsPackageType None
  VS_GLOBAL_EnablePreviewMsixTooling true
  VS_GLOBAL_WindowsAppSDKSelfContained true
)

IRT_CONFIGURE_APP_LIBS(${targetName})
IRT_CONFIGURE_TARGET(${targetName})

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

target_link_sdl2(${targetName})

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_DIRECTX}
  ${DEP_LOG}
  ${DEP_YAML}

  #  ${DEP_PROTOBUF}
  #  ${DEP_JSON}
  #  ${DEP_MAGICENUM}
  #  ${DEP_FMT}
  #  ${DEP_QT_CORE}
  #  ${DEP_GSL}
  #  ${DEP_BOOST_DEFAULT}

)

add_dependencies(${targetName} ${openxrLibTarget})

#install(TARGETS ${targetName}
#  RUNTIME DESTINATION "${INSTALL_EXAMPLEDIR}"
#  BUNDLE DESTINATION "${INSTALL_EXAMPLEDIR}"
#  LIBRARY DESTINATION "${INSTALL_EXAMPLEDIR}"
#)

set(
  RUNTIME_FILES
  "${CMAKE_CURRENT_LIST_DIR}/../openxr-lib/openxr-api-layer.json"
)

install(FILES "${RUNTIME_FILES}" TYPE BIN)

add_custom_target(
  CopyRuntimeFiles
  ALL
  COMMAND
  "${CMAKE_COMMAND}" -E make_directory
  "$<TARGET_FILE_DIR:${targetName}>"
  &&
  ${CMAKE_COMMAND} -E copy_if_different
  "${RUNTIME_FILES}"
  "$<TARGET_FILE_DIR:${targetName}>"
  COMMAND_EXPAND_LISTS
)

add_dependencies(CopyRuntimeFiles ${openxrLibTarget})

#add_dependencies(${targetName} CopyRuntimeFiles)