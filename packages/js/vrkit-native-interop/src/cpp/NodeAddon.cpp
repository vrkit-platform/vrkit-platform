
// https://github.com/electron/electron/blob/9-x-y/patches/node/enable_31_bit_smis_on_64bit_arch_and_ptr_compression.patch
// #define V8_COMPRESS_POINTERS
// #define V8_31BIT_SMIS_ON_64BIT_ARCH
// #define V8_REVERSE_JSARGS
// #define V8_COMPRESS_POINTERS_IN_ISOLATE_CAGE

#include <napi.h>

static Napi::String SayHello(const Napi::CallbackInfo& info) {
  // Napi::Env is the opaque data structure containing the environment in which
  // the request is being run. We will need this env when we want to create any
  // new objects inside of the node.js environment
  Napi::Env env = info.Env();

  // Create a C++ level variable
  std::string helloWorld = "Hello, world!";

  // Return a new javascript string that we copy-construct inside of the node.js
  // environment
  return Napi::String::New(env, helloWorld);
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "SayHello"),
              Napi::Function::New(env, SayHello));
  return exports;
}

NODE_API_MODULE(SayHello, Init)