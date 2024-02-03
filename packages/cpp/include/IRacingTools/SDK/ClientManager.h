//
// Created by jglanz on 2/2/2024.
//

#pragma once

#include <map>

#include "Utils/Singleton.h"
#include "Client.h"

namespace IRacingTools::SDK {
using namespace Utils;



class ClientManager : public Singleton<ClientManager> {
public:
    static constexpr std::string_view LiveClientId = "";

    ClientManager() = delete;
    ClientManager(const ClientManager &other) = delete;
    ClientManager(ClientManager &&other) noexcept = delete;
    ClientManager &operator=(const ClientManager &other) = delete;
    ClientManager &operator=(ClientManager &&other) noexcept = delete;

    Expected<bool> del(const std::string_view& clientId);
    Expected<void> set(const std::string_view& clientId, Client * client);
    Client * get(const std::string_view& clientId = LiveClientId);

private:
    friend Singleton;
    explicit ClientManager(token) {};

    std::map<std::string_view , Client*> clients_{};
};

} // namespace IRacingTools::SDK
