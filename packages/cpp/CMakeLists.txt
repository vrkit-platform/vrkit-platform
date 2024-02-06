
# SDK Source & headers
file(GLOB_RECURSE sdkTestSources tests/*.cpp)
file(GLOB_RECURSE sdkSources src/*.cpp)
file(GLOB_RECURSE sdkHeaders ${sdkIncludeDir}/*.h)
file(GLOB_RECURSE sdkInternalHeaders src/*.h)

# Create libraries
SETUP_LIB_EXPORTS(${sdkTarget} ${sdkTargetStatic} sdkSources sdkInternalHeaders sdkHeaders)

# Add dependency
target_link_libraries(${sdkTarget} PUBLIC ${DEP_MAGICENUM} ${DEP_GSL})
target_link_libraries(${sdkTargetStatic} PUBLIC ${DEP_MAGICENUM} ${DEP_GSL})


# Tests
set(testTargetName ${sdkTarget}_tests)
add_executable(${testTargetName} ${sdkTestSources})
target_link_libraries(${testTargetName} PUBLIC
  ${sdkTargetStatic})
irt_configure_test_libs(${testTargetName})
