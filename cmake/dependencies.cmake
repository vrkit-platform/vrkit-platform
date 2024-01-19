
set(DEP_PACKAGES directxmath directxtk fmt OpenXR dxsdk-d3dx protobuf effects11 CLI11 GTest magic_enum nlohmann_json)
foreach(depPkgName ${DEP_PACKAGES})
  find_package(${depPkgName} CONFIG REQUIRED)
endforeach()

# Other deps
#target_link_libraries(${targetName} PRIVATE Microsoft::CppWinRT)
#target_link_libraries(${targetName} PRIVATE WIL::WIL)

set(DEP_PROTOBUF protobuf::libprotobuf)
set(DEP_JSON nlohmann_json::nlohmann_json)
set(DEP_MAGICENUM magic_enum::magic_enum)
set(DEP_DIRECTX
  d2d1.lib
  dwrite.lib
  windowscodecs.lib
  dxgi.lib
  d3d10_1.lib
  d3d11.lib
  Microsoft::D3DX9
  Microsoft::D3DX10
  Microsoft::D3DX11
  Microsoft::Effects11
  Microsoft::DirectXMath
  Microsoft::DirectXTK)

set(DEP_FMT fmt::fmt)
set(DEP_OPENXR OpenXR::headers)

set(ALL_RUNTIME_DEPS
  ${DEP_PROTOBUF}
  ${DEP_JSON}
  ${DEP_MAGICENUM}
  ${DEP_DIRECTX}
  ${DEP_FMT}
  ${DEP_OPENXR}
)

set(DEP_GTEST_MAIN GTest::gtest_main)
set(DEP_GTEST GTest::gtest)

function(TARGET_LINK_RUNTIME_LIBS TARGET)
  target_link_libraries(${TARGET} PUBLIC ${ALL_RUNTIME_DEPS})
endfunction()

function(TARGET_LINK_TEST_LIBS TARGET)
  target_link_libraries(${TARGET} PUBLIC ${ALL_RUNTIME_DEPS} ${DEP_GTEST_MAIN})
endfunction()