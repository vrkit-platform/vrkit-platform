

SET(targetName vrkit_native_interop)
SET(APP_NAME ${targetName})
SET(APP_VERSION ${appVersion})

# GET SOURCES & HEADERS
FILE(GLOB_RECURSE libSources
  src/native/*.h
  src/native/*.cpp
)
FILE(GLOB_RECURSE libHeaders include/*.h)

# OPTIONS
OPTION(CMAKE_JS_USE_NODE_ADDON_API "Use node-addon-api instead of explicit node headers, etc" ON)

# CMAKE-JS DEFAULT VALUES
SET(CMAKE_JS_VERSION "7.3.0")
SET(NODE_RUNTIME "electron")
SET(NODE_RUNTIMEVERSION "31.3.0")
SET(NODE_ARCH "x64")

# DEFINE & MAKE (IF NEEDED) THE ARTIFACT DIRECTORY
SET(nodeNativeArtifactDir "${CMAKE_CURRENT_LIST_DIR}\\out\\${CMAKE_BUILD_TYPE}")
FILE(MAKE_DIRECTORY "${nodeNativeArtifactDir}")
MESSAGE(STATUS "Using \"${nodeNativeArtifactDir}\" as node native artifact dir")
IF(NOT EXISTS "${nodeNativeArtifactDir}")
  MESSAGE(FATAL_ERROR "Unable to create \"${nodeNativeArtifactDir}\"")
ENDIF()

# REQUIRED SOURCE FILE FOR ELECTRON
SET(CMAKE_JS_SRC "${CMAKE_SOURCE_DIR}/node_modules/cmake-js/lib/cpp/win_delay_load_hook.cc")

IF(CMAKE_JS_USE_NODE_ADDON_API)
  # IF USING `node-addon-api` (C++ WRAPPER)
  SET(CMAKE_JS_INC "")
  LIST(APPEND CMAKE_JS_INC "${CMAKE_SOURCE_DIR}/node_modules/node-api-headers/include" "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")
  SET(CMAKE_JS_LIB "${nodeNativeArtifactDir}/node.lib")
  SET(CMAKE_JS_NODELIB_DEF "${CMAKE_SOURCE_DIR}\\node_modules\\node-api-headers\\def\\node_api.def")
  SET(CMAKE_JS_NODELIB_TARGET "${CMAKE_JS_LIB}")

  # GENERATE node.lib, REQUIRED FOR `node-addon-api`
  EXECUTE_PROCESS(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
ELSE()
  # USE EXPLICIT NODE HEADERS, MAKE SURE TO RUN `cmake-js install`
  SET(cmakeJsRuntimeBase "$ENV{USERPROFILE}/.cmake-js/${NODE_RUNTIME}-${NODE_ARCH}/v${NODE_RUNTIMEVERSION}")
  IF(NOT EXISTS "${cmakeJsRuntimeBase}")
    MESSAGE(FATAL_ERROR "${cmakeJsRuntimeBase} does not exist, try running 'cmake-js install'")
  ENDIF()

  SET(CMAKE_JS_INC "${cmakeJsRuntimeBase}/include/node")
  SET(CMAKE_JS_LIB "${cmakeJsRuntimeBase}/${NODE_ARCH}/node.lib")
ENDIF()

# VERIFY ALL PATHS EXIST
FOREACH(cmakeJsVar CMAKE_JS_SRC CMAKE_JS_LIB CMAKE_JS_INC)
  SET(cmakeJsVarPaths ${${cmakeJsVar}})
  FOREACH(cmakeJsVarPath IN LISTS cmakeJsVarPaths)
    IF(NOT EXISTS ${cmakeJsVarPath})
      MESSAGE(FATAL_ERROR "${cmakeJsVar}=${cmakeJsVarPath} does not exist")
    ENDIF()
  ENDFOREACH()

  MESSAGE(VERBOSE "VALID PATH (${cmakeJsVar}=${cmakeJsVarPaths})")
ENDFOREACH()

# ADD THE TARGET
ADD_LIBRARY(${targetName} SHARED ${libSources} ${CMAKE_JS_SRC})

# APP SPECIFIC CONFIG
VRK_CONFIGURE_APP_LIBS(${targetName})
VRK_CONFIGURE_TARGET(${targetName})

# SET THE ARTIFACT DIRECTORY FOR THIS TARGET
SET_TARGET_PROPERTIES(
  ${targetName}
  PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${nodeNativeArtifactDir}"
  #  MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL"
)

#target_compile_options(${targetName} PRIVATE "/permissive")

# SET NAPI VERSION & LINK OPTIONS
TARGET_COMPILE_DEFINITIONS(
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

TARGET_LINK_OPTIONS(
  ${targetName}
  PUBLIC
  /DELAYLOAD:NODE.EXE
  # TODO: May need the following to build a release version
  #  /OPT:NOREF
)

TARGET_INCLUDE_DIRECTORIES(
  ${targetName}
  PRIVATE
  ${CMAKE_JS_INC}
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${CMAKE_CURRENT_BINARY_DIR})

# SET EXTENSION FOR TARGET TO `.node`
SET_TARGET_PROPERTIES(${targetName} PROPERTIES PREFIX "" SUFFIX ".node")

#target_compile_options(${targetName} PUBLIC "/permissive-")

# INCLUDES
TARGET_LINK_LIBRARIES(${targetName}
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
