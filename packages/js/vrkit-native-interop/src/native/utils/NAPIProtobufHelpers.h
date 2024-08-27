#pragma once


#include <napi.h>
#include <google/protobuf/message.h>


namespace IRacingTools::App::Node::Utils {
    Napi::String MessageToJsonString(Napi::Env env, const google::protobuf::Message& message);
    Napi::String MessageToJsonString(Napi::Env env, const google::protobuf::Message* message);
    Napi::Uint8Array MessageToUint8Array(Napi::Env env, const google::protobuf::Message & message);
    Napi::Uint8Array MessageToUint8Array(Napi::Env env, const google::protobuf::Message * message);
}
