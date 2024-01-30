cmake_minimum_required(VERSION 3.15)

project(iracing_tools)

# Subprojects & Targets
set(sdkTarget ${PROJECT_NAME}_sdk)
set(sdkTargetStatic ${sdkTarget}_static)
set(modelsTarget ${PROJECT_NAME}_models)
set(modelsTargetStatic ${modelsTarget}_static)
set(modelsTargetPython ${modelsTarget}_python)
set(sharedAppLibTarget ${PROJECT_NAME}_shared_app_lib)
set(sharedAppLibTargetStatic ${sharedAppLibTarget}_static)
set(overlayAppTarget ${PROJECT_NAME}_overlay_app)
set(appUIQTTarget ${PROJECT_NAME}_app_ui_qt)

# Setup

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# CCACHE
find_program(CCACHE_PROGRAM ccache)
if (CCACHE_PROGRAM)
  message(NOTICE "Selected CCache: ${CCACHE_PROGRAM}")
  set(CMAKE_C_COMPILER_LAUNCHER ${CCACHE_PROGRAM} base_dir=${PROJECT_SOURCE_DIR} hash_dir=false log_file=${PROJECT_SOURCE_DIR}/tmp_ccache.log)
  set(CMAKE_CXX_COMPILER_LAUNCHER ${CCACHE_PROGRAM} base_dir=${PROJECT_SOURCE_DIR} hash_dir=false log_file=${PROJECT_SOURCE_DIR}/tmp_ccache.log)
else ()
  message(WARNING "Could not find ccache, skipping!")
endif ()


# Windows
#set(CMAKE_CXX_VISIBILITY_PRESET visible)
set(CMAKE_CXX_VISIBILITY_PRESET default)


# Include CMake helper libs
include(cmake/embed_resource.cmake)
include(cmake/targets.cmake)
include(cmake/fs.cmake)
include(cmake/dependencies.cmake NO_POLICY_SCOPE)
include(cmake/example_target.cmake)
#include(cmake/hybrid_crt.cmake NO_POLICY_SCOPE)

set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
add_compile_options($<$<CXX_COMPILER_ID:MSVC>:/MP>)

# Include test tools
include(CTest)
include(GoogleTest)

# SDK Include dir
set(sdkIncludeDir ${CMAKE_SOURCE_DIR}/packages/cpp/include)

add_subdirectory(packages/proto)
add_subdirectory(packages/cpp)
add_subdirectory(packages/cpp-apps)

