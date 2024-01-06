
find_package(Protobuf REQUIRED)
include_directories(${Protobuf_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_BINARY_DIR})

set(protoIncludeDest ${CMAKE_CURRENT_BINARY_DIR}/IRacingTools/Models)
file(MAKE_DIRECTORY ${protoIncludeDest})
protobuf_generate(
  LANGUAGE cpp
  OUT_VAR allProtoGenFiles
  PROTOC_OUT_DIR ${protoIncludeDest}
  PROTOS LapData.proto)
#protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS irsdk_models.proto)
#protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS EXPORT_MACRO DLL_EXPORT irsdk_models.proto)
#protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS DESCRIPTORS PROTO_DESCS irsdk_models.proto)
#protobuf_generate_python(PROTO_PY irsdk_models.proto)
message(NOTICE "Generated ${allProtoGenFiles}")
set(PROTO_SRCS)
set(PROTO_HDRS)

foreach(genFile ${allProtoGenFiles})
  if(genFile MATCHES "cc$")
    list(APPEND PROTO_SRCS ${genFile})
  else()
    list(APPEND PROTO_HDRS ${genFile})
  endif()
endforeach()

#get_filename_component(modelProtoFile irsdk_models.proto ABSOLUTE)

add_custom_target(
  ${modelsTargetPython}
  ${CMAKE_SOURCE_DIR}/scripts/protoc-python.bat
)

#add_custom_command(
#  TARGET ${modelsTargetPython}
#  COMMAND protobuf::protoc
#  ARGS -I ${CMAKE_CURRENT_LIST_DIR} --python_out=${CMAKE_SOURCE_DIR}/packages/python/irsdk/models --mypy_out=${CMAKE_SOURCE_DIR}/packages/python/irsdk/models ${modelProtoFile}
#  DEPENDS ${modelProtoFile} protobuf::protoc ${protobuf_generate_DEPENDENCIES}
#  PRE_BUILD
#  VERBATIM )
##SETUP_LIB_EXPORTS(${modelsTarget} ${modelsTargetStatic} PROTO_SRCS PROTO_HDRS PROTO_HDRS)
#add_library(${modelsTarget} SHARED ${PROTO_SRCS} ${PROTO_HDRS})
#target_link_libraries(${modelsTarget} ${Protobuf_LIBRARIES})
#
#add_library(${modelsTargetStatic} STATIC ${PROTO_SRCS} ${PROTO_HDRS})
#target_link_libraries(${modelsTargetStatic} ${Protobuf_LIBRARIES})
#
#foreach(target ${modelsTarget} ${modelsTargetStatic})
#
#  target_include_directories(${target} PUBLIC
#    $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
#    $<INSTALL_INTERFACE:include>  # <prefix>/include/mylib
#  )
#
##  install(TARGETS ${target} DESTINATION ${LIBRARY_INSTALL_DIR})
##  install(TARGETS ${target} FILES  DESTINATION ${INCLUDE_INSTALL_DIR})
#endforeach()

SETUP_LIB_EXPORTS(NO_SOURCE_HEADERS ${modelsTarget} ${modelsTargetStatic} PROTO_SRCS PROTO_HDRS PROTO_HDRS)

foreach(headerFile ${PROTO_HDRS})
  foreach(target ${modelsTarget} ${modelsTargetStatic})
    get_filename_component(baseHeaderFile ${headerFile} NAME)
    set(relHeaderFile IRacingTools/Models/${baseHeaderFile})
    target_sources(
      ${target}
      PUBLIC
      $<INSTALL_INTERFACE:${relHeaderFile}>
      $<BUILD_INTERFACE:${headerFile}>
    )
  endforeach()
endforeach()

target_link_libraries(${modelsTarget} ${Protobuf_LIBRARIES})
target_link_libraries(${modelsTargetStatic} ${Protobuf_LIBRARIES})
