

# SDK Source & headers
file(GLOB_RECURSE appSources *.cpp)
file(GLOB_RECURSE appHeaders *.h)
#file(GLOB_RECURSE sdkHeaders ${sdkIncludeDir}/*.h)

#include_directories(
#  "${CMAKE_CURRENT_BINARY_DIR}"
#  "${CMAKE_CURRENT_SOURCE_DIR}/include"
#)

# Find dependency packages
#cppwinrt wil
set(depPkgNames directxmath directxtk fmt OpenXR dxsdk-d3dx protobuf effects11 CLI11 )
foreach(depPkgName ${depPkgNames})
  find_package(${depPkgName} CONFIG REQUIRED)
endforeach()


# App
set(targetName ${PROJECT_NAME}-overlay-app)
add_executable(${targetName} WIN32 ${appSources} ${appHeaders} ${sdkInternalHeaders})

#add_custom_command(
#  TARGET ${targetName}
#  PRE_BUILD
#  COMMAND fxc
#  ARGS /T fx_5_0 /Fo ${CMAKE_CURRENT_BINARY_DIR}/OverlayApp.fxo ${CMAKE_CURRENT_LIST_DIR}/OverlayApp.fx
#  COMMAND echo
#  ARGS IDR_PIXEL_SHADER RCDATA OverlayApp.fxo > ${CMAKE_CURRENT_BINARY_DIR}/OverlayApp.resinclude
#)



#target_sources(${targetName} PRIVATE )
target_include_directories(${targetName} PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

target_link_libraries(${targetName} PRIVATE d2d1.lib dwrite.lib windowscodecs.lib dxgi.lib d3d10_1.lib d3d11.lib)
target_link_libraries(${targetName} PRIVATE ${sdkTargetStatic} ${sharedAppLibTargetStatic} ${modelsTargetStatic})
#target_link_libraries(${targetName} PRIVATE ${sdkTarget} ${sharedAppLibTarget} ${modelsTarget})
#target_link_libraries(${targetName} PRIVATE Microsoft::CppWinRT)
#target_link_libraries(${targetName} PRIVATE WIL::WIL)
target_link_libraries(${targetName} PRIVATE Microsoft::D3DX9 Microsoft::D3DX10 Microsoft::D3DX11 Microsoft::Effects11)
target_link_libraries(${targetName} PRIVATE Microsoft::DirectXMath)
target_link_libraries(${targetName} PRIVATE magic_enum::magic_enum )
target_link_libraries(${targetName} PRIVATE Microsoft::DirectXTK)
target_link_libraries(${targetName} PRIVATE fmt::fmt)
target_link_libraries(${targetName} PRIVATE magic_enum::magic_enum)
target_link_libraries(${targetName} PRIVATE OpenXR::headers)

target_link_libraries(${targetName} PRIVATE CLI11::CLI11)




