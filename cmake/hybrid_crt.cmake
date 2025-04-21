# Hybrid CRT
# https://github.com/microsoft/WindowsAppSDK/blob/main/docs/Coding-Guidelines/HybridCRT.md

# Enable CMAKE_MSVC_RUNTIME_LIBRARY variable
# NOTE: Moved policy activation to root `cmake_policy(SET CMP0091 NEW)`
set(
	CMAKE_MSVC_RUNTIME_LIBRARY
	# Statically link the C++ runtime libraries, but partially override this below
	"MultiThreaded$<$<CONFIG:Debug>:Debug>"
)
add_link_options(
	"/DEFAULTLIB:ucrt$<$<CONFIG:Debug>:d>.lib" # include the dynamic UCRT
	"/NODEFAULTLIB:libucrt$<$<CONFIG:Debug>:d>.lib" # ignore the static UCRT
)

SET(msvcRT $<TARGET_PROPERTY:MSVC_RUNTIME_LIBRARY>)
SET(msvcRTMtdStatic $<STREQUAL:${msvcRT},MultiThreadedDebug>)
SET(msvcRTMtStatic $<STREQUAL:${msvcRT},MultiThreaded>)
SET(msvcRTMtdDll $<STREQUAL:${msvcRT},MultiThreadedDebugDLL>)
SET(msvcRTMtDll $<STREQUAL:${msvcRT},MultiThreadedDLL>)

SET(backportMSVCRuntime $<VERSION_LESS:${CMAKE_VERSION},3.15>)
