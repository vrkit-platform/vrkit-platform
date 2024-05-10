
# SDK
add_subdirectory(irsdk++)

# Shared App Libs
add_subdirectory(shared-app-lib)

# OpenXR Libs/Tests/Samples/Demos
add_subdirectory(openxr-lib)
add_subdirectory(openxr-demo-app)

# App Projects
add_subdirectory(overlay-app)

# UI
#add_subdirectory(app-ui)
add_subdirectory(app-ui-qt)
add_subdirectory(app-cli)
add_subdirectory(example-apps)