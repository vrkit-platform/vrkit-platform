#pragma once
//
// // #include <boost/di.hpp>
//
// #include <IRacingTools/Shared/SharedAppLibPCH.h>
// #include <IRacingTools/SDK/Utils/Singleton.h>
//
//
// namespace IRacingTools::Shared::Services {
//
//     class DefaultObjectFactory : public SDK::Utils::Singleton<DefaultObjectFactory> {
//
//         public:
//         // static constexpr std::initializer_list Bindings = {
//         //     di::bind<int>.to<1>
//         // };
//
//         DefaultObjectFactory() : injector_(di::make_injector(Bindings...)) = default;
//
//
//     private:
//         explicit DefaultObjectFactory(token);
//         friend Singleton;
//
//         std::shared_ptr<di::injector<Bindings...>> injector_;
//     };
//
//
//
//
// }
