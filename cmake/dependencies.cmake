
# VCPkg & QT Deps

set(DEP_PACKAGES
  Microsoft.GSL
  cppwinrt
  directxmath
  directxtk
#  imgui
  fmt
  spdlog
  OpenXR
#  reproc
#  reproc++
  cli
  protobuf
  effects11
  CLI11
  GTest
  yaml-cpp
  magic_enum
  nlohmann_json)
foreach(depPkgName ${DEP_PACKAGES})
  find_package(${depPkgName} CONFIG REQUIRED)
endforeach()



# QT
# include(${CMAKE_CURRENT_LIST_DIR}/qt.cmake NO_POLICY_SCOPE)

# Boost
find_package(Boost REQUIRED COMPONENTS system uuid)
set(DEP_BOOST_DEFAULT Boost::system Boost::uuid)
find_path(DEP_BOOST_DI_INCLUDES "boost/di.hpp")

# Other deps
#target_link_libraries(${targetName} PRIVATE Microsoft::CppWinRT)
#target_link_libraries(${targetName} PRIVATE WIL::WIL)
#find_library(DEP_BOOST_IPC_LIB Boost::interprocess REQUIRED)
#find_package(Boost REQUIRED COMPONENTS interprocess)

# TinyORM Dep
#include(${CMAKE_CURRENT_LIST_DIR}/external/tiny_orm.cmake NO_POLICY_SCOPE)

#set(DEP_WXWIDGETS wx::core wx::base)
set(DEP_CLI11 CLI11::CLI11)
set(DEP_YAML yaml-cpp::yaml-cpp)
set(DEP_PROTOBUF protobuf::libprotobuf)
set(DEP_JSON nlohmann_json::nlohmann_json)
set(DEP_MAGICENUM magic_enum::magic_enum)
set(DEP_GSL Microsoft.GSL::GSL)
set(DEP_LOG spdlog::spdlog)
#set(DEP_IMGUI imgui::imgui)
#set(DEP_WINRT Microsoft::CppWinRT)


set(DEP_DIRECTX
  #  d2d1.lib
  #  dwrite.lib
  windowscodecs.lib

  #  dxgi.lib
  #  d3d10_1.lib
  #  d3d11.lib
  System::Dcomp
  System::Gdi32
  System::Dwmapi
  System::Dwrite
  System::Dxgi
  System::Dxguid
  System::D2d1
  System::D3d11
  System::D3d12
  System::Shcore
  System::WindowsApp
  #  Microsoft::D3DX9
  #  Microsoft::D3DX10
  #  Microsoft::D3DX11
  Microsoft::Effects11
  Microsoft::DirectXMath
  #  directxtk.lib
  Microsoft::DirectXTK

)

set(DEP_FMT fmt::fmt)
set(DEP_LOG spdlog::spdlog ${DEP_FMT})
set(DEP_OPENXR OpenXR::headers)
#set(DEP_REPROC reproc reproc++)
set(DEP_CLI_CMD CLI11::CLI11)


set(ALL_APP_DEPS
  ${DEP_PROTOBUF}
  ${DEP_JSON}
  ${DEP_MAGICENUM}
  ${DEP_DIRECTX}
#  ${DEP_IMGUI}
  ${DEP_FMT}
  ${DEP_LOG}
  ${DEP_OPENXR}
  # ${DEP_QT_CORE}
  ${DEP_YAML}
  ${DEP_GSL}
  ${DEP_BOOST_DEFAULT}
#  ${DEP_REPROC}
  ${DEP_CLI_CMD}
)

set(ALL_SDK_DEPS
  ${DEP_MAGICENUM}
  ${DEP_GSL}
  ${DEP_FMT}
  ${DEP_YAML}
  ${DEP_LOG}
#  ${DEP_CLI_CMD}
)

set(DEP_GTEST_MAIN GTest::gtest_main)
set(DEP_GTEST GTest::gtest)

function(VRK_CONFIGURE_SDK_LIBS TARGET)
  target_link_libraries(${TARGET} PUBLIC ${ALL_SDK_DEPS})
  target_include_directories(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
endfunction()

function(VRK_CONFIGURE_APP_LIBS TARGET)
  target_link_libraries(${TARGET} PRIVATE ${ALL_APP_DEPS})
  target_include_directories(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
endfunction()

function(VRK_CONFIGURE_TEST_LIBS TARGET)
  target_link_libraries(${TARGET} PUBLIC ${ALL_APP_DEPS} ${DEP_GTEST_MAIN})
  target_include_directories(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
endfunction()
