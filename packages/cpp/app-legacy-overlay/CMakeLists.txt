# SDK Source & headers
file(GLOB_RECURSE appSources src/*.cpp)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName ${overlayAppTarget})
add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})

# Include headers for generated files
target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

# Link configured deps
VRK_CONFIGURE_APP_LIBS(${targetName})

# Link other local project targets
#target_link_libraries(${targetName} PRIVATE ${sdkTargetStatic} ${sharedAppLibTargetStatic} ${modelsTargetStatic} ${Protobuf_LIBRARY_DEBUG})
#target_link_libraries(${targetName} PRIVATE ${sdkTarget} ${sharedAppLibTarget} ${modelsTarget} ${Protobuf_LIBRARY_DEBUG})
target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic})




