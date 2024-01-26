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

#include <cstdio>
#include <cstring>
#include <cassert>

#include <gsl/util>

#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/DiskClient.h>

#include "YamlParser.h"

#pragma warning(disable:4996)

namespace IRacingTools::SDK {
bool IRDiskClient::openFile(const char *path)
{
	closeFile();

	ibtFile_ = std::fopen(path, "rb");
	if(!ibtFile_)
	    return false;

    auto fileDisposer = gsl::finally([&] {
        if (ibtFile_) {
            std::fclose(ibtFile_);
            ibtFile_ = nullptr;
        }
    });

    if (std::fread(&header_, 1, sizeof(header_), ibtFile_) != sizeof(header_)) {
        return false;

    }
			if(std::fread(&diskSubHeader_, 1, sizeof(diskSubHeader_), ibtFile_) != sizeof(diskSubHeader_)) {
			    return false;
			}
				sessionInfoString_ = new char[header_.sessionInfoLen];
				if(sessionInfoString_)
				{
					fseek(ibtFile_, header_.sessionInfoOffset, SEEK_SET);
					if(fread(sessionInfoString_, 1, header_.sessionInfoLen, ibtFile_) == static_cast<size_t>(header_.sessionInfoLen))
					{
						sessionInfoString_[header_.sessionInfoLen-1] = '\0';

						varHeaders_ = new IRVarHeader[header_.numVars];
						if(varHeaders_)
						{
							fseek(ibtFile_, header_.varHeaderOffset, SEEK_SET);
							const size_t len = header_.numVars * sizeof(IRVarHeader);
							if(fread(varHeaders_, 1, len, ibtFile_) == len)
							{
								varBuf_ = new char[header_.bufLen];
								if(varBuf_)
								{
									fseek(ibtFile_, header_.varBuf[0].bufOffset, SEEK_SET);

									return true;

									//delete [] varBuf_;
									//varBuf_ = NULL;
								}
							}

							delete [] varHeaders_;
							varHeaders_ = nullptr;
						}
					}

					delete [] sessionInfoString_;
					sessionInfoString_ = nullptr;
				}





	return false;
}

void IRDiskClient::closeFile()
{
	if(varBuf_)
		delete [] varBuf_;
	varBuf_ = nullptr;

	if(varHeaders_)
		delete [] varHeaders_;
	varHeaders_ = nullptr;

	if(sessionInfoString_)
		delete [] sessionInfoString_;
	sessionInfoString_ = nullptr;

	if(ibtFile_)
		fclose(ibtFile_);
	ibtFile_ = nullptr;
}

bool IRDiskClient::getNextData()
{
	if(ibtFile_)
		return fread(varBuf_, 1, header_.bufLen, ibtFile_) == static_cast<size_t>(header_.bufLen);

	return false;
}

// return how many variables this .ibt file has in the header
int IRDiskClient::getNumVars()
{
	if(ibtFile_)
		return header_.numVars;

	return -1;
}

int IRDiskClient::getVarIdx(const char *name)
{
	if(ibtFile_ && name)
	{
		for(int idx=0; idx<header_.numVars; idx++)
		{
			if(0 == strncmp(name, varHeaders_[idx].name, IRSDK_MAX_STRING))
			{
				return idx;
			}
		}
	}

	return -1;
}

IRVarType IRDiskClient::getVarType(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return (IRVarType)varHeaders_[idx].type;
		}

		//invalid variable index
		assert(false);
	}

	return IRVarType::type_char;
}

// get info on the var
const char* IRDiskClient::getVarName(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return varHeaders_[idx].name;
		}

		//invalid variable index
		assert(false);
	}

	return nullptr;
}

const char* IRDiskClient::getVarDesc(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return varHeaders_[idx].desc;
		}

		//invalid variable index
		assert(false);
	}

	return nullptr;
}

const char* IRDiskClient::getVarUnit(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return varHeaders_[idx].unit;
		}

		//invalid variable index
		assert(false);
	}

	return nullptr;
}

int IRDiskClient::getVarCount(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return varHeaders_[idx].count;
		}

		//invalid variable index
		assert(false);
	}

	return 0;
}

bool IRDiskClient::getVarBool(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_ + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case IRVarType::type_char:
				case IRVarType::type_bool:
					return (((const char*)data)[entry]) != 0;
					break;

				// 4 bytes
				case IRVarType::type_int:
				case IRVarType::type_bitmask:
					return (((const int*)data)[entry]) != 0;
					break;
					
				// test float/double for greater than 1.0 so that
				// we have a chance of this being usefull
				// technically there is no right conversion...
				case IRVarType::type_float:
					return (((const float*)data)[entry]) >= 1.0f;
					break;

				// 8 bytes
				case IRVarType::type_double:
					return (((const double*)data)[entry]) >= 1.0;
					break;
				}
			}
			else
			{
				// invalid offset
				assert(false);
			}
		}
		else
		{
			//invalid variable index
			assert(false);
		}
	}

	return false;
}

int IRDiskClient::getVarInt(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_ + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case IRVarType::type_char:
				case IRVarType::type_bool:
					return (int)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case IRVarType::type_int:
				case IRVarType::type_bitmask:
					return (int)(((const int*)data)[entry]);
					break;
					
				case IRVarType::type_float:
					return static_cast<int>(((const float *) data)[entry]);
					break;

				// 8 bytes
				case IRVarType::type_double:
					return static_cast<int>(((const double *) data)[entry]);
					break;
				}
			}
			else
			{
				// invalid offset
				assert(false);
			}
		}
		else
		{
			//invalid variable index
			assert(false);
		}
	}

	return 0;
}

float IRDiskClient::getVarFloat(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_ + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case IRVarType::type_char:
				case IRVarType::type_bool:
					return (float)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case IRVarType::type_int:
				case IRVarType::type_bitmask:
					return static_cast<float>(((const int *) data)[entry]);
					break;
					
				case IRVarType::type_float:
					return (float)(((const float*)data)[entry]);
					break;

				// 8 bytes
				case IRVarType::type_double:
					return static_cast<float>(((const double *) data)[entry]);
					break;
				}
			}
			else
			{
				// invalid offset
				assert(false);
			}
		}
		else
		{
			//invalid variable index
			assert(false);
		}
	}

	return 0.0f;
}

double IRDiskClient::getVarDouble(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_ + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case IRVarType::type_char:
				case IRVarType::type_bool:
					return (double)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case IRVarType::type_int:
				case IRVarType::type_bitmask:
					return (double)(((const int*)data)[entry]);
					break;
					
				case IRVarType::type_float:
					return (double)(((const float*)data)[entry]);
					break;

				// 8 bytes
				case IRVarType::type_double:
					return (double)(((const double*)data)[entry]);
					break;
				}
			}
			else
			{
				// invalid offset
				assert(false);
			}
		}
		else
		{
			//invalid variable index
			assert(false);
		}
	}

	return 0.0;
}

//path is in the form of "DriverInfo:Drivers:CarIdx:{%d}UserName:"
int IRDiskClient::getSessionStrVal(const char *path, char *val, int valLen)
{
	if(ibtFile_ && path && val && valLen > 0)
	{
		const char *tVal = nullptr;
		int tValLen = 0;
		if(parseYaml(sessionInfoString_, path, &tVal, &tValLen))
		{
			// dont overflow out buffer
			int len = tValLen;
			if(len > valLen)
				len = valLen;

			// copy what we can, even if buffer too small
			memcpy(val, tVal, len);
			val[len] = '\0'; // origional string has no null termination...

			// if buffer was big enough, return success
			if(valLen >= tValLen)
				return 1;
			else // return size of buffer needed
				return -tValLen;
		}
	}

	return 0;
}

}