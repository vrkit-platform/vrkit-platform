file(REAL_PATH "${CMAKE_CURRENT_LIST_DIR}/../.." workspaceRoot)
file(REAL_PATH "${CMAKE_CURRENT_LIST_DIR}/../external" externalProjectPath)

SET(irsdkcppPath "${workspaceRoot}/irsdk++")
SET(irsdkcppLinkPath "${externalProjectPath}/irsdkcpp")
SET(irsdkcppPkgRelativePath "packages/sdk")

file(MAKE_DIRECTORY ${externalProjectPath})

macro(LIST_SUBDIRS result parentDir)
  file(GLOB childDirs RELATIVE ${parentDir} ${parentDir}/*)
  set(dirs "")
  foreach(childDir ${childDirs})
    if(IS_DIRECTORY ${parentDir}/${childDir})
      list(APPEND dirs "${parentDir}/${childDir}")
    endif()
  endforeach()
  set(${result} ${dirs})
endmacro()