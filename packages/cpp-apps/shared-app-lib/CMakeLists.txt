

ENABLE_LANGUAGE(RC)

set(graphicsBinaryDir ${CMAKE_CURRENT_BINARY_DIR}/resources/shaders)
file(MAKE_DIRECTORY ${graphicsBinaryDir})
add_custom_command(
  OUTPUT ${graphicsBinaryDir}/TrackMapShader.fxo
  PRE_BUILD
  COMMAND fxc
  ARGS /T fx_5_0 /Fo ${graphicsBinaryDir}/TrackMapShader.fxo ${CMAKE_CURRENT_LIST_DIR}/TrackMapShader.fx
  VERBATIM
)
embed_resource("${graphicsBinaryDir}/TrackMapShader.fxo" "${graphicsBinaryDir}/TrackMapShader.c" RCDataTrackMapShader)
embed_resource("${CMAKE_CURRENT_LIST_DIR}/sampleImage.jpg" "${graphicsBinaryDir}/sampleImage.c" RCDataSampleImage)

# SDK Source & headers
file(GLOB_RECURSE sharedAppLibSources *.cpp )
file(GLOB_RECURSE sharedAppLibHeaders *.h EXCLUDE include)
file(GLOB_RECURSE sharedAppLibHeadersPublic include/*.h)

list(APPEND sharedAppLibSources "${graphicsBinaryDir}/TrackMapShader.c" "${graphicsBinaryDir}/sampleImage.c")

set(depPkgNames directxmath directxtk fmt OpenXR dxsdk-d3dx protobuf effects11)
foreach(depPkgName ${depPkgNames})
  find_package(${depPkgName} CONFIG REQUIRED)
endforeach()

# Actual library
SETUP_LIB_EXPORTS(${sharedAppLibTarget} ${sharedAppLibTargetStatic} sharedAppLibSources sharedAppLibHeaders sharedAppLibHeadersPublic)

#add_library(${sharedAppLibTarget} SHARED ${sharedAppLibSources} ${sharedAppLibHeaders})
#target_link_libraries(${sharedAppLibTarget} PUBLIC magic_enum::magic_enum)
target_link_libraries(${sharedAppLibTarget} PUBLIC ${modelsTarget})

#add_library(${sharedAppLibTargetStatic} STATIC ${sharedAppLibSources} ${sharedAppLibHeaders} ${sharedAppLibInternalHeaders})
#${Protobuf_LIBRARIES}

target_link_libraries(${sharedAppLibTargetStatic} PUBLIC ${modelsTargetStatic})

target_compile_definitions(${sharedAppLibTargetStatic} PUBLIC IS_STATIC_LIB)

#add_custom_command(
#  TARGET ${sharedAppLibTargetStatic}
#  PRE_BUILD
#  COMMAND fxc
#  ARGS /T fx_5_0 /Fo ${graphicsBinaryDir}/TrackMapShaderStatic.fxo ${CMAKE_CURRENT_LIST_DIR}/TrackMapShader.fx
##  COMMAND echo
##  ARGS IDR_PIXEL_TRACK_MAP_SHADER RCDATA TrackMapShader.fxo > ${graphicsBinaryDir}/TrackMapShader.resinclude
#  VERBATIM
#)

#embed_resource(${sharedAppLibTargetStatic} "${graphicsBinaryDir}/TrackMapShaderStatic.fxo" "${graphicsBinaryDir}/TrackMapShaderStatic.cpp" RCDataTrackMapShader)

#add_custom_command(
#  TARGET ${sharedAppLibTarget}
#  PRE_BUILD
#  COMMAND fxc
#  ARGS /T fx_5_0 /Fo ${graphicsBinaryDir}/TrackMapShader.fxo ${CMAKE_CURRENT_LIST_DIR}/TrackMapShader.fx
##  COMMAND echo
##  ARGS IDR_PIXEL_TRACK_MAP_SHADER RCDATA TrackMapShader.fxo > ${graphicsBinaryDir}/TrackMapShader.resinclude
#  VERBATIM
#)

#embed_resource(${sharedAppLibTarget} "${graphicsBinaryDir}/TrackMapShader.fxo" "${graphicsBinaryDir}/TrackMapShader.cpp" RCDataTrackMapShader)

foreach(targetName ${sharedAppLibTarget} ${sharedAppLibTargetStatic})
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum )
  target_link_libraries(${targetName} PUBLIC d2d1.lib dwrite.lib windowscodecs.lib dxgi.lib d3d10_1.lib d3d11.lib)
  target_link_libraries(${targetName} PUBLIC Microsoft::D3DX9 Microsoft::D3DX10 Microsoft::D3DX11 Microsoft::Effects11)
  target_link_libraries(${targetName} PUBLIC Microsoft::DirectXMath)
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum )
  target_link_libraries(${targetName} PUBLIC Microsoft::DirectXTK)
  target_link_libraries(${targetName} PUBLIC fmt::fmt)
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum)
  target_link_libraries(${targetName} PUBLIC OpenXR::headers)

endforeach()

