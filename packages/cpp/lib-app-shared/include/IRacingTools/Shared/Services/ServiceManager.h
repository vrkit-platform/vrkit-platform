#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <condition_variable>
#include <expected>
#include <memory>
#include <type_traits>

#include <IRacingTools/SDK/ErrorTypes.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>


namespace IRacingTools::Shared::Services {

  template<typename... ServiceTypes>
  class ServiceManager : public ServiceContainer {
    static_assert((std::is_base_of_v<Service, ServiceTypes> && ...), "Only services can be passed.");

    static inline Logging::Logger Log{Logging::GetCategoryWithType<ServiceManager>()};

  public:
    using State = ServiceState;
    using ServiceManagerType = ServiceManager<ServiceTypes...>;
    using ServiceTypesTuple = std::tuple<ServiceTypes...>;
    static constexpr std::size_t ServiceCount = std::tuple_size_v<ServiceTypesTuple>;


    /**
     * @brief Initialize the service
     */
    std::optional<SDK::GeneralError>  init() {
      std::scoped_lock lock(stateMutex_);

      if (!ServiceStateTransitionCheck(state(), State::Initializing, true)) {
        Log->warn("init() can only be called when new state > {}, currently state is {}. Skipping init()",
                 E::enum_name(ServiceState::Created).data(), E::enum_name(state()).data());
        return std::nullopt;
      }

      setState(State::Initializing);
      Log->info("Creating services");
      createServices<0>();

      Log->info("Created services");
      for (auto &service: services_) {
        Log->info("Initializing service >> {}", service->name());
        auto res = service->init();

        if (!res) {
          auto err = res.error();
          Log->critical("Initialize service ({}) failed: {}", service->name(), err.what());
          throw err;
        }

        Log->info("Initialized service >> {}", service->name());
      }

      setState(State::Initialized);

      return std::nullopt;
    }

    /**
     * @brief Must set running == true in overridden implementation
     */
    std::optional<SDK::GeneralError>  start() {
      // TODO: Implement dependency management and Multithreaded start

      std::scoped_lock lock(stateMutex_);
      if (!ServiceStateTransitionCheck(state(), State::Starting, true)) {
        Log->warn("start() can only be called when new state > {}, currently state is {}. Skipping init()",
                 E::enum_name(ServiceState::Initialized).data(), E::enum_name(state()).data());
        return std::nullopt;
      }

      if (state() < ServiceState::Initialized) {
        init();

        assert(state() == ServiceState::Initialized);
      }

      setState(State::Starting);
      Log->info("Starting services");
      for (auto &service: services_) {
        Log->info("Starting service >> {}", service->name());
        auto res = service->start();

        if (!res) {
          auto err = res.error();
          Log->critical("Start service ({}) failed: {}", service->name(), err.what());
          throw err;
        }

        Log->info("Initialized service >> {}", service->name());
      }

      setState(State::Running);


      return std::nullopt;
    }

    /**
     * @brief Must set running == false in overridden implementation
     */
    std::optional<SDK::GeneralError> destroy() {
      std::scoped_lock lock(stateMutex_);
      if (!ServiceStateTransitionCheck(state(), State::Destroying, true)) {
        Log->warn("destroy() can only be called when new state > {}, currently state is {}. Skipping init()",
                 E::enum_name(ServiceState::Running).data(), E::enum_name(state()).data());
        return std::nullopt;
      }

      setState(State::Destroying);
      Log->info("Destroying services");
      for (auto &service: services_) {
        if (!service)
          continue;
        Log->info("Destroy service >> {}", service->name());
        auto res = service->destroy();

        if (res) {
          auto err = res.value();
          Log->critical("Destroy service ({}) failed: {}", service->name(), err.what());
          throw err;
        } else if (service->state() < State::Destroyed) {
          throw SDK::GeneralError(SDK::ErrorCode::General,
                                  std::format("Destroy did not return an error, but the service ({}) state is ({})",
                                              service->name(), E::enum_name(service->state()).data()));
        }

        Log->info("Destroyed service >> {}", service->name());
      }

      setState(State::Destroyed);

      return std::nullopt;
    }

    /**
     * @brief Set the current state
     * 
     * @param newState of service, must be >= previous
     * @return State - previous/old state
     */
    State setState(State newState) {
      bool changed;
      State oldState;
      {
        std::scoped_lock lock(stateMutex_);
        oldState = state_.exchange(newState);
        changed = oldState != newState;
        ServiceStateTransitionCheck(newState, oldState);

        if (changed) {
          std::scoped_lock changeLock(stateChangeMutex_);
          stateChangedCondition_.notify_all();
        }
      }
      

      return oldState;
    }

    /**
     * @brief Get current state
     * 
     * @return State 
     */
    State state() const {
      return state_.load();
    }

    /**
     * @brief Check if the service is running
     *
     * @return if service is currently running
     */
    bool isRunning() const {
      return state() == State::Running;
    }

    /**
     * @brief Wait for all services to complete cleanly
     * 
     * @param waitEvenIfNotRunning 
     * @return std::optional<SDK::GeneralError> 
     */
    std::optional<SDK::GeneralError> wait(bool waitEvenIfNotRunning = false) {
      std::scoped_lock lock(stateMutex_);
      std::unique_lock changeLock(stateChangeMutex_);
      if (state() < State::Starting && !waitEvenIfNotRunning) {
        Log->warn("Services are not yet Starting, ignoring wait");
        return std::nullopt;
      }

      Log->debug("Waiting on all services to complete before returning");
      auto checkIfDone = [this, waitEvenIfNotRunning] () -> bool {
        auto current = this->state();
        return current >= State::Destroyed || (current < State::Starting && !waitEvenIfNotRunning);
      };

      if (checkIfDone()) {
        Log->warn("Already passes blocking wait, skipping");
      } else {
        stateChangedCondition_.wait(changeLock, checkIfDone);
        Log->debug("Woke from wait");
      }

      return std::nullopt;
    }

    /**
     * @brief Simple constructor
     */
    ServiceManager() {
    }

    ~ServiceManager() {
      if (auto res = destroy()) {
        auto &err = res.value();
        Log->error("Unable to cleanly shutdown all services: {}", err.what());
      }
    }


  private:
    std::array<std::shared_ptr<Service>, ServiceCount> services_{};
    std::atomic<State> state_{State::Created};
    std::recursive_mutex stateMutex_{};
    std::mutex stateChangeMutex_{};
    std::condition_variable stateChangedCondition_{};

    template<::std::size_t I = 0>
    void createServices() {
      if constexpr (I < std::tuple_size_v<ServiceTypesTuple>) {
        using ServiceType = std::tuple_element_t<I, ServiceTypesTuple>;
        auto container = ServiceContainer::shared_from_this(); 
        auto service = std::make_shared<ServiceType>(container);
        std::get<I>(services_) = service;
        setService<ServiceType>(service);
        createServices<I + 1>();
      }
    };
  };
}// namespace IRacingTools::Shared::Services
