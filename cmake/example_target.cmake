
function(ADD_EXAMPLE exampleDir)
  get_filename_component(exampleName ${exampleDir} NAME)
  set(exampleTarget ${PROJECT_NAME}_example_${exampleName})
  file(GLOB sourceFiles ${exampleDir}/*.cpp)
  file(GLOB headerFiles ${exampleDir}/*.h)

  add_executable(${exampleTarget} ${sourceFiles} ${headerFiles})
  target_include_directories(${exampleTarget}
    BEFORE
    PRIVATE
    ${sdkIncludeDir}
  )
  target_link_libraries(${exampleTarget} PRIVATE
    ${sdkTargetStatic}
    ${modelsTargetStatic}
    ${DEP_MAGICENUM}
    ${DEP_PROTOBUF}
  )
endfunction()