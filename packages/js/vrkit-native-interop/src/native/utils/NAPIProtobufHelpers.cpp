#pragma once


#include "NAPIProtobufHelpers.h"

#include <google/protobuf/json/json.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>


namespace IRacingTools::App::Node::Utils {
    namespace {
        auto L = Shared::Logging::GetCategoryWithName(__FILE__);
    }

    Napi::String MessageToJsonString(Napi::Env env, const google::protobuf::Message& message) {
        return MessageToJsonString(env, &message);
    }


    Napi::String MessageToJsonString(Napi::Env env, const google::protobuf::Message* message) {
        std::string json;
        if (auto jsonRes = google::protobuf::json::MessageToJsonString(*message, &json); !jsonRes.ok()) {
            auto errMsg = std::format("Unable to encode payload, {}", jsonRes.message().data());
            L->error(errMsg);

            throw Napi::TypeError::New(env, errMsg);
        }

        return Napi::String::New(env, json);
    }

    Napi::Uint8Array MessageToUint8Array(Napi::Env env, const google::protobuf::Message& message) {
        return MessageToUint8Array(env, &message);
    }

    Napi::Uint8Array MessageToUint8Array(Napi::Env env, const google::protobuf::Message* message) {
        if (message) {
            auto dataLen = message->ByteSizeLong();
            auto dataBuf = Napi::Uint8Array::New(env, dataLen);
            if (message->SerializeToArray(dataBuf.Data(), dataLen)) return dataBuf;
        }

        throw Napi::TypeError::New(env, "Unable to serialize message to array");
    }
}
