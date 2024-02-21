
list_subdirs(exampleDirs ${CMAKE_CURRENT_LIST_DIR})

foreach(exampleDir ${exampleDirs})

  if (EXISTS ${exampleDir}/CMakeLists.txt)
    message(STATUS "Example (${exampleDir}) has CMakeLists.txt, including directly")
    add_subdirectory(${exampleDir})
    continue()
  elseif (NOT EXISTS ${exampleDir}/.enable)
    message(WARNING "Example (${exampleDir}) is missing CMakeLists.txt")
    continue()
  endif()

  message(STATUS "Adding example: ${exampleDir}")
  add_example(${exampleDir})
endforeach()