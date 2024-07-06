# SDK Source & headers
file(GLOB_RECURSE appSources src/*.cpp)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName ${appServiceTarget})
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

EMBED_MC_RESOURCE("${CMAKE_CURRENT_SOURCE_DIR}/src/event_ids.mc" MC_HEADER_FILE MC_OUTPUT_BIN_FILE)
get_filename_component(MC_INCLUDE_DIR ${MC_HEADER_FILE} DIRECTORY)
message(STATUS "MC HEADER FILE ${MC_HEADER_FILE}, MC INCLUDE DIR ${MC_INCLUDE_DIR}")
# TODO: I removed WIN32 to facilitate the entry signature/symbol `int wmain(int,wchar_t*)` vs `WinMain`
add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders} ${MC_HEADER_FILE} ${MC_OUTPUT_BIN_FILE})

# Include headers for generated files
target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_BINARY_DIR} ${MC_INCLUDE_DIR})

# Link configured deps
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
)

# IRT_CONFIGURE_APP_LIBS(${targetName})

# Link other local project targets
#target_link_libraries(${targetName} PRIVATE ${sdkTargetStatic} ${sharedAppLibTargetStatic} ${modelsTargetStatic} ${Protobuf_LIBRARY_DEBUG})
#target_link_libraries(${targetName} PRIVATE ${sdkTarget} ${sharedAppLibTarget} ${modelsTarget} ${Protobuf_LIBRARY_DEBUG})
target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_LOG}
  ${DEP_YAML})




