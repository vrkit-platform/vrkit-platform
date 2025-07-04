#pragma once
//
// // #include <boost/di.hpp>
//
// #include <VRKit/Shared/SharedAppLibPCH.h>
// #include <IRacingSDK/Utils/Singleton.h>
//
//
// namespace VRKit::Shared::Services {
//
//     class DefaultObjectFactory : public IRacingSDK::Utils::Singleton<DefaultObjectFactory> {
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
