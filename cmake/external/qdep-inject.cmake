
include(FetchContent)
FetchContent_Declare(QInjection
  GIT_REPOSITORY https://github.com/jglanz/fork-qdep-injection.git
  GIT_TAG        v1.0.0
  FIND_PACKAGE_ARGS NAMES QInjection
#  OVERRIDE_FIND_PACKAGE
)

FetchContent_MakeAvailable(QInjection)
#
## Here you can configure TinyORM CMake options
#set(MYSQL_PING OFF)
#set(TOM ON)
#set(TOM_EXAMPLE OFF)
#
set(DEP_QINJECT QInjectionStatic)
