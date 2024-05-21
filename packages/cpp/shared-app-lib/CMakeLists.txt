
# SDK Source & headers
file(GLOB_RECURSE sharedAppLibTestSources tests/*.cpp)
file(GLOB_RECURSE sharedAppLibSources src/*.cpp)
file(GLOB_RECURSE sharedAppLibHeaders src/*.h)
file(GLOB_RECURSE sharedAppLibHeadersPublic include/*.h)

# Embed Resources
set(RC_SRC_DIR "${CMAKE_CURRENT_LIST_DIR}/resources")
set(RC_OUT_SRC_FILES)
embed_shader_fx_resource("${RC_SRC_DIR}/TrackMapShader.fx" RCDataTrackMapShader RC_OUT_SRC_FILES)
embed_resource("${RC_SRC_DIR}/sampleImage.jpg" RCDataSampleImage RC_OUT_SRC_FILES)

message(NOTICE "RC SRC Generated: ${RC_OUT_SRC_FILES}")
list(APPEND sharedAppLibSources ${RC_OUT_SRC_FILES})

## SETUP
add_library(${sharedAppLibTargetStatic} STATIC ${sharedAppLibSources} ${sharedAppLibHeaders} ${sharedAppLibHeadersPublic} )
#target_link_libraries(${sharedAppLibTargetStatic} PUBLIC ${sdkTargetStatic} ${modelsTargetStatic} ${ALL_APP_DEPS})

IRT_CONFIGURE_TARGET(${sharedAppLibTargetStatic})

target_link_sdl2(${sharedAppLibTargetStatic})

## INCLUDES
target_include_directories(${sharedAppLibTargetStatic} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
  $<INSTALL_INTERFACE:include>
)

target_include_directories(${sharedAppLibTargetStatic} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
)

## SOURCES
target_sources(
  ${sharedAppLibTargetStatic}
  PUBLIC
  FILE_SET publicHeaders
  TYPE HEADERS
  FILES
  ${sharedAppLibHeadersPublic}
)

## LINKS
target_link_libraries(
  ${sharedAppLibTargetStatic}
  PRIVATE
  ${sdkTargetStatic}
  ${modelsTargetStatic}
)

IRT_CONFIGURE_APP_LIBS(${sharedAppLibTargetStatic})

## INSTALL
install(TARGETS ${sharedAppLibTargetStatic} FILE_SET publicHeaders DESTINATION ${INCLUDE_INSTALL_DIR})

# TESTS
set(testTargetName ${sharedAppLibTarget}_tests)
add_executable(${testTargetName} ${sharedAppLibTestSources})
target_link_libraries(${testTargetName} PRIVATE
  ${sharedAppLibTargetStatic}
  ${sdkTargetStatic}
  ${modelsTargetStatic})
irt_configure_test_libs(${testTargetName})

