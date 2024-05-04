//
// Created by jglanz on 2/2/2024.
//

#pragma once

#include <map>
#include <mutex>

#include "Utils/Singleton.h"
#include "Client.h"

namespace IRacingTools::SDK {
  using namespace Utils;

  class ClientManager : public Singleton<ClientManager> {
  public:


    ClientManager() = delete;

    ClientManager(const ClientManager &other) = delete;

    ClientManager(ClientManager &&other) noexcept = delete;

    ClientManager &operator=(const ClientManager &other) = delete;

    ClientManager &operator=(ClientManager &&other) noexcept = delete;

    Expected<bool> remove(const std::string_view &clientId);

    Expected<bool> add(const std::string_view &clientId, std::weak_ptr<Client> client, bool active = true);

    Expected<bool> setActive(const std::string_view &clientId);

    std::shared_ptr<Client> get(const std::string_view &clientId);

    std::shared_ptr<Client> getActive();


  private:
    friend Singleton;

    explicit ClientManager(token) {
    };

    std::map<ClientId, std::weak_ptr<Client>> clients_{};

    ClientId activeClientId_{Client::LiveClientId};

    std::recursive_mutex clientMutex_{};
  };

} // namespace IRacingTools::SDK
