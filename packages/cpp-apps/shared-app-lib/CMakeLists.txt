
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

# Create Library & Targets
setup_lib_exports(${sharedAppLibTarget} ${sharedAppLibTargetStatic} sharedAppLibSources sharedAppLibHeaders sharedAppLibHeadersPublic)

# Link targets
target_link_libraries(${sharedAppLibTarget} PUBLIC ${modelsTarget})
target_link_libraries(${sharedAppLibTargetStatic} PUBLIC ${modelsTargetStatic})

foreach(targetName ${sharedAppLibTarget} ${sharedAppLibTargetStatic})
  target_link_runtime_libs(${targetName})
endforeach()

# Tests
set(testTargetName ${sharedAppLibTarget}_tests)
add_executable(${testTargetName} ${sharedAppLibTestSources})
target_link_libraries(${testTargetName} PUBLIC
  ${sharedAppLibTargetStatic})
target_link_test_libs(${testTargetName})

