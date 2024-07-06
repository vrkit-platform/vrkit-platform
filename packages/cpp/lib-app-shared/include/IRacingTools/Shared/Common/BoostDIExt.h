#pragma once
#include <cassert>
#include <memory>
#include <type_traits>

#include <boost/di.hpp>

namespace IRacingTools::Shared::Common {
  namespace di = boost::di;  


  template <class TDependency, class TInjector,
            std::enable_if_t<std::is_same<typename TDependency::scope, di::scopes::singleton>::value, int> = 0>
  void CreateSingletonsEagerlyImpl(const di::aux::type<TDependency>&, const TInjector& injector) {
    injector.template create<std::shared_ptr<typename TDependency::expected>>();
  }

  template <class TDependency, class TInjector,
            std::enable_if_t<!std::is_same<typename TDependency::scope, di::scopes::singleton>::value, int> = 0>
  void CreateSingletonsEagerlyImpl(const di::aux::type<TDependency>&, const TInjector&) {}

  template <class... TDeps, class TInjector>
  void CreateSingletonsEagerly(const di::aux::type_list<TDeps...>&, const TInjector& injector) {
    [](...) {}((CreateSingletonsEagerlyImpl(di::aux::type<TDeps>{}, injector), 0)...);
  }

  template <class TInjector>
  void CreateSingletons(const TInjector& injector) {
    CreateSingletonsEagerly(typename TInjector::deps{}, injector);
  }
}