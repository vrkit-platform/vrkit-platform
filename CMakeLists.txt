cmake_minimum_required(VERSION 3.21.1)

# Windows SDK/Kit
set(WINDOWS_SDK_VERSION "10.0.22621.0")

cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

set(appNamePrefix vrkit)
set(appVersionMajor 1)
set(appVersionMinor 0)
set(appVersionPatch 0)
set(appVersion ${appVersionMajor}.${appVersionMinor}.${appVersionPatch})

project(vrkit VERSION ${appVersion})

if(POLICY CMP0091)
  cmake_policy(SET CMP0091 NEW)
endif()

# Subprojects & Targets
set(sdkTarget irsdkcpp)
set(sdkTargetStatic ${sdkTarget}_static)

set(modelsTarget ${PROJECT_NAME}_models)
set(modelsTargetStatic ${modelsTarget}_static)
set(modelsTargetPython ${modelsTarget}_python)

# OpenXR targets
set(openxrLibTarget ${PROJECT_NAME}_openxr_lib)
set(openxrLibTargetStatic ${openxrLibTarget}_static)

# Shared App Lib
set(sharedAppLibTarget ${PROJECT_NAME}_shared_app_lib)
set(sharedAppLibTargetStatic ${sharedAppLibTarget}_static)

# `vrk_tool` cli
set(appCLITarget ${appNamePrefix}_tool)

# Setup
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# DOXYGEN
find_package(Doxygen REQUIRED)

# CCACHE
find_program(CCACHE_PROGRAM ccache)
if (NOT CCACHE_PROGRAM)
  find_program(CCACHE_PROGRAM ccache PATHS "$ENV{HOME}\\AppData\\Local\\Microsoft\\WinGet\\Links")
endif()

if (CCACHE_PROGRAM)
  message(NOTICE "Selected CCache: ${CCACHE_PROGRAM}")
  set(CCACHE_CMDLINE ${CCACHE_PROGRAM} base_dir=${PROJECT_SOURCE_DIR} hash_dir=false log_file=${PROJECT_SOURCE_DIR}/tmp_ccache.log)
  set(CMAKE_C_COMPILER_LAUNCHER ${CCACHE_CMDLINE})
  set(CMAKE_CXX_COMPILER_LAUNCHER ${CCACHE_CMDLINE})
else ()
  message(WARNING "Could not find ccache, skipping!")
endif ()

# Windows
set(CMAKE_CXX_VISIBILITY_PRESET visible)
#set(CMAKE_CXX_VISIBILITY_PRESET default)

# Add WCHAR def for `spdlog` header inclusion
add_compile_definitions(SPDLOG_WCHAR_TO_UTF8_SUPPORT SPDLOG_WCHAR_SUPPORT SPDLOG_NO_EXCEPTIONS)

# Include CMake helper libs
include(cmake/system.cmake)
include(cmake/embed_resource.cmake)
include(cmake/targets.cmake)
include(cmake/fs.cmake)
include(cmake/dependencies.cmake NO_POLICY_SCOPE)
include(cmake/example_target.cmake)
include(cmake/hybrid_crt.cmake NO_POLICY_SCOPE)

set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
if(DEBUG)
add_compile_options($<$<CXX_COMPILER_ID:MSVC>:/MP> $<$<CXX_COMPILER_ID:MSVC>:/MTd>)
else()
add_compile_options($<$<CXX_COMPILER_ID:MSVC>:/MP> $<$<CXX_COMPILER_ID:MSVC>:/MT>)
endif()


# Include test tools
include(CTest)
include(GoogleTest)

# SDK Include dir
set(sdkIncludeDir ${CMAKE_SOURCE_DIR}/packages/cpp/irsdk++/include)

add_subdirectory(packages/proto)
add_subdirectory(packages/cpp)
add_subdirectory(packages/js/vrkit-native-interop)


