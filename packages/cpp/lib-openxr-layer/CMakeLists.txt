
# SDK Source & headers
file(GLOB_RECURSE openxrLibTestSources tests/*.cpp)
file(GLOB_RECURSE openxrLibSources src/*.cpp)
file(GLOB_RECURSE openxrLibHeaders src/*.h)
file(GLOB_RECURSE openxrLibHeadersPublic include/*.h)


## SETUP
add_library(${openxrLibTarget} SHARED ${openxrLibSources} ${openxrLibHeaders} ${openxrLibHeadersPublic})

VRK_CONFIGURE_TARGET(${openxrLibTarget})

# SET THE ARTIFACT DIRECTORY FOR THIS TARGET
set(openxrLibArtifactDir "${CMAKE_CURRENT_LIST_DIR}\\out\\${CMAKE_BUILD_TYPE}")
set_target_properties(
  ${openxrLibTarget}
  PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${openxrLibArtifactDir}"
)

## INCLUDES
target_include_directories(${openxrLibTarget} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
  $<INSTALL_INTERFACE:include>
)

target_include_directories(${openxrLibTarget} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
)

## SOURCES
target_sources(
  ${openxrLibTarget}
  PUBLIC
  FILE_SET publicHeaders
  TYPE HEADERS
  FILES
  ${openxrLibHeadersPublic}
)

## LINKS
target_link_libraries(
  ${openxrLibTarget}
  PRIVATE
  ${sdkTargetStatic}
  ${modelsTargetStatic}
  ${sharedAppLibTargetStatic}
)

VRK_CONFIGURE_APP_LIBS(${openxrLibTarget})


set(
  RUNTIME_FILES
  "${CMAKE_CURRENT_LIST_DIR}/openxr-api-layer.json"
)

## INSTALL
#install(TARGETS ${openxrLibTarget} LIBRARY DESTINATION "${CMAKE_INSTALL_BINDIR}")
install(TARGETS ${openxrLibTarget} FILE_SET publicHeaders DESTINATION ${INCLUDE_INSTALL_DIR})
install(FILES "${RUNTIME_FILES}" TYPE BIN)


# TESTS
#set(testTargetName ${openxrLibTarget}_tests)
#add_executable(${testTargetName} ${openxrLibTestSources})
#target_link_libraries(${testTargetName} PUBLIC
#  ${openxrLibTarget})
#vrk_configure_test_libs(${testTargetName})
#
