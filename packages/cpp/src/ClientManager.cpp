//
// Created by jglanz on 2/2/2024.
//

#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/LiveClient.h>

namespace IRacingTools::SDK {

Client *ClientManager::get(const std::string_view &clientId) {
    if (clientId == LiveClientId)
        return &LiveClient::GetInstance();

    if (clients_.contains(clientId))
        return clients_[clientId];

    return nullptr;
}

Expected<bool> ClientManager::del(const std::string_view &clientId) {
    if (clientId == LiveClientId) {
        return MakeUnexpected<GeneralError>("LiveClientId can not be deleted");
    }
    if (clients_.contains(clientId)) {
        clients_.erase(clientId);
        return true;
    }

    return false;
}
Expected<void> ClientManager::set(const std::string_view &clientId, Client *client) {
    if (clientId == LiveClientId) {
        return MakeUnexpected<GeneralError>("LiveClientId can not be deleted");
    }

    if (clients_.contains(clientId)) {
        return MakeUnexpected<GeneralError>("clientId({}) is already registered", clientId);
    }

    clients_[clientId] = client;
}
} // namespace SDK
