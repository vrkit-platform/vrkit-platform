

# SDK Source & headers
file(GLOB_RECURSE sdkSources *.cpp)
file(GLOB_RECURSE sdkHeaders ${sdkIncludeDir}/*.h)
file(GLOB_RECURSE sdkInternalHeaders *.h EXCLUDE ${sdkIncludeDir})

#include_directories(
#  "${CMAKE_CURRENT_BINARY_DIR}"
#  "${CMAKE_CURRENT_SOURCE_DIR}/include"
#)

# Actual library
SETUP_LIB_EXPORTS(${sdkTarget} ${sdkTargetStatic} sdkSources sdkInternalHeaders sdkHeaders)

# Actual library
#add_library(${sdkTarget} SHARED ${sdkSources} ${sdkHeaders} ${sdkInternalHeaders})
target_link_libraries(${sdkTarget} PRIVATE magic_enum::magic_enum)

#add_library(${sdkTargetStatic} STATIC ${sdkSources} ${sdkHeaders} ${sdkInternalHeaders})
target_link_libraries(${sdkTargetStatic} PRIVATE magic_enum::magic_enum)


