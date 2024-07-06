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

#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <cstring>
#include <string>
namespace IRacingTools::SDK::Utils {
enum class YamlState { space, key, keysep, value, newline };

// super simple YAML parser
bool ParseYaml(const char *data, const std::string_view &path, const char **val, int *len) {
    if (data && !path.empty() && val && len) {
        // make sure we set this to something
        *val = nullptr;
        *len = 0;

        int depth = 0;
        auto state = YamlState::space;

        const char *keystr = nullptr;
        int keyLen = 0;

        const char *valuestr = nullptr;
        int valueLen = 0;

        const char *pathPtr = path.data();
        int pathdepth = 0;

        while (*data) {
            switch (*data) {
                case ' ':
                    if (state == YamlState::newline)
                        state = YamlState::space;
                    if (state == YamlState::space)
                        depth++;
                    else if (state == YamlState::key)
                        keyLen++;
                    else if (state == YamlState::value)
                        valueLen++;
                    break;
                case '-':
                    if (state == YamlState::newline)
                        state = YamlState::space;
                    if (state == YamlState::space)
                        depth++;
                    else if (state == YamlState::key)
                        keyLen++;
                    else if (state == YamlState::value)
                        valueLen++;
                    else // Always YamlState::keysep
                    {
                        state = YamlState::value;
                        valuestr = data;
                        valueLen = 1;
                    }
                    break;
                case ':':
                    if (state == YamlState::key) {
                        state = YamlState::keysep;
                        keyLen++;
                    } else if (state == YamlState::keysep) {
                        state = YamlState::value;
                        valuestr = data;
                    } else if (state == YamlState::value)
                        valueLen++;
                    break;
                case '\n':
                case '\r':
                    if (state != YamlState::newline) {
                        if (depth < pathdepth) {
                            return false;
                        } else if (keyLen && 0 == strncmp(keystr, pathPtr, keyLen)) {
                            bool found = true;
                            //do we need to test the value?
                            if (*(pathPtr + keyLen) == '{') {
                                //search for closing brace
                                int pathValueLen = keyLen + 1;
                                while (*(pathPtr + pathValueLen) && *(pathPtr + pathValueLen) != '}')
                                    pathValueLen++;

                                if (valueLen == pathValueLen - (keyLen + 1)
                                    && 0 == strncmp(valuestr, (pathPtr + keyLen + 1), valueLen))
                                    pathPtr += valueLen + 2;
                                else
                                    found = false;
                            }

                            if (found) {
                                pathPtr += keyLen;
                                pathdepth = depth;

                                if (*pathPtr == '\0') {
                                    *val = valuestr;
                                    *len = valueLen;
                                    return true;
                                }
                            }
                        }

                        depth = 0;
                        keyLen = 0;
                        valueLen = 0;
                    }
                    state = YamlState::newline;
                    break;
                default:
                    if (state == YamlState::space || state == YamlState::newline) {
                        state = YamlState::key;
                        keystr = data;
                        keyLen = 0; //redundant?
                    } else if (state == YamlState::keysep) {
                        state = YamlState::value;
                        valuestr = data;
                        valueLen = 0; //redundant?
                    }
                    if (state == YamlState::key)
                        keyLen++;
                    if (state == YamlState::value)
                        valueLen++;
                    break;
            }

            // important, increment our pointer
            data++;
        }
    }
    return false;
}
} // namespace IRacingTools::SDK::Utils
