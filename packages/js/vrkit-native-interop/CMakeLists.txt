

set(targetName vrkit_native_interop)
set(APP_NAME ${targetName})
set(APP_VERSION ${appVersion})

# GET SOURCES & HEADERS
file(GLOB_RECURSE libSources
  src/native/*.h
  src/native/*.cpp
)
file(GLOB_RECURSE libHeaders include/*.h)

# OPTIONS
option(CMAKE_JS_USE_NODE_ADDON_API "Use node-addon-api instead of explicit node headers, etc" ON)

# CMAKE-JS DEFAULT VALUES
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

# REQUIRED SOURCE FILE FOR ELECTRON
set(CMAKE_JS_SRC "${CMAKE_SOURCE_DIR}/node_modules/cmake-js/lib/cpp/win_delay_load_hook.cc")

if(CMAKE_JS_USE_NODE_ADDON_API)
  # IF USING `node-addon-api` (C++ WRAPPER)
  set(CMAKE_JS_INC "")
  list(APPEND CMAKE_JS_INC "${CMAKE_SOURCE_DIR}/node_modules/node-api-headers/include" "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")
  set(CMAKE_JS_LIB "${nodeNativeArtifactDir}/node.lib")
  set(CMAKE_JS_NODELIB_DEF "${CMAKE_SOURCE_DIR}\\node_modules\\node-api-headers\\def\\node_api.def")
  set(CMAKE_JS_NODELIB_TARGET "${CMAKE_JS_LIB}")

  # GENERATE node.lib, REQUIRED FOR `node-addon-api`
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
else()
  # USE EXPLICIT NODE HEADERS, MAKE SURE TO RUN `cmake-js install`
  set(cmakeJsRuntimeBase "$ENV{USERPROFILE}/.cmake-js/${NODE_RUNTIME}-${NODE_ARCH}/v${NODE_RUNTIMEVERSION}")
  if (NOT EXISTS "${cmakeJsRuntimeBase}")
    message(FATAL_ERROR "${cmakeJsRuntimeBase} does not exist, try running 'cmake-js install'")
  endif()

  set(CMAKE_JS_INC "${cmakeJsRuntimeBase}/include/node")
  set(CMAKE_JS_LIB "${cmakeJsRuntimeBase}/${NODE_ARCH}/node.lib")
endif()

# VERIFY ALL PATHS EXIST
foreach(cmakeJsVar CMAKE_JS_SRC CMAKE_JS_LIB CMAKE_JS_INC)
  set(cmakeJsVarPaths ${${cmakeJsVar}})
  foreach(cmakeJsVarPath IN LISTS cmakeJsVarPaths)
    if(NOT EXISTS ${cmakeJsVarPath})
      message(FATAL_ERROR "${cmakeJsVar}=${cmakeJsVarPath} does not exist")
    endif()
  endforeach()

  message(VERBOSE "VALID PATH (${cmakeJsVar}=${cmakeJsVarPaths})")
endforeach()

# ADD THE TARGET
add_library(${targetName} SHARED ${libSources} ${CMAKE_JS_SRC})

# APP SPECIFIC CONFIG
VRK_CONFIGURE_APP_LIBS(${targetName})
VRK_CONFIGURE_TARGET(${targetName})

# SET THE ARTIFACT DIRECTORY FOR THIS TARGET
set_target_properties(
  ${targetName}
  PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${nodeNativeArtifactDir}"
#  MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL"
)

#target_compile_options(${targetName} PRIVATE "/permissive")

# SET NAPI VERSION & LINK OPTIONS
target_compile_definitions(
  ${targetName}
  PRIVATE

  # APP/LIB DETAILS
  APP_NAME="${APP_NAME}"
  APP_VERSION="${APP_VERSION}"
  APP_SRC_DIR="${CMAKE_CURRENT_LIST_DIR}"
  _USE_MATH_DEFINES

  # NODE API VERSION
  NAPI_VERSION=9

  # REQUIRED FOR ELECTRON DUE TO PATCHES
  V8_COMPRESS_POINTERS
  V8_REVERSE_JSARGS
  V8_COMPRESS_POINTERS_IN_ISOLATE_CAGE
  _CRT_SECURE_NO_WARNINGS
)

target_link_options(
  ${targetName}
  PUBLIC
  /DELAYLOAD:NODE.EXE
  # TODO: May need the following to build a release version
  #  /OPT:NOREF
)

target_include_directories(
  ${targetName}
  PRIVATE
  ${CMAKE_JS_INC}
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${CMAKE_CURRENT_BINARY_DIR})

# SET EXTENSION FOR TARGET TO `.node`
set_target_properties(${targetName} PROPERTIES PREFIX "" SUFFIX ".node")

#target_compile_options(${targetName} PUBLIC "/permissive-")

# INCLUDES
target_link_libraries(${targetName}
  PRIVATE
  # NODE LIBRARY `node.lib`
  ${CMAKE_JS_LIB}

  # REQUIRED BY ELECTRON FOR THE DELAYED LOAD IMP
  delayimp

  # ALL LIBS REQUIRED
  ${sdkTargetStatic}
  ${sharedAppLibTargetStatic}
  ${modelsTargetStatic}
  ${DEP_DIRECTX}
  ${DEP_LOG}
  ${DEP_YAML}
)
