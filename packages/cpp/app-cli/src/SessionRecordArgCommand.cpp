//
// Created by jglanz on 4/19/2024.
//


#define MIN_WIN_VER 0x0501

#ifndef WINVER
  #define WINVER MIN_WIN_VER
#endif

#ifndef _WIN32_WINNT
  #define _WIN32_WINNT MIN_WIN_VER
#endif

#pragma warning(disable : 4996)//_CRT_SECURE_NO_WARNINGS

#include <conio.h>
#include <csignal>
#include <cstdio>
#include <ctime>
#include <windows.h>

#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/Utils/YamlParser.h>

#include "SessionRecordArgCommand.h"

// for timeBeginPeriod
#pragma comment(lib, "Winmm")

// 16 ms timeout
#define TIMEOUT 16
namespace IRacingTools::App::Commands {
  namespace {

    using namespace IRacingTools::SDK;

    char *g_data = nullptr;
    int g_nData = 0;
    time_t g_ttime;
    FILE *g_file = nullptr;

    const char g_playerInCarString[] = "IsOnTrack";
    int g_playerInCarOffset = -1;

    const char g_sessionTimeString[] = "SessionTime";
    int g_sessionTimeOffset = -1;

    const char g_lapIndexString[] = "Lap";
    int g_lapIndexOffset = -1;

    // place holders for variables that need to be updated in the header of our CSV file
    double startTime;
    long int startTimeOffset;

    double endTime;
    long int endTimeOffset;

    int lastLap;
    int lapCount;
    long int lapCountOffset;

    int recordCount;
    long int recordCountOffset;

    // place holders for data that needs to be updated in our IBT file
    DataHeader g_diskHeader;
    DiskSubHeader g_diskSubHeader;
    int g_diskSubHeaderOffset = 0;
    int g_diskLastLap = -1;

    std::string gOutputPath{};

    // open a file for writing, without overwriting any existing files
    FILE *openUniqueFile(const char *name, const char *ext, time_t t_time, bool asBinary) {
      FILE *file = nullptr;
      char tstr[MAX_PATH] = "";
      int i = 0;

      // find an unused filename
      do {
        if (file)
          fclose(file);


        _snprintf(tstr, MAX_PATH, "%s\\%s", gOutputPath.c_str(), name);
        tstr[MAX_PATH - 1] = '\0';

        tm tm_time;
        localtime_s(&tm_time, &t_time);
        strftime(tstr + strlen(tstr), MAX_PATH - strlen(tstr), " %Y-%m-%d %H-%M-%S", &tm_time);
        tstr[MAX_PATH - 1] = '\0';

        if (i > 0) {
          _snprintf(tstr + strlen(tstr), MAX_PATH - strlen(tstr), " %02d", i, ext);
          tstr[MAX_PATH - 1] = '\0';
        }

        _snprintf(tstr + strlen(tstr), MAX_PATH - strlen(tstr), ".%s", ext);
        tstr[MAX_PATH - 1] = '\0';

        file = fopen(tstr, "r");
      } while (file && ++i < 100);

      // failed to find an unused file
      if (file) {
        fclose(file);
        return nullptr;
      }

      if (asBinary)
        return fopen(tstr, "wb");
      else
        return fopen(tstr, "w");
    }

    void writeSessionItem(FILE *file, const char *path, const char *desc) {
      const char *valstr;
      int valstrlen;

      fprintf(file, desc);
      if (Utils::ParseYaml(LiveConnection::GetInstance().getSessionInfoStr(), path, &valstr, &valstrlen))
        fwrite(valstr, 1, valstrlen, file);
      fprintf(file, "\n");
    }

    static const int reserveCount = 32;
    // reserve a little space in the file for a number to be written
    long int fileReserveSpace(FILE *file) {
      const long int pos = ftell(file);

      int count = reserveCount;
      while (count--)
        fputc(' ', file);
      fputs("\n", file);

      return pos;
    }

    // fill in a number in our reserved space, without overwriting the newline
    void fileWriteReservedInt(FILE *file, long int pos, int value) {
      const long int curpos = ftell(file);

      fseek(file, pos, SEEK_SET);
      fprintf(file, "%d", value);

      fseek(file, curpos, SEEK_SET);
    }

    void fileWriteReservedFloat(FILE *file, long int pos, double value) {
      const long int curpos = ftell(file);

      fseek(file, pos, SEEK_SET);
      fprintf(file, "%f", value);

      fseek(file, curpos, SEEK_SET);
    }

    // log header to ibt binary format
    void logHeaderToIBT(const DataHeader *header, FILE *file, time_t t_time) {
      static auto &conn = LiveConnection::GetInstance();
      if (header && file) {
        int offset = 0;

        // main header
        memcpy(&g_diskHeader, header, sizeof(g_diskHeader));
        offset += sizeof(g_diskHeader);

        // sub header is written out at end of session
        memset(&g_diskSubHeader, 0, sizeof(g_diskSubHeader));
        g_diskSubHeader.startDate = t_time;
        g_diskSubHeaderOffset = offset;
        offset += sizeof(g_diskSubHeader);

        // pointer to var definitions
        g_diskHeader.varHeaderOffset = offset;
        offset += g_diskHeader.numVars * sizeof(VarDataHeader);

        // pointer to session info string
        g_diskHeader.session.offset = offset;
        offset += g_diskHeader.session.len;

        // pointer to start of buffered data
        g_diskHeader.numBuf = 1;
        g_diskHeader.varBuf[0].bufOffset = offset;

        fwrite(&g_diskHeader, 1, sizeof(g_diskHeader), file);
        fwrite(&g_diskSubHeader, 1, sizeof(g_diskSubHeader), file);
        fwrite(conn.getVarHeaderPtr(), 1, g_diskHeader.numVars * sizeof(VarDataHeader), file);
        fwrite(conn.getSessionInfoStr(), 1, g_diskHeader.session.len, file);

        if (ftell(file) != g_diskHeader.varBuf[0].bufOffset)
          printf("ERROR: file pointer mismatch: %ld != %d\n", ftell(file), g_diskHeader.varBuf[0].bufOffset);
      }
    }

    void logDataToIBT(const DataHeader *header, const char *data, FILE *file) {
      // write data to disk, and update irsdk_diskSubHeader in memory
      if (header && data && file) {
        fwrite(data, 1, g_diskHeader.bufLen, file);
        g_diskSubHeader.sampleCount++;

        if (g_sessionTimeOffset >= 0) {
          double time = *((double *) (data + g_sessionTimeOffset));
          if (g_diskSubHeader.sampleCount == 1) {
            g_diskSubHeader.startTime = time;
            g_diskSubHeader.endTime = time;
          }

          if (g_diskSubHeader.endTime < time)
            g_diskSubHeader.endTime = time;
        }

        if (g_lapIndexOffset >= 0) {
          const int lap = *((int *) (data + g_lapIndexOffset));

          if (g_diskSubHeader.sampleCount == 1)
            g_diskLastLap = lap - 1;

          if (g_diskLastLap < lap) {
            g_diskSubHeader.lapCount++;
            g_diskLastLap = lap;
          }
        }
      }
    }

    void logCloseIBT(FILE *file) {
      if (file) {
        fseek(file, g_diskSubHeaderOffset, SEEK_SET);
        fwrite(&g_diskSubHeader, 1, sizeof(g_diskSubHeader), file);
      }
    }


    void logStateToFile(time_t t_time) {
      static auto &conn = LiveConnection::GetInstance();
      auto sesStr = conn.getSessionInfoStr();
      if (sesStr) {
        FILE *file = openUniqueFile("irsdk_session", "txt", t_time, false);
        if (file) {
          // dump session information to disk
          fputs(sesStr, file);
          fclose(file);
        }
      }
    }

    // dump data to display, for debugging
    void logHeaderToDisplay(const DataHeader *header) {
      if (header) {
        printf("\n\nSession Info String:\n\n");

        // puts is safer in case the string contains '%' characters
        puts(LiveConnection::GetInstance().getSessionInfoStr());

        printf("\n\nVariable Headers:\n\n");
        for (int i = 0; i < header->numVars; i++) {
          const VarDataHeader *rec = LiveConnection::GetInstance().getVarHeaderEntry(i);
          printf("%s, %s, %s\n", rec->name, rec->desc, rec->unit);
        }
        printf("\n\n");
      }
    }

    void logDataToDisplay(const DataHeader *header, const char *data) {
      if (header && data) {
        for (int i = 0; i < header->numVars; i++) {
          const VarDataHeader *rec = LiveConnection::GetInstance().getVarHeaderEntry(i);

          printf("%s[", rec->name);

          // only dump the first 4 entrys in an array to save space
          // for now ony carsTrkPct and carsTrkLoc output more than 4 entrys
          int count = 1;
          if (rec->type != VarDataType::Char)
            count = std::min<int>(4, rec->count);

          for (int j = 0; j < count; j++) {
            switch (rec->type) {
              case VarDataType::Char:
                printf("%s", (char *) (data + rec->offset));
                break;
              case VarDataType::Bool:
                printf("%d", ((bool *) (data + rec->offset))[j]);
                break;
              case VarDataType::Int32:
                printf("%d", ((int *) (data + rec->offset))[j]);
                break;
              case VarDataType::Bitmask:
                printf("0x%08x", ((int *) (data + rec->offset))[j]);
                break;
              case VarDataType::Float:
                printf("%0.2f", ((float *) (data + rec->offset))[j]);
                break;
              case VarDataType::Double:
                printf("%0.2f", ((double *) (data + rec->offset))[j]);
                break;
            }

            if (j + 1 < count)
              printf("; ");
          }
          if (rec->type != VarDataType::Char && count < rec->count)
            printf("; ...");

          printf("]");

          if ((i + 1) < header->numVars)
            printf(", ");
        }
        printf("\n\n");
      }
    }

    void initData(const DataHeader *header, char *&data, int &nData) {
      if (data)
        delete[] data;
      nData = header->bufLen;
      data = new char[nData];

      // grab the memory offset to the playerInCar flag
      g_playerInCarOffset = LiveConnection::GetInstance().varNameToOffset(g_playerInCarString);
      g_sessionTimeOffset = LiveConnection::GetInstance().varNameToOffset(g_sessionTimeString);
      g_lapIndexOffset = LiveConnection::GetInstance().varNameToOffset(g_lapIndexString);

      // get the playerCarIdx
      //const char *valstr;
      //int valstrlen;
      //const char g_playerCarIdxPath[] = "DriverInfo:DriverCarIdx:";
      //playerCarIdx = -1;
      //if(ParseYaml(irsdk_getSessionInfoStr(), g_playerCarIdxPath, &valstr, &valstrlen))
      //	playerCarIdx = atoi(valstr);
    }

    bool canLogToFile(const DataHeader *header, const char *data) {
      (void) header;
      (void) data;
      return
#ifdef LOG_IN_CAR_ONLY
          // only log if driver in car...
          (g_playerInCarOffset < 0 || *((bool *) (data + g_playerInCarOffset)));
#else
          true;
#endif
    }

    bool open_file(FILE *&file, time_t &t_time) {
      // get current time
      t_time = time(nullptr);
#ifdef LOG_TO_CSV
      file = openUniqueFile("irsdk_session", "csv", t_time, false);
#else
      file = openUniqueFile("irsdk_session", "ibt", t_time, true);
#endif

      if (file) {
        printf("Session begin.\n\n");
        return true;
      }
      return false;
    }

    void close_file(FILE *&file, time_t t_time) {
      // if disconnected close file
      if (file) {
#ifndef LOG_TO_CSV
        logCloseIBT(file);
#endif
        // write last state string recieved out to disk
        logStateToFile(t_time);

        fclose(file);
        file = nullptr;

        printf("Session ended.\n\n");
      }
    }

    void end_session(bool shutdown) {
      close_file(g_file, g_ttime);

      if (g_data)
        delete[] g_data;
      g_data = nullptr;

      if (shutdown) {
        LiveConnection::GetInstance().cleanup();
        timeEndPeriod(1);
      }
    }

    // exited with ctrl-c
    void ex_program(int sig) {
      (void) sig;

      printf("received ctrl-c, exiting\n\n");

      end_session(true);

      signal(SIGINT, SIG_DFL);
      exit(0);
    }

    int recordSession(const std::string &outputPath, bool printHeader, bool printData) {

      assert((std::filesystem::is_directory(outputPath) && "output path is does not exist"));

      gOutputPath = outputPath;

      // trap ctrl-c
      signal(SIGINT, ex_program);
      printf("press enter to exit:\n\n");

      // bump priority up so we get time from the sim
      SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);

      // ask for 1ms timer so sleeps are more precise
      timeBeginPeriod(1);
      g_data = nullptr;
      g_nData = 0;
      auto &conn = LiveConnection::GetInstance();

      while (!_kbhit()) {
        // wait for new data and copy it into the g_data buffer, if g_data is not null
        if (conn.waitForDataReady(TIMEOUT, g_data)) {
          auto pHeader = conn.getHeader();
          if (pHeader) {
            // if header changes size, assume a new connection
            if (!g_data || g_nData != pHeader->bufLen) {
              // relocate our g_data buffer to fit, and lookup some data offsets
              initData(pHeader, g_data, g_nData);

              if (printHeader)
                logHeaderToDisplay(pHeader);

            } else if (g_data) {

              // open file if first time
              if (!g_file && open_file(g_file, g_ttime)) {
                logHeaderToIBT(pHeader, g_file, g_ttime);
              }

              // and log data to file
              if (g_file) {
                logDataToIBT(pHeader, g_data, g_file);
              }

              if (printData) {
                static int ct = 0;
                if (ct++ % 100 == 0) {
                  logDataToDisplay(pHeader, g_data);
                }
              }
            }
          }
        }
        // session ended
        else if (!conn.isConnected())
          end_session(false);
      }

      // exited with a keyboard hit
      printf("Shutting down.\n\n");

      end_session(true);

      return 0;
    }

  }// namespace


  CLI::App *SessionRecordArgCommand::createCommand(CLI::App *app) {


    auto cmd = app->add_subcommand("record", "Record Live Session");

    cmd->add_option("-o,--output", outputPath_, "Output path")
        ->required(false)
        ->default_val(std::filesystem::current_path().string());
    cmd->add_flag("--print-header", printHeader_, "Print header to stdout")->required(false)->default_val(false);
    cmd->add_flag("--print-data", printData_, "Print data to stdout")->required(false)->default_val(false);


    return cmd;
  }

  int SessionRecordArgCommand::execute() {
    auto outputPath = outputPath_;
    fmt::println("outputPath: {}", outputPath);
    assert((!outputPath.empty() && "Output path is invalid"));
    outputPath = std::filesystem::absolute(outputPath).string();
    fmt::println("Absolute Output Path: {}", outputPath);
    std::filesystem::create_directories(outputPath);
    assert((std::filesystem::is_directory(outputPath) && "Fail create output path"));

    return recordSession(outputPath, printHeader_, printData_);
  }
}