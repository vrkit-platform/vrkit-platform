/*!
 * Copyright (c) 2021 Emeric Grange
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include "utils_sysinfo.h"

#include <thread>

#include <QSysInfo>
#include <QProcess>
#include <QDebug>

#if defined(Q_OS_LINUX)
#include <sys/sysinfo.h>
#include <unistd.h>
#endif

#if defined(Q_OS_MACOS)
#include <sys/types.h>
#include <sys/sysctl.h>
#endif

#if defined(Q_OS_WINDOWS)
#include <Windows.h>
#endif

#if defined(Q_OS_ANDROID)
// TODO
#endif

#if defined(Q_OS_IOS)
// TODO
#endif

#if defined(ENABLE_LIBCPUID)
#include <libcpuid/libcpuid.h>
#endif

/* ************************************************************************** */

UtilsSysInfo *UtilsSysInfo::instance = nullptr;

UtilsSysInfo *UtilsSysInfo::getInstance()
{
    if (instance == nullptr)
    {
        instance = new UtilsSysInfo();
    }

    return instance;
}

UtilsSysInfo::UtilsSysInfo()
{
    getCpuInfos();
    getRamInfos();

    osName = QSysInfo::prettyProductName();
    osVersion = QSysInfo::productVersion();
}

UtilsSysInfo::~UtilsSysInfo()
{
    //
}

/* ************************************************************************** */

void UtilsSysInfo::getCpuInfos()
{
    // Get CPU hardware architecture
    cpuArch = QSysInfo::currentCpuArchitecture();

    // Get logical core count (using C++11)
    cpuCoreLogical = std::thread::hardware_concurrency();

    // Default value for physical count == logical count
    cpuCorePhysical = std::thread::hardware_concurrency();

#if defined(ENABLE_LIBCPUID)
    // Try to get physical core count (using libcpuid)
    if (cpuid_present())
    {
        struct cpu_raw_data_t raw;
        struct cpu_id_t id;

        if (cpuid_get_raw_data(&raw) == 0 && cpu_identify(&raw, &id) == 0)
        {
            if (id.flags[CPU_FEATURE_HT])
            {
                m_coreCount_physical /= 2;
            }
        }
    }
#else

#if defined(Q_OS_LINUX) || defined(Q_OS_MACOS) || defined(Q_OS_WINDOWS)
    if (cpuArch == "x86_64")
    {
        // Desktop OS? x86_64 CPU? Assume HyperThreaded CPU...
        cpuCorePhysical /= 2;
    }
#endif

#endif
}

/* ************************************************************************** */

void UtilsSysInfo::getRamInfos()
{
#if defined(Q_OS_LINUX)

    struct sysinfo info;
    if (sysinfo(&info) == 0)
    {
        m_ram_total = info.totalram / 1048576; // bytes to MB
    }

#elif defined(Q_OS_MACOS)

    int64_t memsize = 0;
    size_t size = sizeof(memsize);

    if (sysctlbyname("hw.memsize", &memsize, &size, NULL, 0) != -1)
    {
        m_ram_total = memsize / 1048576; // bytes to MB
    }

#elif defined(Q_OS_WINDOWS)

    GetPhysicallyInstalledSystemMemory(&ramTotal);
    ramTotal /= 1024; // KB to MB

#endif
}

/* ************************************************************************** */

[[maybe_unused]] void UtilsSysInfo::printInfos()
{
    qDebug() << "UtilsSysInfo::getCoreInfos()";
    qDebug() << "> cpu (physical):" << cpuCorePhysical;
    qDebug() << "> cpu (logical) :" << cpuCoreLogical;

    qDebug() << "UtilsSysInfo::getRamInfos()";
    qDebug() << "> RAM size (MB)    :" << ramTotal;

    qDebug() << "UtilsSysInfo::OperatingSystem()";
    qDebug() << "> name    :" << QSysInfo::prettyProductName();
    qDebug() << "> version :" << QSysInfo::productType();
;
}

/* ************************************************************************** */
