
# SDK Source & headers
file(GLOB_RECURSE sdkTestSources tests/*.cpp)
file(GLOB_RECURSE sdkSources src/*.cpp)
file(GLOB_RECURSE sdkHeaders include/*.h)
file(GLOB_RECURSE sdkInternalHeaders src/*.h)

# Create libraries
SETUP_LIB_EXPORTS(${sdkTarget} ${sdkTargetStatic} sdkSources sdkInternalHeaders sdkHeaders)

VRK_CONFIGURE_TARGET(${sdkTarget})
VRK_CONFIGURE_TARGET(${sdkTargetStatic})

# Add dependency
VRK_CONFIGURE_SDK_LIBS(${sdkTarget})
VRK_CONFIGURE_SDK_LIBS(${sdkTargetStatic})

# Tests
set(testTargetName ${sdkTarget}_tests)
add_executable(${testTargetName} ${sdkTestSources})
target_link_libraries(${testTargetName} PUBLIC
  ${sdkTargetStatic})
vrk_configure_test_libs(${testTargetName})

set(DOXYGEN_PROJECT_NAME irsdk++)
set(DOXYGEN_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/docs/xml)
set(DOXYGEN_RECURSIVE YES)
set(DOXYGEN_XML_OUTPUT YES)

doxygen_add_docs(
  ${sdkTarget}_docs
  ${CMAKE_CURRENT_LIST_DIR}/src
  ${CMAKE_CURRENT_LIST_DIR}/include
)
