

set(targetName vrkit_native_interop)
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

file(GLOB_RECURSE libSources
  src/cpp/*.cpp
  src/cpp/*.h
)
file(GLOB_RECURSE libHeaders include/*.h)

#  add_definitions(-DNAPI_VERSION=8)

#set(CMAKE_BUILD_TYPE "Debug")

set(CMAKE_JS_VERSION "7.3.0")
set(NODE_RUNTIME "electron")
set(NODE_RUNTIMEVERSION "31.3.0")
set(NODE_ARCH "x64")

# DEFINE & MAKE (IF NEEDED) THE ARTIFACT DIRECTORY
set(nodeNativeArtifactDir "${CMAKE_CURRENT_LIST_DIR}\\out\\${CMAKE_BUILD_TYPE}")
file(MAKE_DIRECTORY "${nodeNativeArtifactDir}")
message(STATUS "Using \"${nodeNativeArtifactDir}\" as node native artifact dir")
if(NOT EXISTS "${nodeNativeArtifactDir}")
  message(FATAL_ERROR "Unable to create \"${nodeNativeArtifactDir}\"")
endif()



#set(cmakeJsRuntimeBase "$ENV{USERPROFILE}/.cmake-js/${NODE_RUNTIME}-${NODE_ARCH}/v${NODE_RUNTIMEVERSION}")
#if (NOT EXISTS "${cmakeJsRuntimeBase}")
#  message(FATAL_ERROR "${cmakeJsRuntimeBase} does not exist")
#endif()

#C:\\Users\\jglanz\\.cmake-js\\electron-x64\\v31.3.0\\x64\\node.lib',
#set(CMAKE_JS_INC "${cmakeJsRuntimeBase}/include/node;${CMAKE_SOURCE_DIR}/node_modules/node-api-headers/include;${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api")
set(CMAKE_JS_INC "")
list(APPEND CMAKE_JS_INC "${CMAKE_SOURCE_DIR}/node_modules/node-api-headers/include" "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")
#list(APPEND CMAKE_JS_INC "${cmakeJsRuntimeBase}/include/node" "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")

#${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api
set(CMAKE_JS_SRC "${CMAKE_SOURCE_DIR}/node_modules/cmake-js/lib/cpp/win_delay_load_hook.cc")
#set(CMAKE_JS_LIB "${cmakeJsRuntimeBase}/${NODE_ARCH}/node.lib")
set(CMAKE_JS_LIB "${nodeNativeArtifactDir}/node.lib")
set(CMAKE_JS_NODELIB_DEF "${CMAKE_SOURCE_DIR}\\node_modules\\node-api-headers\\def\\node_api.def")
set(CMAKE_JS_NODELIB_TARGET "${CMAKE_JS_LIB}")

# Generate node.lib
execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})

#message(STATUS "
#  CMAKE_JS_INC=${CMAKE_JS_INC}
#  CMAKE_JS_SRC=${CMAKE_JS_SRC}
#  CMAKE_JS_LIB=${CMAKE_JS_LIB}
#")

# VERIFY ALL PATHS EXIST
foreach(cmakeJsVar CMAKE_JS_SRC CMAKE_JS_LIB CMAKE_JS_INC)
  set(cmakeJsVarPaths ${${cmakeJsVar}})

  foreach(cmakeJsVarPath IN LISTS cmakeJsVarPaths)
    if(NOT EXISTS ${cmakeJsVarPath})
      message(FATAL_ERROR "${cmakeJsVar}=${cmakeJsVarPath} does not exist")
    endif()
  endforeach()

  message(STATUS "VALID: ${cmakeJsVar}=${cmakeJsVarPaths}")
endforeach()


add_library(${targetName} SHARED ${libSources} ${CMAKE_JS_SRC})

VRK_CONFIGURE_APP_LIBS(${targetName})
VRK_CONFIGURE_TARGET(${targetName})

# SET THE ARTIFACT DIRECTORY FOR THIS TARGET
set_target_properties(
  ${targetName}
  PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${nodeNativeArtifactDir}"
#  MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL"
)

#set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL")
#add_definitions(-D_CRT_SECURE_NO_WARNINGS)
# SET NAPI VERSION & LINK OPTIONS
target_compile_definitions(${targetName}
  PRIVATE
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  APP_SRC_DIR="${CMAKE_CURRENT_LIST_DIR}"
  _USE_MATH_DEFINES
  NAPI_VERSION=9
  V8_COMPRESS_POINTERS
  V8_REVERSE_JSARGS
  V8_COMPRESS_POINTERS_IN_ISOLATE_CAGE
  _CRT_SECURE_NO_WARNINGS
)
target_link_options(
  ${targetName}
  PUBLIC
  /DELAYLOAD:NODE.EXE
#  /OPT:NOREF
)


#execute_process(COMMAND node -p "require('node-addon-api').include"
#  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
#  OUTPUT_VARIABLE nodeAddonApiIncludeDir
#)
#string(REGEX REPLACE "[\r\n\"]" "" nodeAddonApiIncludeDir ${nodeAddonApiIncludeDir})

target_include_directories(
  ${targetName}
  PRIVATE
#  ${nodeAddonApiIncludeDir}
  ${CMAKE_JS_INC}
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${CMAKE_CURRENT_BINARY_DIR})

set_target_properties(${targetName} PROPERTIES PREFIX "" SUFFIX ".node")

#target_link_libraries(${targetName} PRIVATE ${CMAKE_JS_LIB} delayimp)
target_link_libraries(${targetName}
  PRIVATE
  ${CMAKE_JS_LIB}
  delayimp
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_DIRECTX}
  ${DEP_LOG}
  ${DEP_YAML}
)

#endif()