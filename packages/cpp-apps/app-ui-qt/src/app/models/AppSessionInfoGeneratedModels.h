
#pragma once

#include "ModelTransform.h"
#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
#include <QList>
#include <QtCore>
namespace IRacingTools::App::Models {
  using namespace IRacingTools::SDK::SessionInfo;

  class AppGroup;
  class AppSessionResult;

  class AppAeroSettings : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString rearWingSetting MEMBER rearWingSetting NOTIFY changed)
    Q_PROPERTY(std::int32_t ofDivePlanes MEMBER ofDivePlanes NOTIFY changed)
    Q_PROPERTY(QString wingGurneySetting MEMBER wingGurneySetting NOTIFY changed)


  public:
    QString rearWingSetting{};
    std::int32_t ofDivePlanes{};
    QString wingGurneySetting{};

    explicit AppAeroSettings(const IRacingTools::SDK::SessionInfo::AeroSettings &value = {}, QObject *parent = nullptr)
        : QObject(parent), rearWingSetting(QString::fromStdString(value.rearWingSetting)),
          ofDivePlanes(value.ofDivePlanes), wingGurneySetting(QString::fromStdString(value.wingGurneySetting)){};

  signals:
    void changed();
  };


  class AppBrakeSpec : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString padCompound MEMBER padCompound NOTIFY changed)
    Q_PROPERTY(QString brakePressureBias MEMBER brakePressureBias NOTIFY changed)


  public:
    QString padCompound{};
    QString brakePressureBias{};

    explicit AppBrakeSpec(const IRacingTools::SDK::SessionInfo::BrakeSpec &value = {}, QObject *parent = nullptr)
        : QObject(parent), padCompound(QString::fromStdString(value.padCompound)),
          brakePressureBias(QString::fromStdString(value.brakePressureBias)){};

  signals:
    void changed();
  };


  class AppCamera : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t cameraNum MEMBER cameraNum NOTIFY changed)
    Q_PROPERTY(QString cameraName MEMBER cameraName NOTIFY changed)


  public:
    std::int32_t cameraNum{};
    QString cameraName{};

    explicit AppCamera(const IRacingTools::SDK::SessionInfo::Camera &value = {}, QObject *parent = nullptr)
        : QObject(parent), cameraNum(value.cameraNum), cameraName(QString::fromStdString(value.cameraName)){};

  signals:
    void changed();
  };


  class AppCameraInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QList<QSharedPointer<AppGroup>> groups MEMBER groups NOTIFY changed)


  public:
    QList<QSharedPointer<AppGroup>> groups{};

    explicit AppCameraInfo(const IRacingTools::SDK::SessionInfo::CameraInfo &value = {}, QObject *parent = nullptr)
        : QObject(parent), groups(ToQList<Group, QSharedPointer<AppGroup>>(value.groups, parent)){};

  signals:
    void changed();
  };


  class AppChassisCorner : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString cornerWeight MEMBER cornerWeight NOTIFY changed)
    Q_PROPERTY(QString rideHeight MEMBER rideHeight NOTIFY changed)
    Q_PROPERTY(QString shockDefl MEMBER shockDefl NOTIFY changed)
    Q_PROPERTY(QString springPerchOffset MEMBER springPerchOffset NOTIFY changed)
    Q_PROPERTY(QString springRate MEMBER springRate NOTIFY changed)
    Q_PROPERTY(QString lsCompDamping MEMBER lsCompDamping NOTIFY changed)
    Q_PROPERTY(QString hsCompDamping MEMBER hsCompDamping NOTIFY changed)
    Q_PROPERTY(QString hsRbdDamping MEMBER hsRbdDamping NOTIFY changed)
    Q_PROPERTY(QString camber MEMBER camber NOTIFY changed)
    Q_PROPERTY(QString springDefl MEMBER springDefl NOTIFY changed)
    Q_PROPERTY(QString toeIn MEMBER toeIn NOTIFY changed)


  public:
    QString cornerWeight{};
    QString rideHeight{};
    QString shockDefl{};
    QString springPerchOffset{};
    QString springRate{};
    QString lsCompDamping{};
    QString hsCompDamping{};
    QString hsRbdDamping{};
    QString camber{};
    QString springDefl{};
    QString toeIn{};

    explicit AppChassisCorner(const IRacingTools::SDK::SessionInfo::ChassisCorner &value = {},
                              QObject *parent = nullptr)
        : QObject(parent), cornerWeight(QString::fromStdString(value.cornerWeight)),
          rideHeight(QString::fromStdString(value.rideHeight)), shockDefl(QString::fromStdString(value.shockDefl)),
          springPerchOffset(QString::fromStdString(value.springPerchOffset)),
          springRate(QString::fromStdString(value.springRate)),
          lsCompDamping(QString::fromStdString(value.lsCompDamping)),
          hsCompDamping(QString::fromStdString(value.hsCompDamping)),
          hsRbdDamping(QString::fromStdString(value.hsRbdDamping)), camber(QString::fromStdString(value.camber)),
          springDefl(QString::fromStdString(value.springDefl)), toeIn(QString::fromStdString(value.toeIn)){};

  signals:
    void changed();
  };


  class AppDriver : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t carIdx MEMBER carIdx NOTIFY changed)
    Q_PROPERTY(QString userName MEMBER userName NOTIFY changed)
    Q_PROPERTY(QString abbrevName MEMBER abbrevName NOTIFY changed)
    Q_PROPERTY(QString initials MEMBER initials NOTIFY changed)
    Q_PROPERTY(std::int32_t userID MEMBER userID NOTIFY changed)
    Q_PROPERTY(std::int32_t teamID MEMBER teamID NOTIFY changed)
    Q_PROPERTY(QString teamName MEMBER teamName NOTIFY changed)
    Q_PROPERTY(QString carNumber MEMBER carNumber NOTIFY changed)
    Q_PROPERTY(std::int32_t carNumberRaw MEMBER carNumberRaw NOTIFY changed)
    Q_PROPERTY(QString carPath MEMBER carPath NOTIFY changed)
    Q_PROPERTY(std::int32_t carClassID MEMBER carClassID NOTIFY changed)
    Q_PROPERTY(std::int32_t carID MEMBER carID NOTIFY changed)
    Q_PROPERTY(std::int32_t carIsPaceCar MEMBER carIsPaceCar NOTIFY changed)
    Q_PROPERTY(std::int32_t carIsAI MEMBER carIsAI NOTIFY changed)
    Q_PROPERTY(std::int32_t carIsElectric MEMBER carIsElectric NOTIFY changed)
    Q_PROPERTY(QString carScreenName MEMBER carScreenName NOTIFY changed)
    Q_PROPERTY(QString carScreenNameShort MEMBER carScreenNameShort NOTIFY changed)
    Q_PROPERTY(QString carClassShortName MEMBER carClassShortName NOTIFY changed)
    Q_PROPERTY(std::int32_t carClassRelSpeed MEMBER carClassRelSpeed NOTIFY changed)
    Q_PROPERTY(std::int32_t carClassLicenseLevel MEMBER carClassLicenseLevel NOTIFY changed)
    Q_PROPERTY(QString carClassMaxFuelPct MEMBER carClassMaxFuelPct NOTIFY changed)
    Q_PROPERTY(QString carClassWeightPenalty MEMBER carClassWeightPenalty NOTIFY changed)
    Q_PROPERTY(QString carClassPowerAdjust MEMBER carClassPowerAdjust NOTIFY changed)
    Q_PROPERTY(QString carClassDryTireSetLimit MEMBER carClassDryTireSetLimit NOTIFY changed)
    Q_PROPERTY(QString carClassColor MEMBER carClassColor NOTIFY changed)
    Q_PROPERTY(float carClassEstLapTime MEMBER carClassEstLapTime NOTIFY changed)
    Q_PROPERTY(std::int32_t iRating MEMBER iRating NOTIFY changed)
    Q_PROPERTY(std::int32_t licLevel MEMBER licLevel NOTIFY changed)
    Q_PROPERTY(std::int32_t licSubLevel MEMBER licSubLevel NOTIFY changed)
    Q_PROPERTY(QString licString MEMBER licString NOTIFY changed)
    Q_PROPERTY(QString licColor MEMBER licColor NOTIFY changed)
    Q_PROPERTY(std::int32_t isSpectator MEMBER isSpectator NOTIFY changed)
    Q_PROPERTY(QString carDesignStr MEMBER carDesignStr NOTIFY changed)
    Q_PROPERTY(QString helmetDesignStr MEMBER helmetDesignStr NOTIFY changed)
    Q_PROPERTY(QString suitDesignStr MEMBER suitDesignStr NOTIFY changed)
    Q_PROPERTY(std::int32_t bodyType MEMBER bodyType NOTIFY changed)
    Q_PROPERTY(std::int32_t faceType MEMBER faceType NOTIFY changed)
    Q_PROPERTY(std::int32_t helmetType MEMBER helmetType NOTIFY changed)
    Q_PROPERTY(QString carNumberDesignStr MEMBER carNumberDesignStr NOTIFY changed)
    Q_PROPERTY(QString carSponsor1 MEMBER carSponsor1 NOTIFY changed)
    Q_PROPERTY(QString carSponsor2 MEMBER carSponsor2 NOTIFY changed)
    Q_PROPERTY(QString clubName MEMBER clubName NOTIFY changed)
    Q_PROPERTY(std::int32_t clubID MEMBER clubID NOTIFY changed)
    Q_PROPERTY(QString divisionName MEMBER divisionName NOTIFY changed)
    Q_PROPERTY(std::int32_t divisionID MEMBER divisionID NOTIFY changed)
    Q_PROPERTY(std::int32_t curDriverIncidentCount MEMBER curDriverIncidentCount NOTIFY changed)
    Q_PROPERTY(std::int32_t teamIncidentCount MEMBER teamIncidentCount NOTIFY changed)


  public:
    std::int32_t carIdx{};
    QString userName{};
    QString abbrevName{};
    QString initials{};
    std::int32_t userID{};
    std::int32_t teamID{};
    QString teamName{};
    QString carNumber{};
    std::int32_t carNumberRaw{};
    QString carPath{};
    std::int32_t carClassID{};
    std::int32_t carID{};
    std::int32_t carIsPaceCar{};
    std::int32_t carIsAI{};
    std::int32_t carIsElectric{};
    QString carScreenName{};
    QString carScreenNameShort{};
    QString carClassShortName{};
    std::int32_t carClassRelSpeed{};
    std::int32_t carClassLicenseLevel{};
    QString carClassMaxFuelPct{};
    QString carClassWeightPenalty{};
    QString carClassPowerAdjust{};
    QString carClassDryTireSetLimit{};
    QString carClassColor{};
    float carClassEstLapTime{};
    std::int32_t iRating{};
    std::int32_t licLevel{};
    std::int32_t licSubLevel{};
    QString licString{};
    QString licColor{};
    std::int32_t isSpectator{};
    QString carDesignStr{};
    QString helmetDesignStr{};
    QString suitDesignStr{};
    std::int32_t bodyType{};
    std::int32_t faceType{};
    std::int32_t helmetType{};
    QString carNumberDesignStr{};
    QString carSponsor1{};
    QString carSponsor2{};
    QString clubName{};
    std::int32_t clubID{};
    QString divisionName{};
    std::int32_t divisionID{};
    std::int32_t curDriverIncidentCount{};
    std::int32_t teamIncidentCount{};

    explicit AppDriver(const IRacingTools::SDK::SessionInfo::Driver &value = {}, QObject *parent = nullptr)
        : QObject(parent), carIdx(value.carIdx), userName(QString::fromStdString(value.userName)),
          abbrevName(QString::fromStdString(value.abbrevName)), initials(QString::fromStdString(value.initials)),
          userID(value.userID), teamID(value.teamID), teamName(QString::fromStdString(value.teamName)),
          carNumber(QString::fromStdString(value.carNumber)), carNumberRaw(value.carNumberRaw),
          carPath(QString::fromStdString(value.carPath)), carClassID(value.carClassID), carID(value.carID),
          carIsPaceCar(value.carIsPaceCar), carIsAI(value.carIsAI), carIsElectric(value.carIsElectric),
          carScreenName(QString::fromStdString(value.carScreenName)),
          carScreenNameShort(QString::fromStdString(value.carScreenNameShort)),
          carClassShortName(QString::fromStdString(value.carClassShortName)), carClassRelSpeed(value.carClassRelSpeed),
          carClassLicenseLevel(value.carClassLicenseLevel),
          carClassMaxFuelPct(QString::fromStdString(value.carClassMaxFuelPct)),
          carClassWeightPenalty(QString::fromStdString(value.carClassWeightPenalty)),
          carClassPowerAdjust(QString::fromStdString(value.carClassPowerAdjust)),
          carClassDryTireSetLimit(QString::fromStdString(value.carClassDryTireSetLimit)),
          carClassColor(QString::fromStdString(value.carClassColor)), carClassEstLapTime(value.carClassEstLapTime),
          iRating(value.iRating), licLevel(value.licLevel), licSubLevel(value.licSubLevel),
          licString(QString::fromStdString(value.licString)), licColor(QString::fromStdString(value.licColor)),
          isSpectator(value.isSpectator), carDesignStr(QString::fromStdString(value.carDesignStr)),
          helmetDesignStr(QString::fromStdString(value.helmetDesignStr)),
          suitDesignStr(QString::fromStdString(value.suitDesignStr)), bodyType(value.bodyType),
          faceType(value.faceType), helmetType(value.helmetType),
          carNumberDesignStr(QString::fromStdString(value.carNumberDesignStr)),
          carSponsor1(QString::fromStdString(value.carSponsor1)),
          carSponsor2(QString::fromStdString(value.carSponsor2)), clubName(QString::fromStdString(value.clubName)),
          clubID(value.clubID), divisionName(QString::fromStdString(value.divisionName)), divisionID(value.divisionID),
          curDriverIncidentCount(value.curDriverIncidentCount), teamIncidentCount(value.teamIncidentCount){};

  signals:
    void changed();
  };


  class AppDriverInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t driverCarIdx MEMBER driverCarIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t driverUserID MEMBER driverUserID NOTIFY changed)
    Q_PROPERTY(std::int32_t paceCarIdx MEMBER paceCarIdx NOTIFY changed)
    Q_PROPERTY(float driverHeadPosX MEMBER driverHeadPosX NOTIFY changed)
    Q_PROPERTY(float driverHeadPosY MEMBER driverHeadPosY NOTIFY changed)
    Q_PROPERTY(float driverHeadPosZ MEMBER driverHeadPosZ NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarIsElectric MEMBER driverCarIsElectric NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarIdleRPM MEMBER driverCarIdleRPM NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarRedLine MEMBER driverCarRedLine NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarEngCylinderCount MEMBER driverCarEngCylinderCount NOTIFY changed)
    Q_PROPERTY(float driverCarFuelKgPerLtr MEMBER driverCarFuelKgPerLtr NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarFuelMaxLtr MEMBER driverCarFuelMaxLtr NOTIFY changed)
    Q_PROPERTY(float driverCarMaxFuelPct MEMBER driverCarMaxFuelPct NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarGearNumForward MEMBER driverCarGearNumForward NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarGearNeutral MEMBER driverCarGearNeutral NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarGearReverse MEMBER driverCarGearReverse NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarSLFirstRPM MEMBER driverCarSLFirstRPM NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarSLShiftRPM MEMBER driverCarSLShiftRPM NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarSLLastRPM MEMBER driverCarSLLastRPM NOTIFY changed)
    Q_PROPERTY(std::int32_t driverCarSLBlinkRPM MEMBER driverCarSLBlinkRPM NOTIFY changed)
    Q_PROPERTY(QString driverCarVersion MEMBER driverCarVersion NOTIFY changed)
    Q_PROPERTY(float driverPitTrkPct MEMBER driverPitTrkPct NOTIFY changed)
    Q_PROPERTY(float driverCarEstLapTime MEMBER driverCarEstLapTime NOTIFY changed)
    Q_PROPERTY(QString driverSetupName MEMBER driverSetupName NOTIFY changed)
    Q_PROPERTY(std::int32_t driverSetupIsModified MEMBER driverSetupIsModified NOTIFY changed)
    Q_PROPERTY(QString driverSetupLoadTypeName MEMBER driverSetupLoadTypeName NOTIFY changed)
    Q_PROPERTY(std::int32_t driverSetupPassedTech MEMBER driverSetupPassedTech NOTIFY changed)
    Q_PROPERTY(std::int32_t driverIncidentCount MEMBER driverIncidentCount NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppDriver>> drivers MEMBER drivers NOTIFY changed)


  public:
    std::int32_t driverCarIdx{};
    std::int32_t driverUserID{};
    std::int32_t paceCarIdx{};
    float driverHeadPosX{};
    float driverHeadPosY{};
    float driverHeadPosZ{};
    std::int32_t driverCarIsElectric{};
    std::int32_t driverCarIdleRPM{};
    std::int32_t driverCarRedLine{};
    std::int32_t driverCarEngCylinderCount{};
    float driverCarFuelKgPerLtr{};
    std::int32_t driverCarFuelMaxLtr{};
    float driverCarMaxFuelPct{};
    std::int32_t driverCarGearNumForward{};
    std::int32_t driverCarGearNeutral{};
    std::int32_t driverCarGearReverse{};
    std::int32_t driverCarSLFirstRPM{};
    std::int32_t driverCarSLShiftRPM{};
    std::int32_t driverCarSLLastRPM{};
    std::int32_t driverCarSLBlinkRPM{};
    QString driverCarVersion{};
    float driverPitTrkPct{};
    float driverCarEstLapTime{};
    QString driverSetupName{};
    std::int32_t driverSetupIsModified{};
    QString driverSetupLoadTypeName{};
    std::int32_t driverSetupPassedTech{};
    std::int32_t driverIncidentCount{};
    QList<QSharedPointer<AppDriver>> drivers{};

    explicit AppDriverInfo(const IRacingTools::SDK::SessionInfo::DriverInfo &value = {}, QObject *parent = nullptr)
        : QObject(parent), driverCarIdx(value.driverCarIdx), driverUserID(value.driverUserID),
          paceCarIdx(value.paceCarIdx), driverHeadPosX(value.driverHeadPosX), driverHeadPosY(value.driverHeadPosY),
          driverHeadPosZ(value.driverHeadPosZ), driverCarIsElectric(value.driverCarIsElectric),
          driverCarIdleRPM(value.driverCarIdleRPM), driverCarRedLine(value.driverCarRedLine),
          driverCarEngCylinderCount(value.driverCarEngCylinderCount),
          driverCarFuelKgPerLtr(value.driverCarFuelKgPerLtr), driverCarFuelMaxLtr(value.driverCarFuelMaxLtr),
          driverCarMaxFuelPct(value.driverCarMaxFuelPct), driverCarGearNumForward(value.driverCarGearNumForward),
          driverCarGearNeutral(value.driverCarGearNeutral), driverCarGearReverse(value.driverCarGearReverse),
          driverCarSLFirstRPM(value.driverCarSLFirstRPM), driverCarSLShiftRPM(value.driverCarSLShiftRPM),
          driverCarSLLastRPM(value.driverCarSLLastRPM), driverCarSLBlinkRPM(value.driverCarSLBlinkRPM),
          driverCarVersion(QString::fromStdString(value.driverCarVersion)), driverPitTrkPct(value.driverPitTrkPct),
          driverCarEstLapTime(value.driverCarEstLapTime),
          driverSetupName(QString::fromStdString(value.driverSetupName)),
          driverSetupIsModified(value.driverSetupIsModified),
          driverSetupLoadTypeName(QString::fromStdString(value.driverSetupLoadTypeName)),
          driverSetupPassedTech(value.driverSetupPassedTech), driverIncidentCount(value.driverIncidentCount),
          drivers(ToQList<Driver, QSharedPointer<AppDriver>>(value.drivers, parent)){};

  signals:
    void changed();
  };


  class AppEngine : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t boostLevelCal MEMBER boostLevelCal NOTIFY changed)
    Q_PROPERTY(std::int32_t throttleShapeTps MEMBER throttleShapeTps NOTIFY changed)


  public:
    std::int32_t boostLevelCal{};
    std::int32_t throttleShapeTps{};

    explicit AppEngine(const IRacingTools::SDK::SessionInfo::Engine &value = {}, QObject *parent = nullptr)
        : QObject(parent), boostLevelCal(value.boostLevelCal), throttleShapeTps(value.throttleShapeTps){};

  signals:
    void changed();
  };


  class AppFrequency : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t frequencyNum MEMBER frequencyNum NOTIFY changed)
    Q_PROPERTY(QString frequencyName MEMBER frequencyName NOTIFY changed)
    Q_PROPERTY(std::int32_t priority MEMBER priority NOTIFY changed)
    Q_PROPERTY(std::int32_t carIdx MEMBER carIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t entryIdx MEMBER entryIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t clubID MEMBER clubID NOTIFY changed)
    Q_PROPERTY(std::int32_t canScan MEMBER canScan NOTIFY changed)
    Q_PROPERTY(std::int32_t canSquawk MEMBER canSquawk NOTIFY changed)
    Q_PROPERTY(std::int32_t muted MEMBER muted NOTIFY changed)
    Q_PROPERTY(std::int32_t isMutable MEMBER isMutable NOTIFY changed)
    Q_PROPERTY(std::int32_t isDeletable MEMBER isDeletable NOTIFY changed)


  public:
    std::int32_t frequencyNum{};
    QString frequencyName{};
    std::int32_t priority{};
    std::int32_t carIdx{};
    std::int32_t entryIdx{};
    std::int32_t clubID{};
    std::int32_t canScan{};
    std::int32_t canSquawk{};
    std::int32_t muted{};
    std::int32_t isMutable{};
    std::int32_t isDeletable{};

    explicit AppFrequency(const IRacingTools::SDK::SessionInfo::Frequency &value = {}, QObject *parent = nullptr)
        : QObject(parent), frequencyNum(value.frequencyNum), frequencyName(QString::fromStdString(value.frequencyName)),
          priority(value.priority), carIdx(value.carIdx), entryIdx(value.entryIdx), clubID(value.clubID),
          canScan(value.canScan), canSquawk(value.canSquawk), muted(value.muted), isMutable(value.isMutable),
          isDeletable(value.isDeletable){};

  signals:
    void changed();
  };


  class AppFront : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString arbSize MEMBER arbSize NOTIFY changed)
    Q_PROPERTY(QString toeIn MEMBER toeIn NOTIFY changed)
    Q_PROPERTY(std::int32_t steeringRatio MEMBER steeringRatio NOTIFY changed)
    Q_PROPERTY(QString displayPage MEMBER displayPage NOTIFY changed)


  public:
    QString arbSize{};
    QString toeIn{};
    std::int32_t steeringRatio{};
    QString displayPage{};

    explicit AppFront(const IRacingTools::SDK::SessionInfo::Front &value = {}, QObject *parent = nullptr)
        : QObject(parent), arbSize(QString::fromStdString(value.arbSize)), toeIn(QString::fromStdString(value.toeIn)),
          steeringRatio(value.steeringRatio), displayPage(QString::fromStdString(value.displayPage)){};

  signals:
    void changed();
  };


  class AppFuel : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString fuelLevel MEMBER fuelLevel NOTIFY changed)


  public:
    QString fuelLevel{};

    explicit AppFuel(const IRacingTools::SDK::SessionInfo::Fuel &value = {}, QObject *parent = nullptr)
        : QObject(parent), fuelLevel(QString::fromStdString(value.fuelLevel)){};

  signals:
    void changed();
  };


  class AppGearRatio : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString gearStack MEMBER gearStack NOTIFY changed)
    Q_PROPERTY(QString speedInFirst MEMBER speedInFirst NOTIFY changed)
    Q_PROPERTY(QString speedInSecond MEMBER speedInSecond NOTIFY changed)
    Q_PROPERTY(QString speedInThird MEMBER speedInThird NOTIFY changed)
    Q_PROPERTY(QString speedInFourth MEMBER speedInFourth NOTIFY changed)
    Q_PROPERTY(QString speedInFifth MEMBER speedInFifth NOTIFY changed)
    Q_PROPERTY(QString speedInSixth MEMBER speedInSixth NOTIFY changed)


  public:
    QString gearStack{};
    QString speedInFirst{};
    QString speedInSecond{};
    QString speedInThird{};
    QString speedInFourth{};
    QString speedInFifth{};
    QString speedInSixth{};

    explicit AppGearRatio(const IRacingTools::SDK::SessionInfo::GearRatio &value = {}, QObject *parent = nullptr)
        : QObject(parent), gearStack(QString::fromStdString(value.gearStack)),
          speedInFirst(QString::fromStdString(value.speedInFirst)),
          speedInSecond(QString::fromStdString(value.speedInSecond)),
          speedInThird(QString::fromStdString(value.speedInThird)),
          speedInFourth(QString::fromStdString(value.speedInFourth)),
          speedInFifth(QString::fromStdString(value.speedInFifth)),
          speedInSixth(QString::fromStdString(value.speedInSixth)){};

  signals:
    void changed();
  };


  class AppGroup : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t groupNum MEMBER groupNum NOTIFY changed)
    Q_PROPERTY(QString groupName MEMBER groupName NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppCamera>> cameras MEMBER cameras NOTIFY changed)
    Q_PROPERTY(bool isScenic MEMBER isScenic NOTIFY changed)


  public:
    std::int32_t groupNum{};
    QString groupName{};
    QList<QSharedPointer<AppCamera>> cameras{};
    bool isScenic{};

    explicit AppGroup(const IRacingTools::SDK::SessionInfo::Group &value = {}, QObject *parent = nullptr)
        : QObject(parent), groupNum(value.groupNum), groupName(QString::fromStdString(value.groupName)),
          cameras(ToQList<Camera, QSharedPointer<AppCamera>>(value.cameras, parent)), isScenic(value.isScenic){};

  signals:
    void changed();
  };


  class AppQualifyResultsInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QList<QSharedPointer<AppSessionResult>> results MEMBER results NOTIFY changed)


  public:
    QList<QSharedPointer<AppSessionResult>> results{};

    explicit AppQualifyResultsInfo(const IRacingTools::SDK::SessionInfo::QualifyResultsInfo &value = {},
                                   QObject *parent = nullptr)
        : QObject(parent), results(ToQList<SessionResult, QSharedPointer<AppSessionResult>>(value.results, parent)){};

  signals:
    void changed();
  };


  class AppRadio : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t radioNum MEMBER radioNum NOTIFY changed)
    Q_PROPERTY(std::int32_t hopCount MEMBER hopCount NOTIFY changed)
    Q_PROPERTY(std::int32_t numFrequencies MEMBER numFrequencies NOTIFY changed)
    Q_PROPERTY(std::int32_t tunedToFrequencyNum MEMBER tunedToFrequencyNum NOTIFY changed)
    Q_PROPERTY(std::int32_t scanningIsOn MEMBER scanningIsOn NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppFrequency>> frequencies MEMBER frequencies NOTIFY changed)


  public:
    std::int32_t radioNum{};
    std::int32_t hopCount{};
    std::int32_t numFrequencies{};
    std::int32_t tunedToFrequencyNum{};
    std::int32_t scanningIsOn{};
    QList<QSharedPointer<AppFrequency>> frequencies{};

    explicit AppRadio(const IRacingTools::SDK::SessionInfo::Radio &value = {}, QObject *parent = nullptr)
        : QObject(parent), radioNum(value.radioNum), hopCount(value.hopCount), numFrequencies(value.numFrequencies),
          tunedToFrequencyNum(value.tunedToFrequencyNum), scanningIsOn(value.scanningIsOn),
          frequencies(ToQList<Frequency, QSharedPointer<AppFrequency>>(value.frequencies, parent)){};

  signals:
    void changed();
  };


  class AppRadioInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t selectedRadioNum MEMBER selectedRadioNum NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppRadio>> radios MEMBER radios NOTIFY changed)


  public:
    std::int32_t selectedRadioNum{};
    QList<QSharedPointer<AppRadio>> radios{};

    explicit AppRadioInfo(const IRacingTools::SDK::SessionInfo::RadioInfo &value = {}, QObject *parent = nullptr)
        : QObject(parent), selectedRadioNum(value.selectedRadioNum),
          radios(ToQList<Radio, QSharedPointer<AppRadio>>(value.radios, parent)){};

  signals:
    void changed();
  };


  class AppRear : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString arbSize MEMBER arbSize NOTIFY changed)
    Q_PROPERTY(QString crossWeight MEMBER crossWeight NOTIFY changed)


  public:
    QString arbSize{};
    QString crossWeight{};

    explicit AppRear(const IRacingTools::SDK::SessionInfo::Rear &value = {}, QObject *parent = nullptr)
        : QObject(parent), arbSize(QString::fromStdString(value.arbSize)),
          crossWeight(QString::fromStdString(value.crossWeight)){};

  signals:
    void changed();
  };


  class AppResultsFastestLap : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t carIdx MEMBER carIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t fastestLap MEMBER fastestLap NOTIFY changed)
    Q_PROPERTY(float fastestTime MEMBER fastestTime NOTIFY changed)


  public:
    std::int32_t carIdx{};
    std::int32_t fastestLap{};
    float fastestTime{};

    explicit AppResultsFastestLap(const IRacingTools::SDK::SessionInfo::ResultsFastestLap &value = {},
                                  QObject *parent = nullptr)
        : QObject(parent), carIdx(value.carIdx), fastestLap(value.fastestLap), fastestTime(value.fastestTime){};

  signals:
    void changed();
  };


  class AppResultsPosition : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t position MEMBER position NOTIFY changed)
    Q_PROPERTY(std::int32_t classPosition MEMBER classPosition NOTIFY changed)
    Q_PROPERTY(std::int32_t carIdx MEMBER carIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t lap MEMBER lap NOTIFY changed)
    Q_PROPERTY(float time MEMBER time NOTIFY changed)
    Q_PROPERTY(std::int32_t fastestLap MEMBER fastestLap NOTIFY changed)
    Q_PROPERTY(float fastestTime MEMBER fastestTime NOTIFY changed)
    Q_PROPERTY(float lastTime MEMBER lastTime NOTIFY changed)
    Q_PROPERTY(std::int32_t lapsLed MEMBER lapsLed NOTIFY changed)
    Q_PROPERTY(std::int32_t lapsComplete MEMBER lapsComplete NOTIFY changed)
    Q_PROPERTY(std::int32_t jokerLapsComplete MEMBER jokerLapsComplete NOTIFY changed)
    Q_PROPERTY(float lapsDriven MEMBER lapsDriven NOTIFY changed)
    Q_PROPERTY(std::int32_t incidents MEMBER incidents NOTIFY changed)
    Q_PROPERTY(std::int32_t reasonOutId MEMBER reasonOutId NOTIFY changed)
    Q_PROPERTY(QString reasonOutStr MEMBER reasonOutStr NOTIFY changed)


  public:
    std::int32_t position{};
    std::int32_t classPosition{};
    std::int32_t carIdx{};
    std::int32_t lap{};
    float time{};
    std::int32_t fastestLap{};
    float fastestTime{};
    float lastTime{};
    std::int32_t lapsLed{};
    std::int32_t lapsComplete{};
    std::int32_t jokerLapsComplete{};
    float lapsDriven{};
    std::int32_t incidents{};
    std::int32_t reasonOutId{};
    QString reasonOutStr{};

    explicit AppResultsPosition(const IRacingTools::SDK::SessionInfo::ResultsPosition &value = {},
                                QObject *parent = nullptr)
        : QObject(parent), position(value.position), classPosition(value.classPosition), carIdx(value.carIdx),
          lap(value.lap), time(value.time), fastestLap(value.fastestLap), fastestTime(value.fastestTime),
          lastTime(value.lastTime), lapsLed(value.lapsLed), lapsComplete(value.lapsComplete),
          jokerLapsComplete(value.jokerLapsComplete), lapsDriven(value.lapsDriven), incidents(value.incidents),
          reasonOutId(value.reasonOutId), reasonOutStr(QString::fromStdString(value.reasonOutStr)){};

  signals:
    void changed();
  };


  class AppSector : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t sectorNum MEMBER sectorNum NOTIFY changed)
    Q_PROPERTY(float sectorStartPct MEMBER sectorStartPct NOTIFY changed)


  public:
    std::int32_t sectorNum{};
    float sectorStartPct{};

    explicit AppSector(const IRacingTools::SDK::SessionInfo::Sector &value = {}, QObject *parent = nullptr)
        : QObject(parent), sectorNum(value.sectorNum), sectorStartPct(value.sectorStartPct){};

  signals:
    void changed();
  };


  class AppSession : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t sessionNum MEMBER sessionNum NOTIFY changed)
    Q_PROPERTY(QString sessionLaps MEMBER sessionLaps NOTIFY changed)
    Q_PROPERTY(QString sessionTime MEMBER sessionTime NOTIFY changed)
    Q_PROPERTY(std::int32_t sessionNumLapsToAvg MEMBER sessionNumLapsToAvg NOTIFY changed)
    Q_PROPERTY(QString sessionType MEMBER sessionType NOTIFY changed)
    Q_PROPERTY(QString sessionTrackRubberState MEMBER sessionTrackRubberState NOTIFY changed)
    Q_PROPERTY(QString sessionName MEMBER sessionName NOTIFY changed)
    Q_PROPERTY(std::int32_t sessionSkipped MEMBER sessionSkipped NOTIFY changed)
    Q_PROPERTY(std::int32_t sessionRunGroupsUsed MEMBER sessionRunGroupsUsed NOTIFY changed)
    Q_PROPERTY(std::int32_t sessionEnforceTireCompoundChange MEMBER sessionEnforceTireCompoundChange NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppResultsPosition>> resultsPositions MEMBER resultsPositions NOTIFY changed)
    Q_PROPERTY(QList<QSharedPointer<AppResultsFastestLap>> resultsFastestLap MEMBER resultsFastestLap NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsAverageLapTime MEMBER resultsAverageLapTime NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsNumCautionFlags MEMBER resultsNumCautionFlags NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsNumCautionLaps MEMBER resultsNumCautionLaps NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsNumLeadChanges MEMBER resultsNumLeadChanges NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsLapsComplete MEMBER resultsLapsComplete NOTIFY changed)
    Q_PROPERTY(std::int32_t resultsOfficial MEMBER resultsOfficial NOTIFY changed)


  public:
    std::int32_t sessionNum{};
    QString sessionLaps{};
    QString sessionTime{};
    std::int32_t sessionNumLapsToAvg{};
    QString sessionType{};
    QString sessionTrackRubberState{};
    QString sessionName{};
    std::int32_t sessionSkipped{};
    std::int32_t sessionRunGroupsUsed{};
    std::int32_t sessionEnforceTireCompoundChange{};
    QList<QSharedPointer<AppResultsPosition>> resultsPositions{};
    QList<QSharedPointer<AppResultsFastestLap>> resultsFastestLap{};
    std::int32_t resultsAverageLapTime{};
    std::int32_t resultsNumCautionFlags{};
    std::int32_t resultsNumCautionLaps{};
    std::int32_t resultsNumLeadChanges{};
    std::int32_t resultsLapsComplete{};
    std::int32_t resultsOfficial{};

    explicit AppSession(const IRacingTools::SDK::SessionInfo::Session &value = {}, QObject *parent = nullptr)
        : QObject(parent), sessionNum(value.sessionNum), sessionLaps(QString::fromStdString(value.sessionLaps)),
          sessionTime(QString::fromStdString(value.sessionTime)), sessionNumLapsToAvg(value.sessionNumLapsToAvg),
          sessionType(QString::fromStdString(value.sessionType)),
          sessionTrackRubberState(QString::fromStdString(value.sessionTrackRubberState)),
          sessionName(QString::fromStdString(value.sessionName)), sessionSkipped(value.sessionSkipped),
          sessionRunGroupsUsed(value.sessionRunGroupsUsed),
          sessionEnforceTireCompoundChange(value.sessionEnforceTireCompoundChange),
          resultsPositions(
              ToQList<ResultsPosition, QSharedPointer<AppResultsPosition>>(value.resultsPositions, parent)),
          resultsFastestLap(
              ToQList<ResultsFastestLap, QSharedPointer<AppResultsFastestLap>>(value.resultsFastestLap, parent)),
          resultsAverageLapTime(value.resultsAverageLapTime), resultsNumCautionFlags(value.resultsNumCautionFlags),
          resultsNumCautionLaps(value.resultsNumCautionLaps), resultsNumLeadChanges(value.resultsNumLeadChanges),
          resultsLapsComplete(value.resultsLapsComplete), resultsOfficial(value.resultsOfficial){};

  signals:
    void changed();
  };


  class AppSessionInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QList<QSharedPointer<AppSession>> sessions MEMBER sessions NOTIFY changed)


  public:
    QList<QSharedPointer<AppSession>> sessions{};

    explicit AppSessionInfo(const IRacingTools::SDK::SessionInfo::SessionInfo &value = {}, QObject *parent = nullptr)
        : QObject(parent), sessions(ToQList<Session, QSharedPointer<AppSession>>(value.sessions, parent)){};

  signals:
    void changed();
  };


  class AppSessionResult : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t position MEMBER position NOTIFY changed)
    Q_PROPERTY(std::int32_t classPosition MEMBER classPosition NOTIFY changed)
    Q_PROPERTY(std::int32_t carIdx MEMBER carIdx NOTIFY changed)
    Q_PROPERTY(std::int32_t fastestLap MEMBER fastestLap NOTIFY changed)
    Q_PROPERTY(float fastestTime MEMBER fastestTime NOTIFY changed)


  public:
    std::int32_t position{};
    std::int32_t classPosition{};
    std::int32_t carIdx{};
    std::int32_t fastestLap{};
    float fastestTime{};

    explicit AppSessionResult(const IRacingTools::SDK::SessionInfo::SessionResult &value = {},
                              QObject *parent = nullptr)
        : QObject(parent), position(value.position), classPosition(value.classPosition), carIdx(value.carIdx),
          fastestLap(value.fastestLap), fastestTime(value.fastestTime){};

  signals:
    void changed();
  };


  class AppSplitTimeInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QList<QSharedPointer<AppSector>> sectors MEMBER sectors NOTIFY changed)


  public:
    QList<QSharedPointer<AppSector>> sectors{};

    explicit AppSplitTimeInfo(const IRacingTools::SDK::SessionInfo::SplitTimeInfo &value = {},
                              QObject *parent = nullptr)
        : QObject(parent), sectors(ToQList<Sector, QSharedPointer<AppSector>>(value.sectors, parent)){};

  signals:
    void changed();
  };


  class AppTelemetryOptions : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString telemetryDiskFile MEMBER telemetryDiskFile NOTIFY changed)


  public:
    QString telemetryDiskFile{};

    explicit AppTelemetryOptions(const IRacingTools::SDK::SessionInfo::TelemetryOptions &value = {},
                                 QObject *parent = nullptr)
        : QObject(parent), telemetryDiskFile(QString::fromStdString(value.telemetryDiskFile)){};

  signals:
    void changed();
  };


  class AppTire : public QObject {
    Q_OBJECT
    Q_PROPERTY(float startingPressure MEMBER startingPressure NOTIFY changed)
    Q_PROPERTY(float lastHotPressure MEMBER lastHotPressure NOTIFY changed)
    Q_PROPERTY(float lastTempsOMI MEMBER lastTempsOMI NOTIFY changed)
    Q_PROPERTY(float treadRemaining MEMBER treadRemaining NOTIFY changed)
    Q_PROPERTY(float lastTempsIMO MEMBER lastTempsIMO NOTIFY changed)


  public:
    float startingPressure{};
    float lastHotPressure{};
    float lastTempsOMI{};
    float treadRemaining{};
    float lastTempsIMO{};

    explicit AppTire(const IRacingTools::SDK::SessionInfo::Tire &value = {}, QObject *parent = nullptr)
        : QObject(parent), startingPressure(value.startingPressure), lastHotPressure(value.lastHotPressure),
          lastTempsOMI(value.lastTempsOMI), treadRemaining(value.treadRemaining), lastTempsIMO(value.lastTempsIMO){};

  signals:
    void changed();
  };


  class AppTiresAero : public QObject {
    Q_OBJECT
    Q_PROPERTY(QSharedPointer<AppTire> leftFrontTire MEMBER leftFrontTire NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppTire> leftRearTire MEMBER leftRearTire NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppTire> rightFrontTire MEMBER rightFrontTire NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppTire> rightRearTire MEMBER rightRearTire NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppAeroSettings> aeroSettings MEMBER aeroSettings NOTIFY changed)


  public:
    QSharedPointer<AppTire> leftFrontTire{};
    QSharedPointer<AppTire> leftRearTire{};
    QSharedPointer<AppTire> rightFrontTire{};
    QSharedPointer<AppTire> rightRearTire{};
    QSharedPointer<AppAeroSettings> aeroSettings{};

    explicit AppTiresAero(const IRacingTools::SDK::SessionInfo::TiresAero &value = {}, QObject *parent = nullptr)
        : QObject(parent), leftFrontTire(QSharedPointer<AppTire>::create(value.leftFrontTire, parent)),
          leftRearTire(QSharedPointer<AppTire>::create(value.leftRearTire, parent)),
          rightFrontTire(QSharedPointer<AppTire>::create(value.rightFrontTire, parent)),
          rightRearTire(QSharedPointer<AppTire>::create(value.rightRearTire, parent)),
          aeroSettings(QSharedPointer<AppAeroSettings>::create(value.aeroSettings, parent)){};

  signals:
    void changed();
  };


  class AppWeekendOptions : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t numStarters MEMBER numStarters NOTIFY changed)
    Q_PROPERTY(QString startingGrid MEMBER startingGrid NOTIFY changed)
    Q_PROPERTY(QString qualifyScoring MEMBER qualifyScoring NOTIFY changed)
    Q_PROPERTY(QString courseCautions MEMBER courseCautions NOTIFY changed)
    Q_PROPERTY(std::int32_t standingStart MEMBER standingStart NOTIFY changed)
    Q_PROPERTY(std::int32_t shortParadeLap MEMBER shortParadeLap NOTIFY changed)
    Q_PROPERTY(QString restarts MEMBER restarts NOTIFY changed)
    Q_PROPERTY(QString weatherType MEMBER weatherType NOTIFY changed)
    Q_PROPERTY(QString skies MEMBER skies NOTIFY changed)
    Q_PROPERTY(QString windDirection MEMBER windDirection NOTIFY changed)
    Q_PROPERTY(QString windSpeed MEMBER windSpeed NOTIFY changed)
    Q_PROPERTY(QString weatherTemp MEMBER weatherTemp NOTIFY changed)
    Q_PROPERTY(QString relativeHumidity MEMBER relativeHumidity NOTIFY changed)
    Q_PROPERTY(QString fogLevel MEMBER fogLevel NOTIFY changed)
    Q_PROPERTY(QString timeOfDay MEMBER timeOfDay NOTIFY changed)
    Q_PROPERTY(QString date MEMBER date NOTIFY changed)
    Q_PROPERTY(std::int32_t earthRotationSpeedupFactor MEMBER earthRotationSpeedupFactor NOTIFY changed)
    Q_PROPERTY(std::int32_t unofficial MEMBER unofficial NOTIFY changed)
    Q_PROPERTY(QString commercialMode MEMBER commercialMode NOTIFY changed)
    Q_PROPERTY(QString nightMode MEMBER nightMode NOTIFY changed)
    Q_PROPERTY(std::int32_t isFixedSetup MEMBER isFixedSetup NOTIFY changed)
    Q_PROPERTY(QString strictLapsChecking MEMBER strictLapsChecking NOTIFY changed)
    Q_PROPERTY(std::int32_t hasOpenRegistration MEMBER hasOpenRegistration NOTIFY changed)
    Q_PROPERTY(std::int32_t hardcoreLevel MEMBER hardcoreLevel NOTIFY changed)
    Q_PROPERTY(std::int32_t numJokerLaps MEMBER numJokerLaps NOTIFY changed)
    Q_PROPERTY(std::int32_t incidentLimit MEMBER incidentLimit NOTIFY changed)
    Q_PROPERTY(std::int32_t fastRepairsLimit MEMBER fastRepairsLimit NOTIFY changed)
    Q_PROPERTY(std::int32_t greenWhiteCheckeredLimit MEMBER greenWhiteCheckeredLimit NOTIFY changed)


  public:
    std::int32_t numStarters{};
    QString startingGrid{};
    QString qualifyScoring{};
    QString courseCautions{};
    std::int32_t standingStart{};
    std::int32_t shortParadeLap{};
    QString restarts{};
    QString weatherType{};
    QString skies{};
    QString windDirection{};
    QString windSpeed{};
    QString weatherTemp{};
    QString relativeHumidity{};
    QString fogLevel{};
    QString timeOfDay{};
    QString date{};
    std::int32_t earthRotationSpeedupFactor{};
    std::int32_t unofficial{};
    QString commercialMode{};
    QString nightMode{};
    std::int32_t isFixedSetup{};
    QString strictLapsChecking{};
    std::int32_t hasOpenRegistration{};
    std::int32_t hardcoreLevel{};
    std::int32_t numJokerLaps{};
    std::int32_t incidentLimit{};
    std::int32_t fastRepairsLimit{};
    std::int32_t greenWhiteCheckeredLimit{};

    explicit AppWeekendOptions(const IRacingTools::SDK::SessionInfo::WeekendOptions &value = {},
                               QObject *parent = nullptr)
        : QObject(parent), numStarters(value.numStarters), startingGrid(QString::fromStdString(value.startingGrid)),
          qualifyScoring(QString::fromStdString(value.qualifyScoring)),
          courseCautions(QString::fromStdString(value.courseCautions)), standingStart(value.standingStart),
          shortParadeLap(value.shortParadeLap), restarts(QString::fromStdString(value.restarts)),
          weatherType(QString::fromStdString(value.weatherType)), skies(QString::fromStdString(value.skies)),
          windDirection(QString::fromStdString(value.windDirection)),
          windSpeed(QString::fromStdString(value.windSpeed)), weatherTemp(QString::fromStdString(value.weatherTemp)),
          relativeHumidity(QString::fromStdString(value.relativeHumidity)),
          fogLevel(QString::fromStdString(value.fogLevel)), timeOfDay(QString::fromStdString(value.timeOfDay)),
          date(QString::fromStdString(value.date)), earthRotationSpeedupFactor(value.earthRotationSpeedupFactor),
          unofficial(value.unofficial), commercialMode(QString::fromStdString(value.commercialMode)),
          nightMode(QString::fromStdString(value.nightMode)), isFixedSetup(value.isFixedSetup),
          strictLapsChecking(QString::fromStdString(value.strictLapsChecking)),
          hasOpenRegistration(value.hasOpenRegistration), hardcoreLevel(value.hardcoreLevel),
          numJokerLaps(value.numJokerLaps), incidentLimit(value.incidentLimit),
          fastRepairsLimit(value.fastRepairsLimit), greenWhiteCheckeredLimit(value.greenWhiteCheckeredLimit){};

  signals:
    void changed();
  };


  class AppBrakesDriveUnit : public QObject {
    Q_OBJECT
    Q_PROPERTY(QSharedPointer<AppBrakeSpec> brakeSpec MEMBER brakeSpec NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppFuel> fuel MEMBER fuel NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppEngine> engine MEMBER engine NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppGearRatio> gearRatios MEMBER gearRatios NOTIFY changed)


  public:
    QSharedPointer<AppBrakeSpec> brakeSpec{};
    QSharedPointer<AppFuel> fuel{};
    QSharedPointer<AppEngine> engine{};
    QSharedPointer<AppGearRatio> gearRatios{};

    explicit AppBrakesDriveUnit(const IRacingTools::SDK::SessionInfo::BrakesDriveUnit &value = {},
                                QObject *parent = nullptr)
        : QObject(parent), brakeSpec(QSharedPointer<AppBrakeSpec>::create(value.brakeSpec, parent)),
          fuel(QSharedPointer<AppFuel>::create(value.fuel, parent)),
          engine(QSharedPointer<AppEngine>::create(value.engine, parent)),
          gearRatios(QSharedPointer<AppGearRatio>::create(value.gearRatios, parent)){};

  signals:
    void changed();
  };


  class AppChassis : public QObject {
    Q_OBJECT
    Q_PROPERTY(QSharedPointer<AppFront> front MEMBER front NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppChassisCorner> leftFront MEMBER leftFront NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppChassisCorner> leftRear MEMBER leftRear NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppChassisCorner> rightFront MEMBER rightFront NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppChassisCorner> rightRear MEMBER rightRear NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppRear> rear MEMBER rear NOTIFY changed)


  public:
    QSharedPointer<AppFront> front{};
    QSharedPointer<AppChassisCorner> leftFront{};
    QSharedPointer<AppChassisCorner> leftRear{};
    QSharedPointer<AppChassisCorner> rightFront{};
    QSharedPointer<AppChassisCorner> rightRear{};
    QSharedPointer<AppRear> rear{};

    explicit AppChassis(const IRacingTools::SDK::SessionInfo::Chassis &value = {}, QObject *parent = nullptr)
        : QObject(parent), front(QSharedPointer<AppFront>::create(value.front, parent)),
          leftFront(QSharedPointer<AppChassisCorner>::create(value.leftFront, parent)),
          leftRear(QSharedPointer<AppChassisCorner>::create(value.leftRear, parent)),
          rightFront(QSharedPointer<AppChassisCorner>::create(value.rightFront, parent)),
          rightRear(QSharedPointer<AppChassisCorner>::create(value.rightRear, parent)),
          rear(QSharedPointer<AppRear>::create(value.rear, parent)){};

  signals:
    void changed();
  };


  class AppWeekendInfo : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString trackName MEMBER trackName NOTIFY changed)
    Q_PROPERTY(std::int32_t trackID MEMBER trackID NOTIFY changed)
    Q_PROPERTY(QString trackLength MEMBER trackLength NOTIFY changed)
    Q_PROPERTY(QString trackLengthOfficial MEMBER trackLengthOfficial NOTIFY changed)
    Q_PROPERTY(QString trackDisplayName MEMBER trackDisplayName NOTIFY changed)
    Q_PROPERTY(QString trackDisplayShortName MEMBER trackDisplayShortName NOTIFY changed)
    Q_PROPERTY(QString trackConfigName MEMBER trackConfigName NOTIFY changed)
    Q_PROPERTY(QString trackCity MEMBER trackCity NOTIFY changed)
    Q_PROPERTY(QString trackCountry MEMBER trackCountry NOTIFY changed)
    Q_PROPERTY(QString trackAltitude MEMBER trackAltitude NOTIFY changed)
    Q_PROPERTY(QString trackLatitude MEMBER trackLatitude NOTIFY changed)
    Q_PROPERTY(QString trackLongitude MEMBER trackLongitude NOTIFY changed)
    Q_PROPERTY(QString trackNorthOffset MEMBER trackNorthOffset NOTIFY changed)
    Q_PROPERTY(std::int32_t trackNumTurns MEMBER trackNumTurns NOTIFY changed)
    Q_PROPERTY(QString trackPitSpeedLimit MEMBER trackPitSpeedLimit NOTIFY changed)
    Q_PROPERTY(QString trackType MEMBER trackType NOTIFY changed)
    Q_PROPERTY(QString trackDirection MEMBER trackDirection NOTIFY changed)
    Q_PROPERTY(QString trackWeatherType MEMBER trackWeatherType NOTIFY changed)
    Q_PROPERTY(QString trackSkies MEMBER trackSkies NOTIFY changed)
    Q_PROPERTY(QString trackSurfaceTemp MEMBER trackSurfaceTemp NOTIFY changed)
    Q_PROPERTY(QString trackAirTemp MEMBER trackAirTemp NOTIFY changed)
    Q_PROPERTY(QString trackAirPressure MEMBER trackAirPressure NOTIFY changed)
    Q_PROPERTY(QString trackWindVel MEMBER trackWindVel NOTIFY changed)
    Q_PROPERTY(QString trackWindDir MEMBER trackWindDir NOTIFY changed)
    Q_PROPERTY(QString trackRelativeHumidity MEMBER trackRelativeHumidity NOTIFY changed)
    Q_PROPERTY(QString trackFogLevel MEMBER trackFogLevel NOTIFY changed)
    Q_PROPERTY(QString trackPrecipitation MEMBER trackPrecipitation NOTIFY changed)
    Q_PROPERTY(std::int32_t trackCleanup MEMBER trackCleanup NOTIFY changed)
    Q_PROPERTY(std::int32_t trackDynamicTrack MEMBER trackDynamicTrack NOTIFY changed)
    Q_PROPERTY(QString trackVersion MEMBER trackVersion NOTIFY changed)
    Q_PROPERTY(std::int32_t seriesID MEMBER seriesID NOTIFY changed)
    Q_PROPERTY(std::int32_t seasonID MEMBER seasonID NOTIFY changed)
    Q_PROPERTY(std::int32_t sessionID MEMBER sessionID NOTIFY changed)
    Q_PROPERTY(std::int32_t subSessionID MEMBER subSessionID NOTIFY changed)
    Q_PROPERTY(std::int32_t leagueID MEMBER leagueID NOTIFY changed)
    Q_PROPERTY(std::int32_t official MEMBER official NOTIFY changed)
    Q_PROPERTY(std::int32_t raceWeek MEMBER raceWeek NOTIFY changed)
    Q_PROPERTY(QString eventType MEMBER eventType NOTIFY changed)
    Q_PROPERTY(QString category MEMBER category NOTIFY changed)
    Q_PROPERTY(QString simMode MEMBER simMode NOTIFY changed)
    Q_PROPERTY(std::int32_t teamRacing MEMBER teamRacing NOTIFY changed)
    Q_PROPERTY(std::int32_t minDrivers MEMBER minDrivers NOTIFY changed)
    Q_PROPERTY(std::int32_t maxDrivers MEMBER maxDrivers NOTIFY changed)
    Q_PROPERTY(QString dCRuleSet MEMBER dCRuleSet NOTIFY changed)
    Q_PROPERTY(std::int32_t qualifierMustStartRace MEMBER qualifierMustStartRace NOTIFY changed)
    Q_PROPERTY(std::int32_t numCarClasses MEMBER numCarClasses NOTIFY changed)
    Q_PROPERTY(std::int32_t numCarTypes MEMBER numCarTypes NOTIFY changed)
    Q_PROPERTY(std::int32_t heatRacing MEMBER heatRacing NOTIFY changed)
    Q_PROPERTY(QString buildType MEMBER buildType NOTIFY changed)
    Q_PROPERTY(QString buildTarget MEMBER buildTarget NOTIFY changed)
    Q_PROPERTY(QString buildVersion MEMBER buildVersion NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppWeekendOptions> weekendOptions MEMBER weekendOptions NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppTelemetryOptions> telemetryOptions MEMBER telemetryOptions NOTIFY changed)


  public:
    QString trackName{};
    std::int32_t trackID{};
    QString trackLength{};
    QString trackLengthOfficial{};
    QString trackDisplayName{};
    QString trackDisplayShortName{};
    QString trackConfigName{};
    QString trackCity{};
    QString trackCountry{};
    QString trackAltitude{};
    QString trackLatitude{};
    QString trackLongitude{};
    QString trackNorthOffset{};
    std::int32_t trackNumTurns{};
    QString trackPitSpeedLimit{};
    QString trackType{};
    QString trackDirection{};
    QString trackWeatherType{};
    QString trackSkies{};
    QString trackSurfaceTemp{};
    QString trackAirTemp{};
    QString trackAirPressure{};
    QString trackWindVel{};
    QString trackWindDir{};
    QString trackRelativeHumidity{};
    QString trackFogLevel{};
    QString trackPrecipitation{};
    std::int32_t trackCleanup{};
    std::int32_t trackDynamicTrack{};
    QString trackVersion{};
    std::int32_t seriesID{};
    std::int32_t seasonID{};
    std::int32_t sessionID{};
    std::int32_t subSessionID{};
    std::int32_t leagueID{};
    std::int32_t official{};
    std::int32_t raceWeek{};
    QString eventType{};
    QString category{};
    QString simMode{};
    std::int32_t teamRacing{};
    std::int32_t minDrivers{};
    std::int32_t maxDrivers{};
    QString dCRuleSet{};
    std::int32_t qualifierMustStartRace{};
    std::int32_t numCarClasses{};
    std::int32_t numCarTypes{};
    std::int32_t heatRacing{};
    QString buildType{};
    QString buildTarget{};
    QString buildVersion{};
    QSharedPointer<AppWeekendOptions> weekendOptions{};
    QSharedPointer<AppTelemetryOptions> telemetryOptions{};

    explicit AppWeekendInfo(const IRacingTools::SDK::SessionInfo::WeekendInfo &value = {}, QObject *parent = nullptr)
        : QObject(parent), trackName(QString::fromStdString(value.trackName)), trackID(value.trackID),
          trackLength(QString::fromStdString(value.trackLength)),
          trackLengthOfficial(QString::fromStdString(value.trackLengthOfficial)),
          trackDisplayName(QString::fromStdString(value.trackDisplayName)),
          trackDisplayShortName(QString::fromStdString(value.trackDisplayShortName)),
          trackConfigName(QString::fromStdString(value.trackConfigName)),
          trackCity(QString::fromStdString(value.trackCity)), trackCountry(QString::fromStdString(value.trackCountry)),
          trackAltitude(QString::fromStdString(value.trackAltitude)),
          trackLatitude(QString::fromStdString(value.trackLatitude)),
          trackLongitude(QString::fromStdString(value.trackLongitude)),
          trackNorthOffset(QString::fromStdString(value.trackNorthOffset)), trackNumTurns(value.trackNumTurns),
          trackPitSpeedLimit(QString::fromStdString(value.trackPitSpeedLimit)),
          trackType(QString::fromStdString(value.trackType)),
          trackDirection(QString::fromStdString(value.trackDirection)),
          trackWeatherType(QString::fromStdString(value.trackWeatherType)),
          trackSkies(QString::fromStdString(value.trackSkies)),
          trackSurfaceTemp(QString::fromStdString(value.trackSurfaceTemp)),
          trackAirTemp(QString::fromStdString(value.trackAirTemp)),
          trackAirPressure(QString::fromStdString(value.trackAirPressure)),
          trackWindVel(QString::fromStdString(value.trackWindVel)),
          trackWindDir(QString::fromStdString(value.trackWindDir)),
          trackRelativeHumidity(QString::fromStdString(value.trackRelativeHumidity)),
          trackFogLevel(QString::fromStdString(value.trackFogLevel)),
          trackPrecipitation(QString::fromStdString(value.trackPrecipitation)), trackCleanup(value.trackCleanup),
          trackDynamicTrack(value.trackDynamicTrack), trackVersion(QString::fromStdString(value.trackVersion)),
          seriesID(value.seriesID), seasonID(value.seasonID), sessionID(value.sessionID),
          subSessionID(value.subSessionID), leagueID(value.leagueID), official(value.official),
          raceWeek(value.raceWeek), eventType(QString::fromStdString(value.eventType)),
          category(QString::fromStdString(value.category)), simMode(QString::fromStdString(value.simMode)),
          teamRacing(value.teamRacing), minDrivers(value.minDrivers), maxDrivers(value.maxDrivers),
          dCRuleSet(QString::fromStdString(value.dCRuleSet)), qualifierMustStartRace(value.qualifierMustStartRace),
          numCarClasses(value.numCarClasses), numCarTypes(value.numCarTypes), heatRacing(value.heatRacing),
          buildType(QString::fromStdString(value.buildType)), buildTarget(QString::fromStdString(value.buildTarget)),
          buildVersion(QString::fromStdString(value.buildVersion)),
          weekendOptions(QSharedPointer<AppWeekendOptions>::create(value.weekendOptions, parent)),
          telemetryOptions(QSharedPointer<AppTelemetryOptions>::create(value.telemetryOptions, parent)){};

  signals:
    void changed();
  };


  class AppCarSetup : public QObject {
    Q_OBJECT
    Q_PROPERTY(std::int32_t updateCount MEMBER updateCount NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppTiresAero> tiresAero MEMBER tiresAero NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppChassis> chassis MEMBER chassis NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppBrakesDriveUnit> brakesDriveUnit MEMBER brakesDriveUnit NOTIFY changed)


  public:
    std::int32_t updateCount{};
    QSharedPointer<AppTiresAero> tiresAero{};
    QSharedPointer<AppChassis> chassis{};
    QSharedPointer<AppBrakesDriveUnit> brakesDriveUnit{};

    explicit AppCarSetup(const IRacingTools::SDK::SessionInfo::CarSetup &value = {}, QObject *parent = nullptr)
        : QObject(parent), updateCount(value.updateCount),
          tiresAero(QSharedPointer<AppTiresAero>::create(value.tiresAero, parent)),
          chassis(QSharedPointer<AppChassis>::create(value.chassis, parent)),
          brakesDriveUnit(QSharedPointer<AppBrakesDriveUnit>::create(value.brakesDriveUnit, parent)){};

  signals:
    void changed();
  };


  class AppSessionInfoMessage : public QObject {
    Q_OBJECT
    Q_PROPERTY(QSharedPointer<AppWeekendInfo> weekendInfo MEMBER weekendInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppSessionInfo> sessionInfo MEMBER sessionInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppQualifyResultsInfo> qualifyResultsInfo MEMBER qualifyResultsInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppCameraInfo> cameraInfo MEMBER cameraInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppRadioInfo> radioInfo MEMBER radioInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppDriverInfo> driverInfo MEMBER driverInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppSplitTimeInfo> splitTimeInfo MEMBER splitTimeInfo NOTIFY changed)
    Q_PROPERTY(QSharedPointer<AppCarSetup> carSetup MEMBER carSetup NOTIFY changed)


  public:
    QSharedPointer<AppWeekendInfo> weekendInfo{};
    QSharedPointer<AppSessionInfo> sessionInfo{};
    QSharedPointer<AppQualifyResultsInfo> qualifyResultsInfo{};
    QSharedPointer<AppCameraInfo> cameraInfo{};
    QSharedPointer<AppRadioInfo> radioInfo{};
    QSharedPointer<AppDriverInfo> driverInfo{};
    QSharedPointer<AppSplitTimeInfo> splitTimeInfo{};
    QSharedPointer<AppCarSetup> carSetup{};

    explicit AppSessionInfoMessage(const IRacingTools::SDK::SessionInfo::SessionInfoMessage &value = {},
                                   QObject *parent = nullptr)
        : QObject(parent), weekendInfo(QSharedPointer<AppWeekendInfo>::create(value.weekendInfo, parent)),
          sessionInfo(QSharedPointer<AppSessionInfo>::create(value.sessionInfo, parent)),
          qualifyResultsInfo(QSharedPointer<AppQualifyResultsInfo>::create(value.qualifyResultsInfo, parent)),
          cameraInfo(QSharedPointer<AppCameraInfo>::create(value.cameraInfo, parent)),
          radioInfo(QSharedPointer<AppRadioInfo>::create(value.radioInfo, parent)),
          driverInfo(QSharedPointer<AppDriverInfo>::create(value.driverInfo, parent)),
          splitTimeInfo(QSharedPointer<AppSplitTimeInfo>::create(value.splitTimeInfo, parent)),
          carSetup(QSharedPointer<AppCarSetup>::create(value.carSetup, parent)){};

  signals:
    void changed();
  };


}// namespace IRacingTools::App::Models
