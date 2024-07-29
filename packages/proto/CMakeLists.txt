
message(NOTICE "Protobuf INCLUDE_DIRS= ${Protobuf_INCLUDE_DIRS}")
include_directories(${Protobuf_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_BINARY_DIR})

set(PROTO_INCLUDE_DEST ${CMAKE_CURRENT_BINARY_DIR}/IRacingTools/Models)
file(MAKE_DIRECTORY ${PROTO_INCLUDE_DEST})
file(GLOB_RECURSE PROTO_FILES *.proto)
protobuf_generate(
  LANGUAGE cpp
  OUT_VAR PROTO_GEN_FILES
  PROTOC_OUT_DIR ${PROTO_INCLUDE_DEST}
  PROTOS ${PROTO_FILES})

message(NOTICE "Generated ${PROTO_GEN_FILES}")
set(PROTO_SRCS)
set(PROTO_HDRS)

foreach(PROTO_GEN_FILE ${PROTO_GEN_FILES})
  if(PROTO_GEN_FILE MATCHES "cc$")
    list(APPEND PROTO_SRCS ${PROTO_GEN_FILE})
  else()
    list(APPEND PROTO_HDRS ${PROTO_GEN_FILE})
  endif()
endforeach()

# Python Target
add_custom_target(
  ${modelsTargetPython}
  ${CMAKE_SOURCE_DIR}/scripts/protoc-python.bat
)

# Shared & Static CPP Targets
add_library(${modelsTarget} SHARED ${PROTO_GEN_FILES})
add_library(${modelsTargetStatic} STATIC ${PROTO_GEN_FILES})

foreach(target ${modelsTarget} ${modelsTargetStatic})
  target_link_libraries(${target} PUBLIC protobuf::libprotobuf)
  target_include_directories(${target} PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}>
    ${PROTO_INCLUDE_DEST}
    $<INSTALL_INTERFACE:include>
  )
endforeach()
