include(GenerateExportHeader)
include(GNUInstallDirs)
include(CMakeParseArguments)

macro(SETUP_TARGET_COMPILE_DEFS targetName)
  target_compile_definitions(
    ${targetName}
    PRIVATE
    APP_NAME="${APP_NAME}"
    APP_VERSION="${APP_VERSION}"
  )

  target_compile_definitions(
    ${targetName}
    PRIVATE
    $<$<CONFIG:Debug>:DEBUG>
  )

  target_compile_definitions(
    ${targetName}
    PRIVATE
    FMT_USE_STRING_VIEW
    SPDLOG_WCHAR_SUPPORT=1
    SPDLOG_WCHAR_TO_UTF8_SUPPORT=1
  )

  if (MSVC)
    target_compile_options(${targetName}
      PRIVATE
      $<$<CONFIG:Debug>:/DEBUG:FASTLINK>
    )
  endif()
#  if (DEBUG)
#    target_compile_definitions(
#      ${targetName}
#      PRIVATE
#      DEBUG
#    )
#  endif()
endmacro()

macro(SETUP_LIB_EXPORTS)
  set(options NO_SOURCE_HEADERS)
  cmake_parse_arguments(SETUP_LIB_EXPORTS "${options}" "" "" ${ARGN})

  set(idx 0)
  set(reqArgList sharedTarget staticTarget libSourcesVarName libHeadersVarName libHeadersPublicVarName)
  set(argList ${SETUP_LIB_EXPORTS_UNPARSED_ARGUMENTS})
  list(LENGTH reqArgList reqArgCount)
  list(LENGTH argList argCount)
  message(NOTICE "reqArgCount=${reqArgCount}, argCount${argCount}")
  if(NOT ${reqArgCount} EQUAL ${argCount})
    message(FATAL_ERROR "reqArgCount=${reqArgCount} != argCount${argCount}")
  endif()
  foreach(argName ${reqArgList})
    list(GET argList ${idx} argValue)
    math(EXPR idx "${idx} + 1")
    message(NOTICE "Setting ${argName} to ${argValue}")
    set(${argName} ${argValue})
  endforeach()

  # sharedTarget staticTarget libSourcesVarName libHeadersVarName libHeadersPublicVarName
  #  set(staticTarget ${sharedTarget}_static)
  set(targets ${sharedTarget} ${staticTarget})
  set(macroBaseName ${sharedTarget}_and_static)
  string(TOUPPER ${macroBaseName} macroCompileFlag)
  set(exportHeader ${CMAKE_CURRENT_BINARY_DIR}/${macroBaseName}_export.h)

  add_library(${sharedTarget} SHARED ${${libSourcesVarName}} ${${libHeadersVarName}} ${exportHeader})
  add_library(${staticTarget} STATIC ${${libSourcesVarName}} ${${libHeadersVarName}} ${exportHeader})

  generate_export_header(${sharedTarget} BASE_NAME ${macroBaseName})
  set_target_properties(${staticTarget} PROPERTIES
    COMPILE_FLAGS -D${macroCompileFlag})

  message(NOTICE "Creating lib targets (${targets}) with source dir: ${CMAKE_CURRENT_SOURCE_DIR}")
  foreach(target ${targets})
    target_include_directories(${target} PUBLIC
      $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
      $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
    )

    if(NOT SETUP_LIB_EXPORTS_NO_SOURCE_HEADERS)
      target_include_directories(${target} PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
      )

      target_sources(
        ${target}
        PUBLIC
        FILE_SET publicHeaders
        TYPE HEADERS
        FILES
        ${${libHeadersPublicVarName}}
      )
      install(TARGETS ${target} FILE_SET publicHeaders DESTINATION ${INCLUDE_INSTALL_DIR})
    endif()

    install(TARGETS ${target} DESTINATION ${LIBRARY_INSTALL_DIR})
    #    install(TARGETS ${target} FILE_SET publicExportHeaders DESTINATION ${INCLUDE_INSTALL_DIR})
    #    install(TARGETS ${target} FILES
    #      ${exportHeader} DESTINATION ${INCLUDE_INSTALL_DIR}
    #    )
  endforeach()
endmacro()

macro(SETUP_MOD_EXPORTS)
  set(options NO_SOURCE_HEADERS)
  cmake_parse_arguments(SETUP_MOD_EXPORTS "${options}" "" "" ${ARGN})

  set(idx 0)
  set(reqArgList sharedTarget staticTarget libSourcesVarName libHeadersVarName libHeadersPublicVarName)
  set(argList ${SETUP_MOD_EXPORTS_UNPARSED_ARGUMENTS})
  list(LENGTH reqArgList reqArgCount)
  list(LENGTH argList argCount)
  message(NOTICE "reqArgCount=${reqArgCount}, argCount${argCount}")
  if(NOT ${reqArgCount} EQUAL ${argCount})
    message(FATAL_ERROR "reqArgCount=${reqArgCount} != argCount${argCount}")
  endif()
  foreach(argName ${reqArgList})
    list(GET argList ${idx} argValue)
    math(EXPR idx "${idx} + 1")
    message(NOTICE "Setting ${argName} to ${argValue}")
    set(${argName} ${argValue})
  endforeach()

  # sharedTarget staticTarget libSourcesVarName libHeadersVarName libHeadersPublicVarName
  #  set(staticTarget ${sharedTarget}_static)
  set(targets ${sharedTarget} ${staticTarget})
  set(macroBaseName ${sharedTarget}_and_static)
  string(TOUPPER ${macroBaseName} macroCompileFlag)
  set(exportHeader ${CMAKE_CURRENT_BINARY_DIR}/${macroBaseName}_export.h)

  add_library(${sharedTarget} MODULE ${${libSourcesVarName}} ${${libHeadersVarName}} ${exportHeader})
  add_library(${staticTarget} MODULE ${${libSourcesVarName}} ${${libHeadersVarName}} ${exportHeader})

  generate_export_header(${sharedTarget} BASE_NAME ${macroBaseName})
  set_target_properties(${staticTarget} PROPERTIES
    COMPILE_FLAGS -D${macroCompileFlag})

  message(NOTICE "Creating lib targets (${targets}) with source dir: ${CMAKE_CURRENT_SOURCE_DIR}")
  foreach(target ${targets})
    target_include_directories(${target} PUBLIC
      $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
      $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
    )

    if(NOT SETUP_MOD_EXPORTS_NO_SOURCE_HEADERS)
      target_include_directories(${target} PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
      )

      target_sources(
        ${target}
        PUBLIC
        FILE_SET publicHeaders
        TYPE HEADERS
        FILES
        ${${libHeadersPublicVarName}}
      )
      #      install(TARGETS ${target} FILE_SET publicHeaders DESTINATION ${INCLUDE_INSTALL_DIR})
    endif()

    #    install(TARGETS ${target} DESTINATION ${LIBRARY_INSTALL_DIR})
    #    install(TARGETS ${target} FILE_SET publicExportHeaders DESTINATION ${INCLUDE_INSTALL_DIR})
    #    install(TARGETS ${target} FILES
    #      ${exportHeader} DESTINATION ${INCLUDE_INSTALL_DIR}
    #    )
  endforeach()
endmacro()

function(VRK_CONFIGURE_TARGET TARGET)
  set_property(TARGET ${TARGET} PROPERTY
    MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")

  SETUP_TARGET_COMPILE_DEFS(${TARGET})

  message(NOTICE "CMAKE_BUILD_TYPE == ${CMAKE_BUILD_TYPE}")

  target_compile_definitions(
    ${TARGET}
    PRIVATE
    $<$<CONFIG:Debug>:DEBUG>
    BUILD_TYPE="${CMAKE_BUILD_TYPE}"
  )
endfunction()