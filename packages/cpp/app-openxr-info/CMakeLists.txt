
FILE(GLOB_RECURSE appSources
  src/*.cpp
  src/*.h
)
FILE(GLOB_RECURSE appHeaders include/*.h)

# App
SET(targetName openxr-info-app)

SET(APP_NAME ${targetName})
SET(APP_VERSION ${appVersion})

ADD_EXECUTABLE(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})
TARGET_LINK_DIRECTORIES(${targetName} BEFORE
  PRIVATE ${CMAKE_CURRENT_LIST_DIR}/external/lib)

#SET_TARGET_PROPERTIES(${targetName} PROPERTIES
#  WIN32_EXECUTABLE ON
#  MACOSX_BUNDLE OFF
#)

TARGET_INCLUDE_DIRECTORIES(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src/
  ${CMAKE_CURRENT_LIST_DIR}/include/
  ${CMAKE_CURRENT_BINARY_DIR}/
)

# Link configured deps
VRK_CONFIGURE_APP_LIBS(${targetName})

TARGET_COMPILE_DEFINITIONS(
  ${targetName}
  PRIVATE
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  APP_SRC_DIR="${CMAKE_CURRENT_LIST_DIR}"
)

ADD_DEPENDENCIES(${targetName} ${openxrLibTarget})

SET_TARGET_PROPERTIES(
  ${targetName}
  PROPERTIES
  VS_GLOBAL_RootNamespace IRacingTools
  VS_GLOBAL_CppWinRTOptimized true
  VS_GLOBAL_CppWinRTRootNamespaceAutoMerge true
  VS_GLOBAL_WindowsPackageType None
  VS_GLOBAL_EnablePreviewMsixTooling true
  VS_GLOBAL_WindowsAppSDKSelfContained true
)

TARGET_LINK_LIBRARIES(${targetName} PRIVATE openxr_loader$<$<CONFIG:Debug>:d>)



