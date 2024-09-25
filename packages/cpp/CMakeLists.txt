
# SDK
add_subdirectory(lib-irsdk++)
add_subdirectory(example-apps)

# Shared App Libs
add_subdirectory(lib-app-shared)

# OpenXR Libs/Tests/Samples/Demos
add_subdirectory(lib-openxr-layer)
add_subdirectory(app-openxr-demo)
add_subdirectory(app-openxr-info)

# Exe: CLI & Service
add_subdirectory(app-cli)
add_subdirectory(app-service)


