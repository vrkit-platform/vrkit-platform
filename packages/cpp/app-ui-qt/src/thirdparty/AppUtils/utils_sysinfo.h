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

#ifndef UTILS_SYSINFO_H
#define UTILS_SYSINFO_H
/* ************************************************************************** */

#include <QObject>
#include <QVariantMap>

/* ************************************************************************** */

/*!
 * \brief The UtilsSysinfo class
 */
class UtilsSysInfo : public QObject
{
    Q_OBJECT

    Q_PROPERTY(QString cpu_arch READ getCpuArch CONSTANT)
    Q_PROPERTY(unsigned int cpuCoreCountPhysical READ getCpuCoreCountPhysical CONSTANT)
    Q_PROPERTY(unsigned int cpuCoreCountLogical READ getCpuCoreCountLogical CONSTANT)
    Q_PROPERTY(quint64 ramTotal READ getRamTotal CONSTANT)

    Q_PROPERTY(QString osName READ getOsName CONSTANT)
    Q_PROPERTY(QString osVersion READ getOsVersion CONSTANT)

    QString cpuArch;
    unsigned int cpuCorePhysical = 0;
    unsigned int cpuCoreLogical = 0;

    uint64_t ramTotal = 0;

    QString osName;
    QString osVersion;

    // Singleton
    static UtilsSysInfo *instance;
    UtilsSysInfo();
    ~UtilsSysInfo() override;

    void getCpuInfos();
    void getRamInfos();

public:
    static UtilsSysInfo *getInstance();

    [[maybe_unused]] void printInfos();

    Q_INVOKABLE [[nodiscard]] QString getCpuArch() const { return cpuArch; };

    Q_INVOKABLE [[nodiscard]] unsigned int getCpuCoreCountPhysical() const { return cpuCorePhysical; };

    Q_INVOKABLE [[nodiscard]] unsigned int getCpuCoreCountLogical() const { return cpuCoreLogical; };

    Q_INVOKABLE [[nodiscard]] uint64_t getRamTotal() const  { return ramTotal; };

    Q_INVOKABLE [[nodiscard]] QString getOsName() const { return osName; };

    Q_INVOKABLE [[nodiscard]] QString getOsVersion() const { return osVersion; };
};

/* ************************************************************************** */
#endif // UTILS_SYSINFO_H
