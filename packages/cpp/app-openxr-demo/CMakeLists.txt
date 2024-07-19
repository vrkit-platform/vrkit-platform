
file(GLOB_RECURSE appSources
  src/*.cpp
  src/*.h
)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName openxr-demo-app)

set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})
target_link_directories(${targetName} BEFORE
  PRIVATE ${CMAKE_CURRENT_LIST_DIR}/external/lib)

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE ON
  MACOSX_BUNDLE OFF
)

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src/
  ${CMAKE_CURRENT_LIST_DIR}/include/
  ${CMAKE_CURRENT_BINARY_DIR}/
)

# Link configured deps
VRK_CONFIGURE_APP_LIBS(${targetName})
#VRK_CONFIGURE_TARGET(${targetName})

target_compile_definitions(
  ${targetName}
  PRIVATE
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  APP_SRC_DIR="${CMAKE_CURRENT_LIST_DIR}"
)

add_dependencies(${targetName} ${openxrLibTarget})

#target_link_libraries(${targetName}
#  PRIVATE
#  ${sdkTargetStatic}
#  ${sharedAppLibTargetStatic}
#  ${modelsTargetStatic}
#
#)

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


#target_link_libraries(${targetName} PRIVATE OpenXR::headers OpenXR::openxr_loader)
#
target_link_libraries( ${targetName} PRIVATE openxr_loader$<$<CONFIG:Debug>:d>)
#if (DEBUG)
#target_link_libraries( ${targetName} PRIVATE openxr_loaderd)
#else()
#  target_link_libraries( ${targetName} PRIVATE openxr_loader$<$<CONFIG:Debug>:d>)
#  endif()

set(
  RUNTIME_FILES
  "${CMAKE_CURRENT_LIST_DIR}/../openxr-lib/openxr-api-layer.json"
)

install(FILES "${RUNTIME_FILES}" TYPE BIN)

