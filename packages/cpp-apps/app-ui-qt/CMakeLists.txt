
file(GLOB_RECURSE appSources src/*.cpp src/*.ui)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName ${appUIQTTarget})
#add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})
qt_add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders}

)

# Include headers for generated files
target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

# Link configured deps
target_link_runtime_libs(${targetName})

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic})

set_target_properties(${targetName} PROPERTIES
  WIN32_EXECUTABLE TRUE
)

#target_link_libraries(${targetName} PRIVATE
#    Qt6::Core
#    Qt6::Gui
#    Qt6::Widgets
#)

#install(TARGETS ${targetName}
#  RUNTIME DESTINATION "${INSTALL_EXAMPLEDIR}"
#  BUNDLE DESTINATION "${INSTALL_EXAMPLEDIR}"
#  LIBRARY DESTINATION "${INSTALL_EXAMPLEDIR}"
#)
