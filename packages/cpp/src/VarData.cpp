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

#include <cassert>
#include <cstring>

#include <magic_enum.hpp>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <IRacingTools/SDK/VarData.h>

#pragma warning(disable : 4996)
namespace IRacingTools::SDK {
using namespace Utils;
//----------------------------------

VarHolder::VarHolder() : idx_(-1), statusId_(-1) {

}

VarHolder::VarHolder(const std::string_view& name) {
    setVarName(name);
}

void VarHolder::setVarName(const std::string_view& name) {
    name_ = name;
}

bool VarHolder::checkIdx() {
    if (!LiveClient::GetInstance().isConnected()) {
        return false;

    }

    if (statusId_ != LiveClient::GetInstance().getStatusId()) {
        statusId_ = LiveClient::GetInstance().getStatusId();
        idx_ = LiveClient::GetInstance().getVarIdx(name_);
    }

    return true;
}

VarDataType /*VarDataType*/ VarHolder::getType() {
    if (checkIdx())
        return LiveClient::GetInstance().getVarType(idx_);
    return VarDataType::Char;
}

int VarHolder::getCount() {
    if (checkIdx())
        return LiveClient::GetInstance().getVarCount(idx_);
    return 0;
}

bool VarHolder::isValid() {
    checkIdx();
    return (idx_ > -1);
}


bool VarHolder::getBool(int entry) {
    if (checkIdx())
        return LiveClient::GetInstance().getVarBool(idx_, entry);
    return false;
}

int VarHolder::getInt(int entry) {
    if (checkIdx())
        return LiveClient::GetInstance().getVarInt(idx_, entry);
    return 0;
}

float VarHolder::getFloat(int entry) {
    if (checkIdx())
        return LiveClient::GetInstance().getVarFloat(idx_, entry);
    return 0.0f;
}

double VarHolder::getDouble(int entry) {
    if (checkIdx())
        return LiveClient::GetInstance().getVarDouble(idx_, entry);
    return 0.0;
}
}