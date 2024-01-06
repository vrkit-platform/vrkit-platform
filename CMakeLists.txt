cmake_minimum_required(VERSION 3.15)

project(iracing-tools)

# Subprojects & Targets
set(sdkTarget ${PROJECT_NAME}-sdk)
set(sdkTargetStatic ${sdkTarget}_static)
set(modelsTarget ${PROJECT_NAME}-models)
set(modelsTargetStatic ${modelsTarget}_static)
set(modelsTargetPython ${modelsTarget}_python)
set(sharedAppLibTarget ${PROJECT_NAME}-shared-app-lib)
set(sharedAppLibTargetStatic ${sharedAppLibTarget}_static)

# Setup
set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_VISIBILITY_PRESET visible)

# Include CMake helper libs
include(cmake/targets.cmake)
include(cmake/fs.cmake)
include(cmake/example_target.cmake)

# Deps
find_package(magic_enum CONFIG REQUIRED)

# SDK Include dir
set(sdkIncludeDir ${CMAKE_SOURCE_DIR}/packages/cpp/include)

add_subdirectory(packages/proto)
add_subdirectory(packages/cpp)
add_subdirectory(packages/cpp-apps)

