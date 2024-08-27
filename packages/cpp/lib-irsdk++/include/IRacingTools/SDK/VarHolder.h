#pragma once

#include <magic_enum.hpp>
#include <tchar.h>
#include <windows.h>

#include "ErrorTypes.h"
#include "Resources.h"
#include "Types.h"
#include <IRacingTools/SDK/Client.h>
#include <IRacingTools/SDK/Utils/LUT.h>

namespace IRacingTools::SDK {
    /**
     * @brief helper class to keep track of our variables index
     *
     * Create a global instance of this and it will take care of the details for you.
     */
    class VarHolder {
    public:
        VarHolder() = delete;
        explicit VarHolder(const std::string_view& name, ClientProvider* clientProvider = nullptr);
        explicit VarHolder(KnownVarName name, ClientProvider* clientProvider = nullptr);

        void setVarName(const std::string_view& name);

        /**
         * @brief Get type
         *
         * @return
         */
        [[maybe_unused]] VarDataType getType();

        /**
         * @brief Get number of samples
         *
         * @return
         */
        [[maybe_unused]] uint32_t getCount();

        std::string varName();
        std::string description();
        std::string unit();

        bool isValid();

        /**
         * @brief Get boolean value
         *
         * @param entry is the array offset, or 0 if not an array element
         * @return
         */
        bool getBool(int entry = 0);
        int getInt(int entry = 0);
        float getFloat(int entry = 0);
        double getDouble(int entry = 0);

    protected:
        bool reset();
        bool isAvailable();
        std::shared_ptr<Client> getClient();

        std::atomic_bool available_{false};
        std::string name_{};
        [[maybe_unused]] std::string unit_{};
        [[maybe_unused]] std::string description_{};
        uint32_t idx_{0};
        std::optional<ClientId> clientId_{};

        ClientProvider* clientProvider_;
    };
}
