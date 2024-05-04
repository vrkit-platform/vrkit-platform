//
// Created by jglanz on 2/2/2024.
//

#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/LiveClient.h>

#include <utility>

namespace IRacingTools::SDK {

  std::shared_ptr<Client> ClientManager::get(const std::string_view &clientId) {
    std::lock_guard lock(clientMutex_);
    if (clientId == Client::LiveClientId)
      return LiveClient::GetPtr();

    if (clients_.contains(clientId))
      return clients_[clientId].lock();

    return nullptr;
  }

  Expected<bool> ClientManager::remove(const std::string_view &clientId) {
    std::lock_guard lock(clientMutex_);
    if (clientId == Client::LiveClientId) {
      return MakeUnexpected<GeneralError>("LiveClientId can not be deleted");
    }
    if (clients_.contains(clientId)) {
      if (clientId == activeClientId_) {
        setActive(Client::LiveClientId);
      }
      clients_.erase(clientId);
      return true;
    }

    return false;
  }

  Expected<bool> ClientManager::add(const std::string_view &clientId, std::weak_ptr<Client> client, bool active) {
    std::lock_guard lock(clientMutex_);
    if (clientId == Client::LiveClientId) {
      return MakeUnexpected<GeneralError>("LiveClientId can not be deleted");
    }

    if (clients_.contains(clientId)) {
      return MakeUnexpected<GeneralError>("clientId({}) is already registered", clientId);
    }

    clients_[clientId] = std::move(client);
    if (active) {
      setActive(clientId);
    }
    return true;
  }

  Expected<bool> ClientManager::setActive(const std::string_view &clientId) {
    std::lock_guard lock(clientMutex_);
    if (!clients_.contains(clientId)) {
      return MakeUnexpected<GeneralError>("clientId({}) is not registered", clientId);
    }

    activeClientId_ = clientId;
    return true;
  }

  std::shared_ptr<Client> ClientManager::getActive() {
    return get(activeClientId_);
  }
} // namespace SDK
