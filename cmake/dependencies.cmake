
# VCPkg & QT Deps

SET(DEP_PACKAGES
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
  protobuf
  effects11
  CLI11
  GTest
  yaml-cpp
  magic_enum
  nlohmann_json
)

FOREACH(depPkgName ${DEP_PACKAGES})
  FIND_PACKAGE(${depPkgName} CONFIG REQUIRED)
ENDFOREACH()

# QT
# include(${CMAKE_CURRENT_LIST_DIR}/qt.cmake NO_POLICY_SCOPE)

# Boost
#find_package(Boost REQUIRED COMPONENTS system uuid)
#set(DEP_BOOST_DEFAULT Boost::system Boost::uuid)
FIND_PACKAGE(Boost REQUIRED COMPONENTS system)
SET(DEP_BOOST_DEFAULT Boost::system)
#find_path(DEP_BOOST_DI_INCLUDES "boost/di.hpp")

# Other deps
#target_link_libraries(${targetName} PRIVATE Microsoft::CppWinRT)
#target_link_libraries(${targetName} PRIVATE WIL::WIL)
#find_library(DEP_BOOST_IPC_LIB Boost::interprocess REQUIRED)
#find_package(Boost REQUIRED COMPONENTS interprocess)

# TinyORM Dep
#include(${CMAKE_CURRENT_LIST_DIR}/external/tiny_orm.cmake NO_POLICY_SCOPE)

#set(DEP_WXWIDGETS wx::core wx::base)
SET(DEP_CLI11 CLI11::CLI11)
SET(DEP_YAML yaml-cpp::yaml-cpp)
SET(DEP_PROTOBUF protobuf::libprotobuf)
SET(DEP_JSON nlohmann_json::nlohmann_json)
SET(DEP_MAGICENUM magic_enum::magic_enum)
SET(DEP_GSL Microsoft.GSL::GSL)
SET(DEP_LOG spdlog::spdlog)
#set(DEP_IMGUI imgui::imgui)
#set(DEP_WINRT Microsoft::CppWinRT)

SET(DEP_DIRECTX
  #  d2d1.lib
  #  dwrite.lib
  System::windowscodecs

  #  dxgi.lib
  #  d3d10_1.lib
  #  d3d11.lib
  System::advapi32
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

SET(DEP_FMT fmt::fmt)
SET(DEP_LOG spdlog::spdlog ${DEP_FMT})
SET(DEP_OPENXR OpenXR::headers)
#set(DEP_REPROC reproc reproc++)
SET(DEP_CLI_CMD CLI11::CLI11)

SET(ALL_APP_DEPS
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

SET(ALL_SDK_DEPS
  ${DEP_MAGICENUM}
  ${DEP_GSL}
  ${DEP_FMT}
  ${DEP_YAML}
  ${DEP_LOG}
)

SET(DEP_GTEST_MAIN GTest::gtest_main GTest::gmock)
SET(DEP_GTEST GTest::gtest GTest::gmock)

IF(VRKIT_IRSDKCPP_LOCAL AND EXISTS "${irsdkcppPath}")
  MESSAGE(NOTICE "IRSDKCPP FOUND LOCALLY @ ${irsdkcppPath}")
  SET(irsdkcppPkgAbsolutePath "${irsdkcppPath}/${irsdkcppPkgRelativePath}")
#  SET(irsdkcppLinkPkgAbsolutePath "${irsdkcppLinkPath}/${irsdkcppPkgRelativePath}")

  IF(NOT EXISTS ${irsdkcppLinkPath})
    MESSAGE(NOTICE "IRSDKCPP LINKING ${irsdkcppPkgAbsolutePath} -> ${irsdkcppLinkPath}")
    FILE(CREATE_LINK ${irsdkcppPkgAbsolutePath} ${irsdkcppLinkPath} SYMBOLIC)
  ENDIF()

  # IN ORDER TO DIRECTLY INTEGRATE IRSDKCPP,
  # WE NEED TO POPULATE THE ENVIRONMENT WITH OUR SPECIFIC CONFIGURATION
  SET(IRSDKCPP_BUILD_STATIC ON)
  SET(IRSDKCPP_BUILD_SHARED OFF)
  SET(IRSDKCPP_INSTALL_READY OFF)
  SET(IRSDKCPP_BUILD_DOCS OFF)
  SET(IRSDKCPP_BUILD_TESTS OFF)
  SET(IRSDKCPP_LIB_TYPE STATIC)
  SET(LIB_TYPE static)

  SET(sdkNamePrefix irsdkcpp)
  SET(sdkTarget irsdkcpp_static)

  SET(buildShared $<BOOL:${IRSDKCPP_BUILD_SHARED}>)
  SET(buildWindowsDLL $<AND:$<BOOL:${CMAKE_HOST_WIN32}>,${buildShared}>)
  SET(notMSVC $<NOT:$<CXX_COMPILER_ID:MSVC>>)
  SET(isMSVCSharedRT OFF)

  MESSAGE(NOTICE "IRSDKCPP LINKED TO ${irsdkcppLinkPath}")
  ADD_SUBDIRECTORY(${irsdkcppLinkPath})
  TARGET_INCLUDE_DIRECTORIES(irsdkcpp_static PUBLIC "${irsdkcppLinkPath}/include")

ELSE()
  MESSAGE(NOTICE "IRSDKCPP ROOT ${irsdkcppPath} NOT FOUND")
  FIND_PACKAGE(irsdkcpp CONFIG REQUIRED)
ENDIF()

FUNCTION(VRK_CONFIGURE_SDK_LIBS TARGET)
  TARGET_LINK_LIBRARIES(${TARGET} PUBLIC ${ALL_SDK_DEPS})
  #  target_include_directories(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
ENDFUNCTION()

FUNCTION(VRK_CONFIGURE_APP_LIBS TARGET)
  TARGET_LINK_LIBRARIES(${TARGET} PRIVATE ${ALL_APP_DEPS})
  TARGET_INCLUDE_DIRECTORIES(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
ENDFUNCTION()

FUNCTION(VRK_CONFIGURE_TEST_LIBS TARGET)
  TARGET_LINK_LIBRARIES(${TARGET} PRIVATE ${ALL_APP_DEPS} ${DEP_GTEST})
  #  target_include_directories(${TARGET} PUBLIC ${DEP_BOOST_DI_INCLUDES})
ENDFUNCTION()
