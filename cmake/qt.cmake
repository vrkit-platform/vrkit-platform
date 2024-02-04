
set(QTCoreModules Core)
set(QTCoreModuleTargets)
foreach(QTMod ${QTCoreModules})
  list(APPEND QTCoreModuleTargets "Qt6::${QTMod}")
endforeach()

set(QTUIModules Gui Widgets Quick QuickControls2 Svg Sql Qml)
set(QTUIModuleTargets)
foreach(QTMod ${QTUIModules})
  list(APPEND QTUIModuleTargets "Qt6::${QTMod}")
endforeach()

set(QTModules ${QTCoreModules} ${QTUIModules})


set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
find_package(Qt6 REQUIRED COMPONENTS ${QTModules})
qt_standard_project_setup()


include(${CMAKE_CURRENT_LIST_DIR}/external/qdep-inject.cmake NO_POLICY_SCOPE)

# QT Dependencies
set(DEP_QT_CORE
  ${QTCoreModuleTargets})
set(DEP_QT_UI
  ${DEP_QT_CORE}
  ${QTUIModuleTargets}
  ${DEP_QINJECT}
)
