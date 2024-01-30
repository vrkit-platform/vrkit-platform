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

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <cassert>
#include <cstdio>
#include <cstring>

#include <gsl/util>

#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/Types.h>

#include <IRacingTools/SDK/Utils/YamlParser.h>


#pragma warning(disable:4996)

namespace IRacingTools::SDK {
using namespace IRacingTools::SDK::Utils;
bool DiskClient::openFile(const fs::path& path)
{
	closeFile();

	ibtFile_ = std::fopen(ToUtf8(path).c_str(), "rb");
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

                sessionInfoBuf_.reset();// = new char[header_.sessionInfo.len];
    assert(sessionInfoBuf_->resize(header_.sessionInfo.len));

                auto data = sessionInfoBuf_->data();
					std::fseek(ibtFile_, header_.sessionInfo.offset, SEEK_SET);
					assert(std::fread(data, 1, header_.sessionInfo.len, ibtFile_) == static_cast<size_t>(header_.sessionInfo.len));

						data[header_.sessionInfo.len-1] = '\0';

						varHeaders_.resize(header_.numVars);

							std::fseek(ibtFile_, header_.varHeaderOffset, SEEK_SET);
							const size_t len = header_.numVars * sizeof(VarDataHeader);
							assert(std::fread(varHeaders_.data(), 1, len, ibtFile_) == len);
								varBuf_.resize(header_.bufLen);
									std::fseek(ibtFile_, header_.varBuf[0].bufOffset, SEEK_SET);

									return true;

									//delete [] varBuf_;
									//varBuf_ = NULL;



							// delete [] varHeaders_;
							// varHeaders_ = nullptr;
							//


					// delete [] sessionInfoString_;
					// sessionInfoString_ = nullptr;






	return false;
}

void DiskClient::closeFile()
{
	if(ibtFile_)
		fclose(ibtFile_);
	ibtFile_ = nullptr;
}

bool DiskClient::getNextData()
{
	if(ibtFile_)
		return std::fread(varBuf_.data(), 1, header_.bufLen, ibtFile_) == static_cast<size_t>(header_.bufLen);

	return false;
}

// return how many variables this .ibt file has in the header
int DiskClient::getNumVars()
{
	if(ibtFile_)
		return header_.numVars;

	return -1;
}

int DiskClient::getVarIdx(const char *name)
{
	if(ibtFile_ && name)
	{
		for(int idx=0; idx<header_.numVars; idx++)
		{
			if(0 == strncmp(name, varHeaders_[idx].name, Resources::MaxStringLength))
			{
				return idx;
			}
		}
	}

	return -1;
}

VarDataType DiskClient::getVarType(int idx)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			return (VarDataType)varHeaders_[idx].type;
		}

		//invalid variable index
		assert(false);
	}

	return VarDataType::Char;
}

// get info on the var
const char* DiskClient::getVarName(int idx)
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

const char* DiskClient::getVarDesc(int idx)
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

const char* DiskClient::getVarUnit(int idx)
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

int DiskClient::getVarCount(int idx)
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

bool DiskClient::getVarBool(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_.data() + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case VarDataType::Char:
				case VarDataType::Bool:
					return (((const char*)data)[entry]) != 0;
					break;

				// 4 bytes
				case VarDataType::Int32:
				case VarDataType::Bitmask:
					return (((const int*)data)[entry]) != 0;
					break;
					
				// test float/double for greater than 1.0 so that
				// we have a chance of this being usefull
				// technically there is no right conversion...
				case VarDataType::Float:
					return (((const float*)data)[entry]) >= 1.0f;
					break;

				// 8 bytes
				case VarDataType::Double:
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

int DiskClient::getVarInt(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_.data() + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case VarDataType::Char:
				case VarDataType::Bool:
					return (int)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case VarDataType::Int32:
				case VarDataType::Bitmask:
					return (int)(((const int*)data)[entry]);
					break;
					
				case VarDataType::Float:
					return static_cast<int>(((const float *) data)[entry]);
					break;

				// 8 bytes
				case VarDataType::Double:
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

float DiskClient::getVarFloat(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_.data() + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case VarDataType::Char:
				case VarDataType::Bool:
					return (float)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case VarDataType::Int32:
				case VarDataType::Bitmask:
					return static_cast<float>(((const int *) data)[entry]);
					break;
					
				case VarDataType::Float:
					return (float)(((const float*)data)[entry]);
					break;

				// 8 bytes
				case VarDataType::Double:
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

double DiskClient::getVarDouble(int idx, int entry)
{
	if(ibtFile_)
	{
		if(idx >= 0 && idx < header_.numVars)
		{
			if(entry >= 0 && entry < varHeaders_[idx].count)
			{
				const char * data = varBuf_.data() + varHeaders_[idx].offset;
				switch(varHeaders_[idx].type)
				{
				// 1 byte
				case VarDataType::Char:
				case VarDataType::Bool:
					return (double)(((const char*)data)[entry]);
					break;

				// 4 bytes
				case VarDataType::Int32:
				case VarDataType::Bitmask:
					return (double)(((const int*)data)[entry]);
					break;
					
				case VarDataType::Float:
					return (double)(((const float*)data)[entry]);
					break;

				// 8 bytes
				case VarDataType::Double:
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
int DiskClient::getSessionStrVal(const char *path, char *val, int valLen)
{

    if(ibtFile_ && path && val && valLen > 0)
	{
		const char *tVal = nullptr;
		int tValLen = 0;
		if(ParseYaml(sessionInfoBuf_->data(), path, &tVal, &tValLen))
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