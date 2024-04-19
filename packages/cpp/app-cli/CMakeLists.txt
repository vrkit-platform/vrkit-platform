
file(GLOB_RECURSE appSources
  src/*.cpp
  src/*.h
)
file(GLOB_RECURSE appHeaders include/*.h)

# App
set(targetName ${appCLITarget})
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

#qt_add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})
add_executable(${targetName} ${appSources} ${appHeaders} ${sdkInternalHeaders})

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_CURRENT_LIST_DIR}/src
  ${CMAKE_CURRENT_LIST_DIR}/include
  ${CMAKE_CURRENT_BINARY_DIR}
)

# Set App Name & Version
target_compile_definitions(
  ${targetName}
  PUBLIC
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
)

target_link_libraries(${targetName}
  PRIVATE
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_PROTOBUF}
  ${DEP_JSON}
  ${DEP_MAGICENUM}
  ${DEP_FMT}
  ${DEP_QT_CORE}
  ${DEP_GSL}
  ${DEP_BOOST_DEFAULT}
  
)

#install(TARGETS ${targetName}
#  RUNTIME DESTINATION "${INSTALL_EXAMPLEDIR}"
#  BUNDLE DESTINATION "${INSTALL_EXAMPLEDIR}"
#  LIBRARY DESTINATION "${INSTALL_EXAMPLEDIR}"
#)

