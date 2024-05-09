
# SDK Source & headers
file(GLOB_RECURSE openxrLibTestSources tests/*.cpp)
file(GLOB_RECURSE openxrLibSources src/*.cpp)
file(GLOB_RECURSE openxrLibHeaders src/*.h)
file(GLOB_RECURSE openxrLibHeadersPublic include/*.h)


## SETUP
add_library(${openxrLibTarget} SHARED ${openxrLibSources} ${openxrLibHeaders} ${openxrLibHeadersPublic})

IRT_CONFIGURE_TARGET(${openxrLibTarget})

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

IRT_CONFIGURE_APP_LIBS(${openxrLibTarget})

## INSTALL
install(TARGETS ${openxrLibTarget} FILE_SET publicHeaders DESTINATION ${INCLUDE_INSTALL_DIR})

# TESTS
#set(testTargetName ${openxrLibTarget}_tests)
#add_executable(${testTargetName} ${openxrLibTestSources})
#target_link_libraries(${testTargetName} PUBLIC
#  ${openxrLibTarget})
#irt_configure_test_libs(${testTargetName})
#
