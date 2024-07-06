
# SDK
add_subdirectory(lib-irsdk++)
add_subdirectory(example-apps)

# Shared App Libs
add_subdirectory(lib-app-shared)

# OpenXR Libs/Tests/Samples/Demos
add_subdirectory(lib-openxr-layer)
add_subdirectory(app-openxr-demo)

# App Projects
# add_subdirectory(overlay-app)

# UI
# TODO: Replace with electron or other webview based framework
#add_subdirectory(app-ui)
#add_subdirectory(app-ui-qt)

add_subdirectory(app-cli)
add_subdirectory(app-service)


