
#include(FetchContent)
#FetchContent_Declare(TinyOrm
#  GIT_REPOSITORY https://github.com/silverqx/TinyORM.git
#  GIT_TAG        origin/main
#
#  OVERRIDE_FIND_PACKAGE
#)
#
## Here you can configure TinyORM CMake options
#set(MYSQL_PING OFF)
#set(TOM ON)
#set(TOM_EXAMPLE OFF)
#
#set(DEP_TINYORM TinyOrm::TinyOrm)
