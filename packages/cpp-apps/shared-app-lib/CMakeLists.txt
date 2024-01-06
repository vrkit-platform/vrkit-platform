
# SDK Source & headers
file(GLOB_RECURSE sharedAppLibSources *.cpp)
file(GLOB_RECURSE sharedAppLibHeaders *.h EXCLUDE include)
file(GLOB_RECURSE sharedAppLibHeadersPublic include/*.h)

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

foreach(targetName ${sharedAppLibTarget} ${sharedAppLibTargetStatic})
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum )
  target_link_libraries(${targetName} PUBLIC Microsoft::D3DX9 Microsoft::D3DX10 Microsoft::D3DX11 Microsoft::Effects11)
  target_link_libraries(${targetName} PUBLIC Microsoft::DirectXMath)
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum )
  target_link_libraries(${targetName} PUBLIC Microsoft::DirectXTK)
  target_link_libraries(${targetName} PUBLIC fmt::fmt)
  target_link_libraries(${targetName} PUBLIC magic_enum::magic_enum)
  target_link_libraries(${targetName} PUBLIC OpenXR::headers)

endforeach()

