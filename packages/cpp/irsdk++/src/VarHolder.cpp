/*
Copyright (c) 2013, iRacing.com Motorsport Simulations, LLC.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of iRacing.com Motorsport Simulations nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


#include <magic_enum.hpp>


#include <IRacingTools/SDK/ClientManager.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <IRacingTools/SDK/VarHolder.h>

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
  using namespace Utils;
  //----------------------------------

  VarHolder::VarHolder(const std::string_view &name, ClientProvider *clientProvider) : clientProvider_(clientProvider) {
    setVarName(name);
  }

  void VarHolder::setVarName(const std::string_view &name) {
    reset();
    name_ = name;

    isAvailable();
  }

  bool VarHolder::reset() {
    available_ = false;
    unit_ = "";
    description_ = "";

    return true;
  }

  bool VarHolder::isAvailable() {
    auto client = getClient();
    if (!client || !client->isAvailable()) {
      return false;
    }

    if (!available_ || connectionId_ != client->getConnectionId()) {
      connectionId_ = client->getConnectionId();

      auto idx = client->getVarIdx(name_);
      if (!idx || idx.value() == 0xffffffff) {
        available_ = false;
        return false;
      }
      idx_ = idx.value();

      unit_ = client->getVarUnit(idx_).value();
      description_ = client->getVarDesc(idx_).value();
      available_ = true;
    }

    return available_;
  }

  VarDataType /*VarDataType*/ VarHolder::getType() {
    if (isAvailable()) {
      return getClient()->getVarType(idx_).value();
    }
    return VarDataType::Char;
  }

  uint32_t VarHolder::getCount() {
    if (isAvailable())
      return getClient()->getVarCount(idx_).value();
    return 0;
  }

  bool VarHolder::isValid() {
    return isAvailable() && (idx_ > -1);
  }


  bool VarHolder::getBool(int entry) {
    if (isAvailable())
      return getClient()->getVarBool(idx_, entry).value();
    return false;
  }

  int VarHolder::getInt(int entry) {
    if (isAvailable())
      return getClient()->getVarInt(idx_, entry).value();
    return 0;
  }

  float VarHolder::getFloat(int entry) {
    if (isAvailable())
      return getClient()->getVarFloat(idx_, entry).value();
    return 0.0f;
  }

  double VarHolder::getDouble(int entry) {
    if (isAvailable())
      return getClient()->getVarDouble(idx_, entry).value();
    return 0.0;
  }

  std::shared_ptr<Client> VarHolder::getClient() {
    return !clientProvider_ ? ClientManager::Get().getActive() : clientProvider_->getClient();


  }
  //void VarHolder::setClientIdProvider(const ClientIdProvider &clientIdProvider) {
  //    clientIdProvider_ = clientIdProvider;
  //}

}
