//
// Created by jglanz on 1/4/2024.
//

#include <algorithm>

#include <CLI/CLI.hpp>
#include <fmt/core.h>

#include <IRacingTools/SDK/DiskClient.h>
#include <QCoreApplication>
#include <QDebug>

#include <chrono>
#include <format>
#include <iostream>
#include <QtCore>

using namespace std::literals;
using namespace IRacingTools::SDK::Utils;
using namespace IRacingTools::SDK;

//int WINAPI WinMain(HINSTANCE /*hInstance*/, HINSTANCE /*hPrevInstance*/, LPSTR lpCmdLine, int nCmdShow) {
    //nCmdShow, &lpCmdLine
int main(int argc, char** argv) {
    QCoreApplication::setApplicationName(APP_NAME);
    QCoreApplication::setApplicationVersion(APP_VERSION);

    CLI::App cli{APP_NAME};
    std::cout << APP_NAME << std::endl;

    std::string filename;
    cli.add_option("-f,--file", filename, "track map file");

    CLI11_PARSE(cli,argc,argv);
//    cli.parse(ToUtf8(GetCommandLineW()), true);

    std::cout << fmt::format("parsed filename: {}", filename) << std::endl;




    DiskClient diskClient(filename);
    std::cout << "Disk client opened " << filename << ": ready=" << diskClient.isFileOpen()
             << ",sampleCount=" << diskClient.getSampleCount() << std::endl;
    auto nowMillis = [] () {
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now().time_since_epoch());
    };
//    VarHolder latVar("Lat");
//    VarHolder lonVar("Lon");
    std::chrono::milliseconds previousSessionDuration{0};
    std::chrono::milliseconds previousTimeMillis = nowMillis();
    std::chrono::milliseconds lastPrintTime{0};
    while (diskClient.hasNext()) {
        if (!diskClient.next()) {
            std::cerr << "Unable to get next: " << diskClient.getSampleIndex() << "\n";
            break;
        }

        auto lat = diskClient.getVarFloat("Lat");
        auto lon = diskClient.getVarFloat("Lon");
        auto posCountRes = diskClient.getVarCount("CarIdxPosition");
        auto sessionTimeVal = diskClient.getVarDouble("SessionTime");
        if (!sessionTimeVal) {
            std::cerr << "No session time\n";
            abort();
        }

        int posCount = 0;
        if (posCountRes) {
            for (std::size_t i = 0; i < posCountRes.value();i++) {
                auto pos = diskClient.getVarInt("CarIdxPosition", i).value_or(-2);
                if (pos > 0) {
                    posCount++;
                }
            }
        }

        auto sessionTime = sessionTimeVal.value();

        long long int sessionMillis = std::floor(sessionTime * 1000.0);
        std::chrono::milliseconds sessionDuration{sessionMillis};
        long long int millis = sessionMillis % 1000;
        auto intervalDuration = sessionDuration - previousSessionDuration;

        if (previousSessionDuration.count()) {
            auto currentTimeMillis = nowMillis();

            if (posCount > 0 ) {
                auto targetTimeMillis = !previousTimeMillis.count() ? currentTimeMillis
                                                                    : (previousTimeMillis + intervalDuration);
                if (targetTimeMillis > currentTimeMillis) {
                    auto sleepTimeMillis = targetTimeMillis - currentTimeMillis;
                    std::this_thread::sleep_for(sleepTimeMillis);
                }
                previousTimeMillis = targetTimeMillis;
            } else {
                previousTimeMillis = currentTimeMillis;
            }
        }

        previousSessionDuration = sessionDuration;

        if (posCount > 0 && nowMillis() - lastPrintTime > 999ms) {
            std::cout << std::format(
                "Session Time: {:%H}:{:%M}:{:%S}.{:03d}\t\tCar Pos Count: {}", sessionDuration, sessionDuration, sessionDuration, millis,
                posCount
            ) << "\n";
            std::flush(std::cout);
            lastPrintTime = nowMillis();
        }

//        if (!lat || !lon) {
//            std::cerr << "No lat or no lon \n";
//            continue;
//        }
//
//        std::cout << std::format("Coordinate\t\t{}\t{}\n",lat.value(),lon.value());
    }

    //    auto& varHeaders = diskClient.getVarHeaders();

//    using RowType = std::tuple<std::string, std::size_t>;

//    auto varNames = std::accumulate(varHeaders.begin(),varHeaders.end(), std::list<RowType>{}, [&](std::list<RowType> rows, const VarDataHeader& header){
//        rows.push_back(std::make_tuple(header.name, header.count));
//        return rows;
//    });
//    std::array<std::string_view, 2> headers = {"Name", "Count"};
//    PrintTabularData<2,std::string, std::size_t>(headers, varNames);
    //    auto shm = IRacingTools::Shared::SharedMemoryStorage::GetInstance();
    //    winrt::check_bool(shm->loadTrackMapFromLapTrajectoryFile(filename));

    return 0;
}