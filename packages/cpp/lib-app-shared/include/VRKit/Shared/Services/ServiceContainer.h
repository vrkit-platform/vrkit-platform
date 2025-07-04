#pragma once

#include <VRKit/Shared/SharedAppLibPCH.h>

#include <condition_variable>
#include <expected>
#include <memory>
#include <type_traits>

// #include <boost/sml2>

#include <IRacingSDK/ErrorTypes.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/ProtoHelpers.h>
#include <VRKit/Shared/Utils/TypeIdHelpers.h>
#include <VRKit/Shared/Services/Service.h>


namespace VRKit::Shared::Services {
  using namespace VRKit::Shared::Utils;

  class ServiceContainer: public std::enable_shared_from_this<ServiceContainer> {
    
    static inline Logging::Logger Log{Logging::GetCategoryWithType<ServiceContainer>()};

  public:
    
    /**
     * @brief Get a specific service
     * 
     * @tparam ServiceType 
     * @param nameOrType 
     * @return std::shared_ptr<ServiceType> 
     */
    template<typename ServiceType, typename = std::enable_if_t<std::is_base_of_v<Service, ServiceType>>>
    std::shared_ptr<ServiceType> getService(const std::optional<std::string>& nameOrType = std::nullopt) {
      std::vector<std::string> bag{};
      if (nameOrType) {
        bag.push_back(nameOrType.value());
      }

      auto serviceTypeId = GetPrettyTypeId<ServiceType>();
      if (serviceTypeId) {
        bag.push_back(serviceTypeId.value().fullname);
      }

      for (auto& nameOrType : bag) {
        if (serviceMap_.contains(nameOrType)) {
          auto service = serviceMap_[nameOrType];
          if (!service) {
            Log->error("Key ({}) exists, but no valid pointer assigned");
            continue;
          }
          return std::static_pointer_cast<ServiceType>(service);
        }
      }

      return nullptr;
    }

    virtual ~ServiceContainer() = default;
  protected: 

    template<typename ServiceType, typename = std::enable_if_t<std::is_base_of_v<Service, ServiceType>>>
    void setService(const std::shared_ptr<ServiceType>& service) {
      Log->debug("Mapping name & type for service >> {}", service->name());
      auto serviceTypeId = Utils::GetPrettyTypeId<ServiceType>();
      if (!serviceTypeId) {
        Log->warn("Unable to map service to type ({})", service->name());          
      } else {
        auto serviceTypeName = serviceTypeId.value().fullname;
        Log->debug("Mapping {} -> {}", serviceTypeName, service->name());
        serviceMap_[serviceTypeName] = service;
      }

      Log->debug("Mapping {}", service->name());
      serviceMap_[service->name()] = service;
    };

  private:
    std::recursive_mutex serviceMutex_{};    
    std::map<std::string, std::shared_ptr<Service>> serviceMap_{};
  };
}// namespace VRKit::Shared::Services
