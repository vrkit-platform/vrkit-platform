
```json
{
    "$schema": "http://json-schema.org/draft-06/schema#",
    "$ref": "#/definitions/Root",
    "definitions": {
        "Root": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "WeekendInfo": {
                    "$ref": "#/definitions/WeekendInfo"
                },
                "SessionInfo": {
                    "$ref": "#/definitions/SessionInfo"
                },
                "QualifyResultsInfo": {
                    "$ref": "#/definitions/QualifyResultsInfo"
                },
                "CameraInfo": {
                    "$ref": "#/definitions/CameraInfo"
                },
                "RadioInfo": {
                    "$ref": "#/definitions/RadioInfo"
                },
                "DriverInfo": {
                    "$ref": "#/definitions/DriverInfo"
                },
                "SplitTimeInfo": {
                    "$ref": "#/definitions/SplitTimeInfo"
                },
                "CarSetup": {
                    "$ref": "#/definitions/CarSetup"
                }
            },
            "required": [
                "CameraInfo",
                "CarSetup",
                "DriverInfo",
                "QualifyResultsInfo",
                "RadioInfo",
                "SessionInfo",
                "SplitTimeInfo",
                "WeekendInfo"
            ],
            "title": "Welcome8"
        },
        "CameraInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Groups": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Group"
                    }
                }
            },
            "required": [
                "Groups"
            ],
            "title": "CameraInfo"
        },
        "Group": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "GroupNum": {
                    "type": "integer"
                },
                "GroupName": {
                    "type": "string"
                },
                "Cameras": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Camera"
                    }
                },
                "IsScenic": {
                    "type": "boolean"
                }
            },
            "required": [
                "Cameras",
                "GroupName",
                "GroupNum"
            ],
            "title": "Group"
        },
        "Camera": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "CameraNum": {
                    "type": "integer"
                },
                "CameraName": {
                    "type": "string"
                }
            },
            "required": [
                "CameraName",
                "CameraNum"
            ],
            "title": "Camera"
        },
        "CarSetup": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "UpdateCount": {
                    "type": "integer"
                },
                "TiresAero": {
                    "$ref": "#/definitions/TiresAero"
                },
                "Chassis": {
                    "$ref": "#/definitions/Chassis"
                },
                "BrakesDriveUnit": {
                    "$ref": "#/definitions/BrakesDriveUnit"
                }
            },
            "required": [
                "BrakesDriveUnit",
                "Chassis",
                "TiresAero",
                "UpdateCount"
            ],
            "title": "CarSetup"
        },
        "BrakesDriveUnit": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "BrakeSpec": {
                    "$ref": "#/definitions/BrakeSpec"
                },
                "Fuel": {
                    "$ref": "#/definitions/Fuel"
                },
                "Engine": {
                    "$ref": "#/definitions/Engine"
                },
                "GearRatios": {
                    "$ref": "#/definitions/GearRatios"
                }
            },
            "required": [
                "BrakeSpec",
                "Engine",
                "Fuel",
                "GearRatios"
            ],
            "title": "BrakesDriveUnit"
        },
        "BrakeSpec": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "PadCompound": {
                    "type": "string"
                },
                "BrakePressureBias": {
                    "type": "string"
                }
            },
            "required": [
                "BrakePressureBias",
                "PadCompound"
            ],
            "title": "BrakeSpec"
        },
        "Engine": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "BoostLevel_Cal": {
                    "type": "integer"
                },
                "ThrottleShape_Tps": {
                    "type": "integer"
                }
            },
            "required": [
                "BoostLevel_Cal",
                "ThrottleShape_Tps"
            ],
            "title": "Engine"
        },
        "Fuel": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "FuelLevel": {
                    "type": "string"
                }
            },
            "required": [
                "FuelLevel"
            ],
            "title": "Fuel"
        },
        "GearRatios": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "GearStack": {
                    "type": "string"
                },
                "SpeedInFirst": {
                    "type": "string"
                },
                "SpeedInSecond": {
                    "type": "string"
                },
                "SpeedInThird": {
                    "type": "string"
                },
                "SpeedInFourth": {
                    "type": "string"
                },
                "SpeedInFifth": {
                    "type": "string"
                },
                "SpeedInSixth": {
                    "type": "string"
                }
            },
            "required": [
                "GearStack",
                "SpeedInFifth",
                "SpeedInFirst",
                "SpeedInFourth",
                "SpeedInSecond",
                "SpeedInSixth",
                "SpeedInThird"
            ],
            "title": "GearRatios"
        },
        "Chassis": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Front": {
                    "$ref": "#/definitions/Front"
                },
                "LeftFront": {
                    "$ref": "#/definitions/LeftFront"
                },
                "LeftRear": {
                    "$ref": "#/definitions/LeftFront"
                },
                "RightFront": {
                    "$ref": "#/definitions/LeftFront"
                },
                "RightRear": {
                    "$ref": "#/definitions/LeftFront"
                },
                "Rear": {
                    "$ref": "#/definitions/Rear"
                }
            },
            "required": [
                "Front",
                "LeftFront",
                "LeftRear",
                "Rear",
                "RightFront",
                "RightRear"
            ],
            "title": "Chassis"
        },
        "Front": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "ArbSize": {
                    "type": "string"
                },
                "ToeIn": {
                    "type": "string"
                },
                "SteeringRatio": {
                    "type": "integer"
                },
                "DisplayPage": {
                    "type": "string"
                }
            },
            "required": [
                "ArbSize",
                "DisplayPage",
                "SteeringRatio",
                "ToeIn"
            ],
            "title": "Front"
        },
        "LeftFront": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "CornerWeight": {
                    "type": "string"
                },
                "RideHeight": {
                    "type": "string"
                },
                "ShockDefl": {
                    "type": "string"
                },
                "SpringPerchOffset": {
                    "type": "string"
                },
                "SpringRate": {
                    "type": "string"
                },
                "LsCompDamping": {
                    "type": "string"
                },
                "HsCompDamping": {
                    "type": "string"
                },
                "HsRbdDamping": {
                    "type": "string"
                },
                "Camber": {
                    "type": "string"
                },
                "SpringDefl": {
                    "type": "string"
                },
                "ToeIn": {
                    "type": "string"
                }
            },
            "required": [
                "Camber",
                "CornerWeight",
                "HsCompDamping",
                "HsRbdDamping",
                "LsCompDamping",
                "RideHeight",
                "ShockDefl",
                "SpringPerchOffset",
                "SpringRate"
            ],
            "title": "LeftFront"
        },
        "Rear": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "ArbSize": {
                    "type": "string"
                },
                "CrossWeight": {
                    "type": "string"
                }
            },
            "required": [
                "ArbSize",
                "CrossWeight"
            ],
            "title": "Rear"
        },
        "TiresAero": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "LeftFrontTire": {
                    "$ref": "#/definitions/Tire"
                },
                "LeftRearTire": {
                    "$ref": "#/definitions/Tire"
                },
                "RightFrontTire": {
                    "$ref": "#/definitions/Tire"
                },
                "RightRearTire": {
                    "$ref": "#/definitions/Tire"
                },
                "AeroSettings": {
                    "$ref": "#/definitions/AeroSettings"
                }
            },
            "required": [
                "AeroSettings",
                "LeftFrontTire",
                "LeftRearTire",
                "RightFrontTire",
                "RightRearTire"
            ],
            "title": "TiresAero"
        },
        "AeroSettings": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "RearWingSetting": {
                    "type": "string"
                },
                "OfDivePlanes": {
                    "type": "integer"
                },
                "WingGurneySetting": {
                    "type": "string"
                }
            },
            "required": [
                "OfDivePlanes",
                "RearWingSetting",
                "WingGurneySetting"
            ],
            "title": "AeroSettings"
        },
        "Tire": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "StartingPressure": {
                    "type": "string"
                },
                "LastHotPressure": {
                    "type": "string"
                },
                "LastTempsOMI": {
                    "type": "string"
                },
                "TreadRemaining": {
                    "type": "string"
                },
                "LastTempsIMO": {
                    "type": "string"
                }
            },
            "required": [
                "LastHotPressure",
                "StartingPressure",
                "TreadRemaining"
            ],
            "title": "Tire"
        },
        "DriverInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "DriverCarIdx": {
                    "type": "integer"
                },
                "DriverUserID": {
                    "type": "integer"
                },
                "PaceCarIdx": {
                    "type": "integer"
                },
                "DriverHeadPosX": {
                    "type": "number"
                },
                "DriverHeadPosY": {
                    "type": "number"
                },
                "DriverHeadPosZ": {
                    "type": "number"
                },
                "DriverCarIsElectric": {
                    "type": "integer"
                },
                "DriverCarIdleRPM": {
                    "type": "integer"
                },
                "DriverCarRedLine": {
                    "type": "integer"
                },
                "DriverCarEngCylinderCount": {
                    "type": "integer"
                },
                "DriverCarFuelKgPerLtr": {
                    "type": "number"
                },
                "DriverCarFuelMaxLtr": {
                    "type": "integer"
                },
                "DriverCarMaxFuelPct": {
                    "type": "number"
                },
                "DriverCarGearNumForward": {
                    "type": "integer"
                },
                "DriverCarGearNeutral": {
                    "type": "integer"
                },
                "DriverCarGearReverse": {
                    "type": "integer"
                },
                "DriverCarSLFirstRPM": {
                    "type": "integer"
                },
                "DriverCarSLShiftRPM": {
                    "type": "integer"
                },
                "DriverCarSLLastRPM": {
                    "type": "integer"
                },
                "DriverCarSLBlinkRPM": {
                    "type": "integer"
                },
                "DriverCarVersion": {
                    "type": "string"
                },
                "DriverPitTrkPct": {
                    "type": "number"
                },
                "DriverCarEstLapTime": {
                    "type": "number"
                },
                "DriverSetupName": {
                    "type": "string"
                },
                "DriverSetupIsModified": {
                    "type": "integer"
                },
                "DriverSetupLoadTypeName": {
                    "type": "string"
                },
                "DriverSetupPassedTech": {
                    "type": "integer"
                },
                "DriverIncidentCount": {
                    "type": "integer"
                },
                "Drivers": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Driver"
                    }
                }
            },
            "required": [
                "DriverCarEngCylinderCount",
                "DriverCarEstLapTime",
                "DriverCarFuelKgPerLtr",
                "DriverCarFuelMaxLtr",
                "DriverCarGearNeutral",
                "DriverCarGearNumForward",
                "DriverCarGearReverse",
                "DriverCarIdleRPM",
                "DriverCarIdx",
                "DriverCarIsElectric",
                "DriverCarMaxFuelPct",
                "DriverCarRedLine",
                "DriverCarSLBlinkRPM",
                "DriverCarSLFirstRPM",
                "DriverCarSLLastRPM",
                "DriverCarSLShiftRPM",
                "DriverCarVersion",
                "DriverHeadPosX",
                "DriverHeadPosY",
                "DriverHeadPosZ",
                "DriverIncidentCount",
                "DriverPitTrkPct",
                "DriverSetupIsModified",
                "DriverSetupLoadTypeName",
                "DriverSetupName",
                "DriverSetupPassedTech",
                "DriverUserID",
                "Drivers",
                "PaceCarIdx"
            ],
            "title": "DriverInfo"
        },
        "Driver": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "CarIdx": {
                    "type": "integer"
                },
                "UserName": {
                    "type": "string"
                },
                "AbbrevName": {
                    "anyOf": [
                        {
                            "type": "null"
                        },
                        {
                            "type": "string"
                        }
                    ]
                },
                "Initials": {
                    "anyOf": [
                        {
                            "type": "null"
                        },
                        {
                            "type": "string"
                        }
                    ]
                },
                "UserID": {
                    "type": "integer"
                },
                "TeamID": {
                    "type": "integer"
                },
                "TeamName": {
                    "type": "string"
                },
                "CarNumber": {
                    "type": "string"
                },
                "CarNumberRaw": {
                    "type": "integer"
                },
                "CarPath": {
                    "$ref": "#/definitions/CarPath"
                },
                "CarClassID": {
                    "type": "integer"
                },
                "CarID": {
                    "type": "integer"
                },
                "CarIsPaceCar": {
                    "type": "integer"
                },
                "CarIsAI": {
                    "type": "integer"
                },
                "CarIsElectric": {
                    "type": "integer"
                },
                "CarScreenName": {
                    "$ref": "#/definitions/Car"
                },
                "CarScreenNameShort": {
                    "$ref": "#/definitions/Car"
                },
                "CarClassShortName": {
                    "anyOf": [
                        {
                            "$ref": "#/definitions/Car"
                        },
                        {
                            "type": "null"
                        }
                    ]
                },
                "CarClassRelSpeed": {
                    "type": "integer"
                },
                "CarClassLicenseLevel": {
                    "type": "integer"
                },
                "CarClassMaxFuelPct": {
                    "$ref": "#/definitions/CarClassMaxFuelPct"
                },
                "CarClassWeightPenalty": {
                    "$ref": "#/definitions/CarClassWeightPenalty"
                },
                "CarClassPowerAdjust": {
                    "$ref": "#/definitions/CarClassPowerAdjust"
                },
                "CarClassDryTireSetLimit": {
                    "$ref": "#/definitions/TrackFogLevel"
                },
                "CarClassColor": {
                    "type": "integer"
                },
                "CarClassEstLapTime": {
                    "type": "number"
                },
                "IRating": {
                    "type": "integer"
                },
                "LicLevel": {
                    "type": "integer"
                },
                "LicSubLevel": {
                    "type": "integer"
                },
                "LicString": {
                    "type": "string"
                },
                "LicColor": {
                    "type": "integer"
                },
                "IsSpectator": {
                    "type": "integer"
                },
                "CarDesignStr": {
                    "type": "string"
                },
                "HelmetDesignStr": {
                    "type": "string"
                },
                "SuitDesignStr": {
                    "type": "string"
                },
                "BodyType": {
                    "type": "integer"
                },
                "FaceType": {
                    "type": "integer"
                },
                "HelmetType": {
                    "type": "integer"
                },
                "CarNumberDesignStr": {
                    "$ref": "#/definitions/CarNumberDesignStr"
                },
                "CarSponsor_1": {
                    "type": "integer"
                },
                "CarSponsor_2": {
                    "type": "integer"
                },
                "ClubName": {
                    "type": "string"
                },
                "ClubID": {
                    "type": "integer"
                },
                "DivisionName": {
                    "type": "string"
                },
                "DivisionID": {
                    "type": "integer"
                },
                "CurDriverIncidentCount": {
                    "type": "integer"
                },
                "TeamIncidentCount": {
                    "type": "integer"
                }
            },
            "required": [
                "AbbrevName",
                "BodyType",
                "CarClassColor",
                "CarClassDryTireSetLimit",
                "CarClassEstLapTime",
                "CarClassID",
                "CarClassLicenseLevel",
                "CarClassMaxFuelPct",
                "CarClassPowerAdjust",
                "CarClassRelSpeed",
                "CarClassShortName",
                "CarClassWeightPenalty",
                "CarDesignStr",
                "CarID",
                "CarIdx",
                "CarIsAI",
                "CarIsElectric",
                "CarIsPaceCar",
                "CarNumber",
                "CarNumberDesignStr",
                "CarNumberRaw",
                "CarPath",
                "CarScreenName",
                "CarScreenNameShort",
                "CarSponsor_1",
                "CarSponsor_2",
                "ClubID",
                "ClubName",
                "CurDriverIncidentCount",
                "DivisionID",
                "DivisionName",
                "FaceType",
                "HelmetDesignStr",
                "HelmetType",
                "IRating",
                "Initials",
                "IsSpectator",
                "LicColor",
                "LicLevel",
                "LicString",
                "LicSubLevel",
                "SuitDesignStr",
                "TeamID",
                "TeamIncidentCount",
                "TeamName",
                "UserID",
                "UserName"
            ],
            "title": "Driver"
        },
        "QualifyResultsInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Results": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Result"
                    }
                }
            },
            "required": [
                "Results"
            ],
            "title": "QualifyResultsInfo"
        },
        "Result": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Position": {
                    "type": "integer"
                },
                "ClassPosition": {
                    "type": "integer"
                },
                "CarIdx": {
                    "type": "integer"
                },
                "FastestLap": {
                    "type": "integer"
                },
                "FastestTime": {
                    "type": "number"
                }
            },
            "required": [
                "CarIdx",
                "ClassPosition",
                "FastestLap",
                "FastestTime",
                "Position"
            ],
            "title": "Result"
        },
        "RadioInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "SelectedRadioNum": {
                    "type": "integer"
                },
                "Radios": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Radio"
                    }
                }
            },
            "required": [
                "Radios",
                "SelectedRadioNum"
            ],
            "title": "RadioInfo"
        },
        "Radio": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "RadioNum": {
                    "type": "integer"
                },
                "HopCount": {
                    "type": "integer"
                },
                "NumFrequencies": {
                    "type": "integer"
                },
                "TunedToFrequencyNum": {
                    "type": "integer"
                },
                "ScanningIsOn": {
                    "type": "integer"
                },
                "Frequencies": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Frequency"
                    }
                }
            },
            "required": [
                "Frequencies",
                "HopCount",
                "NumFrequencies",
                "RadioNum",
                "ScanningIsOn",
                "TunedToFrequencyNum"
            ],
            "title": "Radio"
        },
        "Frequency": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "FrequencyNum": {
                    "type": "integer"
                },
                "FrequencyName": {
                    "type": "string"
                },
                "Priority": {
                    "type": "integer"
                },
                "CarIdx": {
                    "type": "integer"
                },
                "EntryIdx": {
                    "type": "integer"
                },
                "ClubID": {
                    "type": "integer"
                },
                "CanScan": {
                    "type": "integer"
                },
                "CanSquawk": {
                    "type": "integer"
                },
                "Muted": {
                    "type": "integer"
                },
                "IsMutable": {
                    "type": "integer"
                },
                "IsDeletable": {
                    "type": "integer"
                }
            },
            "required": [
                "CanScan",
                "CanSquawk",
                "CarIdx",
                "ClubID",
                "EntryIdx",
                "FrequencyName",
                "FrequencyNum",
                "IsDeletable",
                "IsMutable",
                "Muted",
                "Priority"
            ],
            "title": "Frequency"
        },
        "SessionInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Sessions": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Session"
                    }
                }
            },
            "required": [
                "Sessions"
            ],
            "title": "SessionInfo"
        },
        "Session": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "SessionNum": {
                    "type": "integer"
                },
                "SessionLaps": {
                    "$ref": "#/definitions/SessionLaps"
                },
                "SessionTime": {
                    "type": "string"
                },
                "SessionNumLapsToAvg": {
                    "type": "integer"
                },
                "SessionType": {
                    "type": "string"
                },
                "SessionTrackRubberState": {
                    "type": "string"
                },
                "SessionName": {
                    "type": "string"
                },
                "SessionSubType": {
                    "type": "null"
                },
                "SessionSkipped": {
                    "type": "integer"
                },
                "SessionRunGroupsUsed": {
                    "type": "integer"
                },
                "SessionEnforceTireCompoundChange": {
                    "type": "integer"
                },
                "ResultsPositions": {
                    "anyOf": [
                        {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/ResultsPosition"
                            }
                        },
                        {
                            "type": "null"
                        }
                    ]
                },
                "ResultsFastestLap": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/ResultsFastestLap"
                    }
                },
                "ResultsAverageLapTime": {
                    "type": "integer"
                },
                "ResultsNumCautionFlags": {
                    "type": "integer"
                },
                "ResultsNumCautionLaps": {
                    "type": "integer"
                },
                "ResultsNumLeadChanges": {
                    "type": "integer"
                },
                "ResultsLapsComplete": {
                    "type": "integer"
                },
                "ResultsOfficial": {
                    "type": "integer"
                }
            },
            "required": [
                "ResultsAverageLapTime",
                "ResultsFastestLap",
                "ResultsLapsComplete",
                "ResultsNumCautionFlags",
                "ResultsNumCautionLaps",
                "ResultsNumLeadChanges",
                "ResultsOfficial",
                "ResultsPositions",
                "SessionEnforceTireCompoundChange",
                "SessionLaps",
                "SessionName",
                "SessionNum",
                "SessionNumLapsToAvg",
                "SessionRunGroupsUsed",
                "SessionSkipped",
                "SessionSubType",
                "SessionTime",
                "SessionTrackRubberState",
                "SessionType"
            ],
            "title": "Session"
        },
        "ResultsFastestLap": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "CarIdx": {
                    "type": "integer"
                },
                "FastestLap": {
                    "type": "integer"
                },
                "FastestTime": {
                    "type": "number"
                }
            },
            "required": [
                "CarIdx",
                "FastestLap",
                "FastestTime"
            ],
            "title": "ResultsFastestLap"
        },
        "ResultsPosition": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Position": {
                    "type": "integer"
                },
                "ClassPosition": {
                    "type": "integer"
                },
                "CarIdx": {
                    "type": "integer"
                },
                "Lap": {
                    "type": "integer"
                },
                "Time": {
                    "type": "number"
                },
                "FastestLap": {
                    "type": "integer"
                },
                "FastestTime": {
                    "type": "number"
                },
                "LastTime": {
                    "type": "number"
                },
                "LapsLed": {
                    "type": "integer"
                },
                "LapsComplete": {
                    "type": "integer"
                },
                "JokerLapsComplete": {
                    "type": "integer"
                },
                "LapsDriven": {
                    "type": "number"
                },
                "Incidents": {
                    "type": "integer"
                },
                "ReasonOutId": {
                    "type": "integer"
                },
                "ReasonOutStr": {
                    "$ref": "#/definitions/ReasonOutStr"
                }
            },
            "required": [
                "CarIdx",
                "ClassPosition",
                "FastestLap",
                "FastestTime",
                "Incidents",
                "JokerLapsComplete",
                "Lap",
                "LapsComplete",
                "LapsDriven",
                "LapsLed",
                "LastTime",
                "Position",
                "ReasonOutId",
                "ReasonOutStr",
                "Time"
            ],
            "title": "ResultsPosition"
        },
        "SplitTimeInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "Sectors": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Sector"
                    }
                }
            },
            "required": [
                "Sectors"
            ],
            "title": "SplitTimeInfo"
        },
        "Sector": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "SectorNum": {
                    "type": "integer"
                },
                "SectorStartPct": {
                    "type": "number"
                }
            },
            "required": [
                "SectorNum",
                "SectorStartPct"
            ],
            "title": "Sector"
        },
        "WeekendInfo": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "TrackName": {
                    "type": "string"
                },
                "TrackID": {
                    "type": "integer"
                },
                "TrackLength": {
                    "type": "string"
                },
                "TrackLengthOfficial": {
                    "type": "string"
                },
                "TrackDisplayName": {
                    "type": "string"
                },
                "TrackDisplayShortName": {
                    "type": "string"
                },
                "TrackConfigName": {
                    "type": "string"
                },
                "TrackCity": {
                    "type": "string"
                },
                "TrackCountry": {
                    "type": "string"
                },
                "TrackAltitude": {
                    "type": "string"
                },
                "TrackLatitude": {
                    "type": "string"
                },
                "TrackLongitude": {
                    "type": "string"
                },
                "TrackNorthOffset": {
                    "type": "string"
                },
                "TrackNumTurns": {
                    "type": "integer"
                },
                "TrackPitSpeedLimit": {
                    "type": "string"
                },
                "TrackType": {
                    "type": "string"
                },
                "TrackDirection": {
                    "type": "string"
                },
                "TrackWeatherType": {
                    "type": "string"
                },
                "TrackSkies": {
                    "type": "string"
                },
                "TrackSurfaceTemp": {
                    "type": "string"
                },
                "TrackAirTemp": {
                    "type": "string"
                },
                "TrackAirPressure": {
                    "type": "string"
                },
                "TrackWindVel": {
                    "type": "string"
                },
                "TrackWindDir": {
                    "type": "string"
                },
                "TrackRelativeHumidity": {
                    "type": "string"
                },
                "TrackFogLevel": {
                    "$ref": "#/definitions/TrackFogLevel"
                },
                "TrackPrecipitation": {
                    "$ref": "#/definitions/TrackFogLevel"
                },
                "TrackCleanup": {
                    "type": "integer"
                },
                "TrackDynamicTrack": {
                    "type": "integer"
                },
                "TrackVersion": {
                    "type": "string"
                },
                "SeriesID": {
                    "type": "integer"
                },
                "SeasonID": {
                    "type": "integer"
                },
                "SessionID": {
                    "type": "integer"
                },
                "SubSessionID": {
                    "type": "integer"
                },
                "LeagueID": {
                    "type": "integer"
                },
                "Official": {
                    "type": "integer"
                },
                "RaceWeek": {
                    "type": "integer"
                },
                "EventType": {
                    "type": "string"
                },
                "Category": {
                    "type": "string"
                },
                "SimMode": {
                    "type": "string"
                },
                "TeamRacing": {
                    "type": "integer"
                },
                "MinDrivers": {
                    "type": "integer"
                },
                "MaxDrivers": {
                    "type": "integer"
                },
                "DCRuleSet": {
                    "type": "string"
                },
                "QualifierMustStartRace": {
                    "type": "integer"
                },
                "NumCarClasses": {
                    "type": "integer"
                },
                "NumCarTypes": {
                    "type": "integer"
                },
                "HeatRacing": {
                    "type": "integer"
                },
                "BuildType": {
                    "type": "string"
                },
                "BuildTarget": {
                    "type": "string"
                },
                "BuildVersion": {
                    "type": "string"
                },
                "WeekendOptions": {
                    "$ref": "#/definitions/WeekendOptions"
                },
                "TelemetryOptions": {
                    "$ref": "#/definitions/TelemetryOptions"
                }
            },
            "required": [
                "BuildTarget",
                "BuildType",
                "BuildVersion",
                "Category",
                "DCRuleSet",
                "EventType",
                "HeatRacing",
                "LeagueID",
                "MaxDrivers",
                "MinDrivers",
                "NumCarClasses",
                "NumCarTypes",
                "Official",
                "QualifierMustStartRace",
                "RaceWeek",
                "SeasonID",
                "SeriesID",
                "SessionID",
                "SimMode",
                "SubSessionID",
                "TeamRacing",
                "TelemetryOptions",
                "TrackAirPressure",
                "TrackAirTemp",
                "TrackAltitude",
                "TrackCity",
                "TrackCleanup",
                "TrackConfigName",
                "TrackCountry",
                "TrackDirection",
                "TrackDisplayName",
                "TrackDisplayShortName",
                "TrackDynamicTrack",
                "TrackFogLevel",
                "TrackID",
                "TrackLatitude",
                "TrackLength",
                "TrackLengthOfficial",
                "TrackLongitude",
                "TrackName",
                "TrackNorthOffset",
                "TrackNumTurns",
                "TrackPitSpeedLimit",
                "TrackPrecipitation",
                "TrackRelativeHumidity",
                "TrackSkies",
                "TrackSurfaceTemp",
                "TrackType",
                "TrackVersion",
                "TrackWeatherType",
                "TrackWindDir",
                "TrackWindVel",
                "WeekendOptions"
            ],
            "title": "WeekendInfo"
        },
        "TelemetryOptions": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "TelemetryDiskFile": {
                    "type": "string"
                }
            },
            "required": [
                "TelemetryDiskFile"
            ],
            "title": "TelemetryOptions"
        },
        "WeekendOptions": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "NumStarters": {
                    "type": "integer"
                },
                "StartingGrid": {
                    "type": "string"
                },
                "QualifyScoring": {
                    "type": "string"
                },
                "CourseCautions": {
                    "type": "string"
                },
                "StandingStart": {
                    "type": "integer"
                },
                "ShortParadeLap": {
                    "type": "integer"
                },
                "Restarts": {
                    "type": "string"
                },
                "WeatherType": {
                    "type": "string"
                },
                "Skies": {
                    "type": "string"
                },
                "WindDirection": {
                    "type": "string"
                },
                "WindSpeed": {
                    "type": "string"
                },
                "WeatherTemp": {
                    "type": "string"
                },
                "RelativeHumidity": {
                    "type": "string"
                },
                "FogLevel": {
                    "$ref": "#/definitions/TrackFogLevel"
                },
                "TimeOfDay": {
                    "type": "string"
                },
                "Date": {
                    "type": "string",
                    "format": "date-time"
                },
                "EarthRotationSpeedupFactor": {
                    "type": "integer"
                },
                "Unofficial": {
                    "type": "integer"
                },
                "CommercialMode": {
                    "type": "string"
                },
                "NightMode": {
                    "type": "string"
                },
                "IsFixedSetup": {
                    "type": "integer"
                },
                "StrictLapsChecking": {
                    "type": "string"
                },
                "HasOpenRegistration": {
                    "type": "integer"
                },
                "HardcoreLevel": {
                    "type": "integer"
                },
                "NumJokerLaps": {
                    "type": "integer"
                },
                "IncidentLimit": {
                    "type": "integer"
                },
                "FastRepairsLimit": {
                    "type": "integer"
                },
                "GreenWhiteCheckeredLimit": {
                    "type": "integer"
                }
            },
            "required": [
                "CommercialMode",
                "CourseCautions",
                "Date",
                "EarthRotationSpeedupFactor",
                "FastRepairsLimit",
                "FogLevel",
                "GreenWhiteCheckeredLimit",
                "HardcoreLevel",
                "HasOpenRegistration",
                "IncidentLimit",
                "IsFixedSetup",
                "NightMode",
                "NumJokerLaps",
                "NumStarters",
                "QualifyScoring",
                "RelativeHumidity",
                "Restarts",
                "ShortParadeLap",
                "Skies",
                "StandingStart",
                "StartingGrid",
                "StrictLapsChecking",
                "TimeOfDay",
                "Unofficial",
                "WeatherTemp",
                "WeatherType",
                "WindDirection",
                "WindSpeed"
            ],
            "title": "WeekendOptions"
        },
        "SessionLaps": {
            "anyOf": [
                {
                    "type": "integer"
                },
                {
                    "type": "string"
                }
            ],
            "title": "SessionLaps"
        },
        "TrackFogLevel": {
            "type": "string",
            "enum": [
                "0 %"
            ],
            "title": "TrackFogLevel"
        },
        "CarClassMaxFuelPct": {
            "type": "string",
            "enum": [
                "1.000 %",
                "0.660 %"
            ],
            "title": "CarClassMaxFuelPct"
        },
        "CarClassPowerAdjust": {
            "type": "string",
            "enum": [
                "0.000 %"
            ],
            "title": "CarClassPowerAdjust"
        },
        "Car": {
            "type": "string",
            "enum": [
                "Radical SR10",
                "safety pcporsche911cup"
            ],
            "title": "Car"
        },
        "CarClassWeightPenalty": {
            "type": "string",
            "enum": [
                "0.000 kg"
            ],
            "title": "CarClassWeightPenalty"
        },
        "CarNumberDesignStr": {
            "type": "string",
            "enum": [
                "0,0,ffffff,ffffff,ffffff",
                "0,0,ffffff,777777,000000"
            ],
            "title": "CarNumberDesignStr"
        },
        "CarPath": {
            "type": "string",
            "enum": [
                "safety pcporsche911cup",
                "radicalsr10"
            ],
            "title": "CarPath"
        },
        "ReasonOutStr": {
            "type": "string",
            "enum": [
                "Running"
            ],
            "title": "ReasonOutStr"
        }
    }
}

```

```yaml

---
WeekendInfo:
 TrackName: sebring international
 TrackID: 95
 TrackLength: 5.79 km
 TrackLengthOfficial: 6.02 km
 TrackDisplayName: Sebring International Raceway
 TrackDisplayShortName: Sebring
 TrackConfigName: International
 TrackCity: Sebring
 TrackCountry: USA
 TrackAltitude: 18.79 m
 TrackLatitude: 27.450203 m
 TrackLongitude: -81.353694 m
 TrackNorthOffset: 1.5656 rad
 TrackNumTurns: 17
 TrackPitSpeedLimit: 72.00 kph
 TrackType: road course
 TrackDirection: neutral
 TrackWeatherType: Classic Specified / Dynamic Sky
 TrackSkies: Partly Cloudy
 TrackSurfaceTemp: 39.94 C
 TrackAirTemp: 25.69 C
 TrackAirPressure: 29.86 Hg
 TrackWindVel: 0.89 m/s
 TrackWindDir: 0.00 rad
 TrackRelativeHumidity: 55 %
 TrackFogLevel: 0 %
 TrackPrecipitation: 0 %
 TrackCleanup: 1
 TrackDynamicTrack: 1
 TrackVersion: 2024.01.18.02
 SeriesID: 74
 SeasonID: 4586
 SessionID: 228679168
 SubSessionID: 66511093
 LeagueID: 0
 Official: 1
 RaceWeek: 7
 EventType: Race
 Category: Road
 SimMode: full
 TeamRacing: 0
 MinDrivers: 0
 MaxDrivers: 1
 DCRuleSet: None
 QualifierMustStartRace: 0
 NumCarClasses: 1
 NumCarTypes: 2
 HeatRacing: 0
 BuildType: Release
 BuildTarget: Members
 BuildVersion: 2024.01.23.01
 WeekendOptions:
  NumStarters: 24
  StartingGrid: 2x2 inline pole on left
  QualifyScoring: best lap
  CourseCautions: local
  StandingStart: 1
  ShortParadeLap: 0
  Restarts: double file lapped cars behind
  WeatherType: Classic Specified / Dynamic Sky
  Skies: Partly Cloudy
  WindDirection: N
  WindSpeed: 3.22 km/h
  WeatherTemp: 25.56 C
  RelativeHumidity: 55 %
  FogLevel: 0 %
  TimeOfDay: 8:40 am
  Date: 2024-02-15
  EarthRotationSpeedupFactor: 1
  Unofficial: 0
  CommercialMode: consumer
  NightMode: variable
  IsFixedSetup: 0
  StrictLapsChecking: default
  HasOpenRegistration: 0
  HardcoreLevel: 1
  NumJokerLaps: 0
  IncidentLimit: 25
  FastRepairsLimit: 0
  GreenWhiteCheckeredLimit: 0
 TelemetryOptions:
  TelemetryDiskFile: ""

SessionInfo:
 Sessions:
 - SessionNum: 0
   SessionLaps: unlimited
   SessionTime: 180.0000 sec
   SessionNumLapsToAvg: 0
   SessionType: Practice
   SessionTrackRubberState: moderately high usage
   SessionName: PRACTICE
   SessionSubType: 
   SessionSkipped: 0
   SessionRunGroupsUsed: 0
   SessionEnforceTireCompoundChange: 0
   ResultsPositions:
   - Position: 1
     ClassPosition: 0
     CarIdx: 1
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.915
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 2
     ClassPosition: 1
     CarIdx: 2
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.988
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 3
     ClassPosition: 2
     CarIdx: 3
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.498
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 4
     ClassPosition: 3
     CarIdx: 4
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 1.018
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 5
     ClassPosition: 4
     CarIdx: 5
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.897
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 6
     ClassPosition: 5
     CarIdx: 6
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.479
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 7
     ClassPosition: 6
     CarIdx: 7
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.000
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 8
     ClassPosition: 7
     CarIdx: 8
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.874
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 9
     ClassPosition: 8
     CarIdx: 9
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.489
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 10
     ClassPosition: 9
     CarIdx: 10
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.774
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 11
     ClassPosition: 10
     CarIdx: 11
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.200
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 12
     ClassPosition: 11
     CarIdx: 12
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.964
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 13
     ClassPosition: 12
     CarIdx: 13
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.437
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 14
     ClassPosition: 13
     CarIdx: 14
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.863
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 15
     ClassPosition: 14
     CarIdx: 15
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.679
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 16
     ClassPosition: 15
     CarIdx: 16
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.383
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 17
     ClassPosition: 16
     CarIdx: 17
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.759
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 18
     ClassPosition: 17
     CarIdx: 18
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.607
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 19
     ClassPosition: 18
     CarIdx: 19
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.697
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 20
     ClassPosition: 19
     CarIdx: 20
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.000
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 21
     ClassPosition: 20
     CarIdx: 21
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.692
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 22
     ClassPosition: 21
     CarIdx: 22
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.515
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   ResultsFastestLap:
   - CarIdx: 255
     FastestLap: 0
     FastestTime: -1.0000
   ResultsAverageLapTime: -1.0000
   ResultsNumCautionFlags: 0
   ResultsNumCautionLaps: 0
   ResultsNumLeadChanges: 0
   ResultsLapsComplete: -1
   ResultsOfficial: 1
 - SessionNum: 1
   SessionLaps: 2
   SessionTime: 480.0000 sec
   SessionNumLapsToAvg: 0
   SessionType: Lone Qualify
   SessionTrackRubberState: carry over
   SessionName: QUALIFY
   SessionSubType: 
   SessionSkipped: 0
   SessionRunGroupsUsed: 0
   SessionEnforceTireCompoundChange: 0
   ResultsPositions:
   - Position: 1
     ClassPosition: 0
     CarIdx: 2
     Lap: 2
     Time: 114.9987
     FastestLap: 2
     FastestTime: 114.9987
     LastTime: 114.9987
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.034
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 2
     ClassPosition: 1
     CarIdx: 1
     Lap: 2
     Time: 115.4660
     FastestLap: 2
     FastestTime: 115.4660
     LastTime: 115.4660
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.030
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 3
     ClassPosition: 2
     CarIdx: 5
     Lap: 2
     Time: 116.1218
     FastestLap: 2
     FastestTime: 116.1218
     LastTime: 116.1218
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.052
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 4
     ClassPosition: 3
     CarIdx: 3
     Lap: 2
     Time: 116.1479
     FastestLap: 2
     FastestTime: 116.1479
     LastTime: 116.1479
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.873
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 5
     ClassPosition: 4
     CarIdx: 4
     Lap: 2
     Time: 116.1532
     FastestLap: 2
     FastestTime: 116.1532
     LastTime: 116.1532
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.976
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 6
     ClassPosition: 5
     CarIdx: 6
     Lap: 2
     Time: 116.8463
     FastestLap: 2
     FastestTime: 116.8463
     LastTime: 116.8463
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.030
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 7
     ClassPosition: 6
     CarIdx: 15
     Lap: 2
     Time: 117.0251
     FastestLap: 2
     FastestTime: 117.0251
     LastTime: 117.0251
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.778
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 8
     ClassPosition: 7
     CarIdx: 12
     Lap: 2
     Time: 117.2454
     FastestLap: 2
     FastestTime: 117.2454
     LastTime: 117.2454
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.732
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 9
     ClassPosition: 8
     CarIdx: 10
     Lap: 2
     Time: 117.4225
     FastestLap: 2
     FastestTime: 117.4225
     LastTime: 117.4225
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.340
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 10
     ClassPosition: 9
     CarIdx: 8
     Lap: 2
     Time: 117.5760
     FastestLap: 2
     FastestTime: 117.5760
     LastTime: 117.5760
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.052
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 11
     ClassPosition: 10
     CarIdx: 18
     Lap: 1
     Time: 117.7598
     FastestLap: 1
     FastestTime: 117.7598
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 2.992
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 12
     ClassPosition: 11
     CarIdx: 14
     Lap: 1
     Time: 117.9473
     FastestLap: 1
     FastestTime: 117.9473
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.338
     Incidents: 4
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 13
     ClassPosition: 12
     CarIdx: 11
     Lap: 1
     Time: 117.9924
     FastestLap: 1
     FastestTime: 117.9924
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.002
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 14
     ClassPosition: 13
     CarIdx: 9
     Lap: 2
     Time: 118.0960
     FastestLap: 2
     FastestTime: 118.0960
     LastTime: 118.0960
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.043
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 15
     ClassPosition: 14
     CarIdx: 20
     Lap: 1
     Time: 118.1414
     FastestLap: 1
     FastestTime: 118.1414
     LastTime: 118.1414
     LapsLed: 0
     LapsComplete: 1
     JokerLapsComplete: 0
     LapsDriven: 2.142
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 16
     ClassPosition: 15
     CarIdx: 16
     Lap: 1
     Time: 118.5561
     FastestLap: 1
     FastestTime: 118.5561
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.880
     Incidents: 1
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 17
     ClassPosition: 16
     CarIdx: 7
     Lap: 2
     Time: 118.8344
     FastestLap: 2
     FastestTime: 118.8344
     LastTime: 118.8344
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.014
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 18
     ClassPosition: 17
     CarIdx: 13
     Lap: 2
     Time: 120.3170
     FastestLap: 2
     FastestTime: 120.3170
     LastTime: 120.3170
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.002
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 19
     ClassPosition: 18
     CarIdx: 22
     Lap: 2
     Time: 120.9526
     FastestLap: 2
     FastestTime: 120.9526
     LastTime: 120.9526
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 2.999
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 20
     ClassPosition: 19
     CarIdx: 21
     Lap: 2
     Time: 121.0574
     FastestLap: 2
     FastestTime: 121.0574
     LastTime: 121.0574
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.023
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 21
     ClassPosition: 20
     CarIdx: 17
     Lap: 2
     Time: 122.6212
     FastestLap: 2
     FastestTime: 122.6212
     LastTime: 122.6212
     LapsLed: 0
     LapsComplete: 2
     JokerLapsComplete: 0
     LapsDriven: 3.627
     Incidents: 2
     ReasonOutId: 0
     ReasonOutStr: Running
   - Position: 22
     ClassPosition: 21
     CarIdx: 19
     Lap: 0
     Time: -1.0000
     FastestLap: -1
     FastestTime: -1.0000
     LastTime: -1.0000
     LapsLed: 0
     LapsComplete: 0
     JokerLapsComplete: 0
     LapsDriven: 0.000
     Incidents: 0
     ReasonOutId: 0
     ReasonOutStr: Running
   ResultsFastestLap:
   - CarIdx: 2
     FastestLap: 2
     FastestTime: 114.9987
   ResultsAverageLapTime: -1.0000
   ResultsNumCautionFlags: 0
   ResultsNumCautionLaps: 0
   ResultsNumLeadChanges: 0
   ResultsLapsComplete: -1
   ResultsOfficial: 1
 - SessionNum: 2
   SessionLaps: 13
   SessionTime: 14400.0000 sec
   SessionNumLapsToAvg: 0
   SessionType: Race
   SessionTrackRubberState: carry over
   SessionName: RACE
   SessionSubType: 
   SessionSkipped: 0
   SessionRunGroupsUsed: 0
   SessionEnforceTireCompoundChange: 0
   ResultsPositions:
   ResultsFastestLap:
   - CarIdx: 255
     FastestLap: 0
     FastestTime: -1.0000
   ResultsAverageLapTime: -1.0000
   ResultsNumCautionFlags: 0
   ResultsNumCautionLaps: 0
   ResultsNumLeadChanges: 0
   ResultsLapsComplete: -1
   ResultsOfficial: 0

QualifyResultsInfo:
 Results:
 - Position: 0
   ClassPosition: 0
   CarIdx: 2
   FastestLap: 2
   FastestTime: 114.9987
 - Position: 1
   ClassPosition: 1
   CarIdx: 1
   FastestLap: 2
   FastestTime: 115.4660
 - Position: 2
   ClassPosition: 2
   CarIdx: 5
   FastestLap: 2
   FastestTime: 116.1218
 - Position: 3
   ClassPosition: 3
   CarIdx: 3
   FastestLap: 2
   FastestTime: 116.1479
 - Position: 4
   ClassPosition: 4
   CarIdx: 4
   FastestLap: 2
   FastestTime: 116.1532
 - Position: 5
   ClassPosition: 5
   CarIdx: 6
   FastestLap: 2
   FastestTime: 116.8463
 - Position: 6
   ClassPosition: 6
   CarIdx: 15
   FastestLap: 2
   FastestTime: 117.0251
 - Position: 7
   ClassPosition: 7
   CarIdx: 12
   FastestLap: 2
   FastestTime: 117.2454
 - Position: 8
   ClassPosition: 8
   CarIdx: 10
   FastestLap: 2
   FastestTime: 117.4225
 - Position: 9
   ClassPosition: 9
   CarIdx: 8
   FastestLap: 2
   FastestTime: 117.5760
 - Position: 10
   ClassPosition: 10
   CarIdx: 18
   FastestLap: 1
   FastestTime: 117.7598
 - Position: 11
   ClassPosition: 11
   CarIdx: 14
   FastestLap: 1
   FastestTime: 117.9473
 - Position: 12
   ClassPosition: 12
   CarIdx: 11
   FastestLap: 1
   FastestTime: 117.9924
 - Position: 13
   ClassPosition: 13
   CarIdx: 9
   FastestLap: 2
   FastestTime: 118.0960
 - Position: 14
   ClassPosition: 14
   CarIdx: 20
   FastestLap: 1
   FastestTime: 118.1414
 - Position: 15
   ClassPosition: 15
   CarIdx: 16
   FastestLap: 1
   FastestTime: 118.5561
 - Position: 16
   ClassPosition: 16
   CarIdx: 7
   FastestLap: 2
   FastestTime: 118.8344
 - Position: 17
   ClassPosition: 17
   CarIdx: 13
   FastestLap: 2
   FastestTime: 120.3170
 - Position: 18
   ClassPosition: 18
   CarIdx: 22
   FastestLap: 2
   FastestTime: 120.9526
 - Position: 19
   ClassPosition: 19
   CarIdx: 21
   FastestLap: 2
   FastestTime: 121.0574
 - Position: 20
   ClassPosition: 20
   CarIdx: 17
   FastestLap: 2
   FastestTime: 122.6212
 - Position: 21
   ClassPosition: 21
   CarIdx: 19
   FastestLap: 0
   FastestTime: -1.0000

CameraInfo:
 Groups:
 - GroupNum: 1
   GroupName: Nose
   Cameras:
   - CameraNum: 1
     CameraName: CamNose
 - GroupNum: 2
   GroupName: Gearbox
   Cameras:
   - CameraNum: 1
     CameraName: CamGearbox
 - GroupNum: 3
   GroupName: Roll Bar
   Cameras:
   - CameraNum: 1
     CameraName: CamRoll Bar
 - GroupNum: 4
   GroupName: LF Susp
   Cameras:
   - CameraNum: 1
     CameraName: CamLF Susp
 - GroupNum: 5
   GroupName: LR Susp
   Cameras:
   - CameraNum: 1
     CameraName: CamLR Susp
 - GroupNum: 6
   GroupName: Gyro
   Cameras:
   - CameraNum: 1
     CameraName: CamGyro
 - GroupNum: 7
   GroupName: RF Susp
   Cameras:
   - CameraNum: 1
     CameraName: CamRF Susp
 - GroupNum: 8
   GroupName: RR Susp
   Cameras:
   - CameraNum: 1
     CameraName: CamRR Susp
 - GroupNum: 9
   GroupName: Cockpit
   Cameras:
   - CameraNum: 1
     CameraName: CamCockpit
 - GroupNum: 10
   GroupName: Scenic
   IsScenic: true
   Cameras:
   - CameraNum: 1
     CameraName: Scenic_01
   - CameraNum: 2
     CameraName: Scenic_02
   - CameraNum: 3
     CameraName: Scenic_03
   - CameraNum: 4
     CameraName: Scenic_04
   - CameraNum: 5
     CameraName: Scenic_09
   - CameraNum: 6
     CameraName: Scenic_10
   - CameraNum: 7
     CameraName: Scenic_05
   - CameraNum: 8
     CameraName: Scenic_11
   - CameraNum: 9
     CameraName: Scenic_08
   - CameraNum: 10
     CameraName: Scenic_06
   - CameraNum: 11
     CameraName: Scenic_07
 - GroupNum: 11
   GroupName: TV1
   Cameras:
   - CameraNum: 1
     CameraName: CamTV1_00
   - CameraNum: 2
     CameraName: CamTV1_01b
   - CameraNum: 3
     CameraName: CamTV1_01
   - CameraNum: 4
     CameraName: CamTV1_02
   - CameraNum: 5
     CameraName: CamTV1_02b
   - CameraNum: 6
     CameraName: CamTV1_03b
   - CameraNum: 7
     CameraName: CamTV1_03
   - CameraNum: 8
     CameraName: CamTV1_04
   - CameraNum: 9
     CameraName: CamTV1_04b
   - CameraNum: 10
     CameraName: CamTV1_05
   - CameraNum: 11
     CameraName: CamTV1_06
   - CameraNum: 12
     CameraName: CamTV1_06b
   - CameraNum: 13
     CameraName: CamTV1_07
   - CameraNum: 14
     CameraName: CamTV1_09
   - CameraNum: 15
     CameraName: CamTV1_11
   - CameraNum: 16
     CameraName: CamTV1_11b
   - CameraNum: 17
     CameraName: CamTV1_10
   - CameraNum: 18
     CameraName: CamTV1_13
   - CameraNum: 19
     CameraName: CamTV1_12
   - CameraNum: 20
     CameraName: CamTV1_14
   - CameraNum: 21
     CameraName: CamTV1_14b
   - CameraNum: 22
     CameraName: CamTV1_07b
   - CameraNum: 23
     CameraName: CamTV1_09b
   - CameraNum: 24
     CameraName: CamTV1_08
   - CameraNum: 25
     CameraName: CamTV1_05b
   - CameraNum: 26
     CameraName: CamTV1_10b
 - GroupNum: 12
   GroupName: TV2
   Cameras:
   - CameraNum: 1
     CameraName: CamTV2_18
   - CameraNum: 2
     CameraName: CamTV2_17
   - CameraNum: 3
     CameraName: CamTV2_17b
   - CameraNum: 4
     CameraName: CamTV2_08
   - CameraNum: 5
     CameraName: CamTV2_01
   - CameraNum: 6
     CameraName: CamTV2_00
   - CameraNum: 7
     CameraName: CamTV2_00b
   - CameraNum: 8
     CameraName: CamTV2_03b
   - CameraNum: 9
     CameraName: CamTV2_05
   - CameraNum: 10
     CameraName: CamTV2_05b
   - CameraNum: 11
     CameraName: CamTV2_04
   - CameraNum: 12
     CameraName: CamTV2_04b
   - CameraNum: 13
     CameraName: CamTV2_06b
   - CameraNum: 14
     CameraName: CamTV2_06
   - CameraNum: 15
     CameraName: CamTV2_09
   - CameraNum: 16
     CameraName: CamTV2_09b
   - CameraNum: 17
     CameraName: CamTV2_11
   - CameraNum: 18
     CameraName: CamTV2_11b
   - CameraNum: 19
     CameraName: CamTV2_12
   - CameraNum: 20
     CameraName: CamTV2_14
   - CameraNum: 21
     CameraName: CamTV2_15
   - CameraNum: 22
     CameraName: CamTV2_16
   - CameraNum: 23
     CameraName: CamTV2_16b
   - CameraNum: 24
     CameraName: CamTV2_10
   - CameraNum: 25
     CameraName: CamTV2_10b
   - CameraNum: 26
     CameraName: CamTV2_13
   - CameraNum: 27
     CameraName: CamTV2_01b
   - CameraNum: 28
     CameraName: CamTV2_02
   - CameraNum: 29
     CameraName: CamTV2_03
   - CameraNum: 30
     CameraName: CamTV2_12b
   - CameraNum: 31
     CameraName: CamTV2_07
   - CameraNum: 32
     CameraName: CamTV2_13b
 - GroupNum: 13
   GroupName: TV3
   Cameras:
   - CameraNum: 1
     CameraName: CamTV3_00b
   - CameraNum: 2
     CameraName: CamTV3_00
   - CameraNum: 3
     CameraName: CamTV3_01
   - CameraNum: 4
     CameraName: CamTV3_02
   - CameraNum: 5
     CameraName: CamTV3_03
   - CameraNum: 6
     CameraName: CamTV3_06
   - CameraNum: 7
     CameraName: CamTV3_07
   - CameraNum: 8
     CameraName: CamTV3_08
   - CameraNum: 9
     CameraName: CamTV3_13
   - CameraNum: 10
     CameraName: CamTV3_14
   - CameraNum: 11
     CameraName: CamTV3_15
   - CameraNum: 12
     CameraName: CamTV3_04
   - CameraNum: 13
     CameraName: CamTV3_09
   - CameraNum: 14
     CameraName: CamTV3_11
   - CameraNum: 15
     CameraName: CamTV3_12
   - CameraNum: 16
     CameraName: CamTV3_01b
   - CameraNum: 17
     CameraName: CamTV3_10
   - CameraNum: 18
     CameraName: CamTV3_05
 - GroupNum: 14
   GroupName: TV Static
   Cameras:
   - CameraNum: 1
     CameraName: CamTV4_00
   - CameraNum: 2
     CameraName: CamTV4_01
   - CameraNum: 3
     CameraName: CamTV4_01b
   - CameraNum: 4
     CameraName: CamTV4_01c
   - CameraNum: 5
     CameraName: CamTV4_02
   - CameraNum: 6
     CameraName: CamTV4_03
   - CameraNum: 7
     CameraName: CamTV4_04
   - CameraNum: 8
     CameraName: CamTV4_05
   - CameraNum: 9
     CameraName: CamTV4_07
   - CameraNum: 10
     CameraName: CamTV4_06
   - CameraNum: 11
     CameraName: CamTV4_09
   - CameraNum: 12
     CameraName: CamTV4_08
   - CameraNum: 13
     CameraName: CamTV4_11
   - CameraNum: 14
     CameraName: CamTV4_12
   - CameraNum: 15
     CameraName: CamTV4_13
   - CameraNum: 16
     CameraName: CamTV4_14
   - CameraNum: 17
     CameraName: CamTV4_15
   - CameraNum: 18
     CameraName: CamTV4_16
   - CameraNum: 19
     CameraName: CamTV4_17
   - CameraNum: 20
     CameraName: CamTV4_18
   - CameraNum: 21
     CameraName: CamTV4_19
   - CameraNum: 22
     CameraName: CamTV4_20
   - CameraNum: 23
     CameraName: CamTV4_21
   - CameraNum: 24
     CameraName: CamTV4_23
   - CameraNum: 25
     CameraName: CamTV4_24
 - GroupNum: 15
   GroupName: TV Mixed
   Cameras:
   - CameraNum: 1
     CameraName: CamTV2_11
   - CameraNum: 2
     CameraName: CamTV3_15
   - CameraNum: 3
     CameraName: CamTV1_00
   - CameraNum: 4
     CameraName: CamTV1_01
   - CameraNum: 5
     CameraName: CamTV1_01b
   - CameraNum: 6
     CameraName: CamTV1_02
   - CameraNum: 7
     CameraName: CamTV1_02b
   - CameraNum: 8
     CameraName: CamTV1_03
   - CameraNum: 9
     CameraName: CamTV1_03b
   - CameraNum: 10
     CameraName: CamTV1_04
   - CameraNum: 11
     CameraName: CamTV1_04b
   - CameraNum: 12
     CameraName: CamTV1_05
   - CameraNum: 13
     CameraName: CamTV2_07
   - CameraNum: 14
     CameraName: CamTV1_06
   - CameraNum: 15
     CameraName: CamTV1_06b
   - CameraNum: 16
     CameraName: CamTV1_07
   - CameraNum: 17
     CameraName: CamTV1_07b
   - CameraNum: 18
     CameraName: CamTV1_08
   - CameraNum: 19
     CameraName: CamTV1_09
   - CameraNum: 20
     CameraName: CamTV1_09b
   - CameraNum: 21
     CameraName: CamTV1_10
   - CameraNum: 22
     CameraName: CamTV2_13b
   - CameraNum: 23
     CameraName: CamTV1_11
   - CameraNum: 24
     CameraName: CamTV1_11b
   - CameraNum: 25
     CameraName: CamTV1_12
   - CameraNum: 26
     CameraName: CamTV1_13
   - CameraNum: 27
     CameraName: CamTV1_14
   - CameraNum: 28
     CameraName: CamTV1_14b
   - CameraNum: 29
     CameraName: CamTV2_00
   - CameraNum: 30
     CameraName: CamTV2_00b
   - CameraNum: 31
     CameraName: CamTV2_01
   - CameraNum: 32
     CameraName: CamTV2_01b
   - CameraNum: 33
     CameraName: CamTV2_02
   - CameraNum: 34
     CameraName: CamTV2_03
   - CameraNum: 35
     CameraName: CamTV2_03b
   - CameraNum: 36
     CameraName: CamTV2_04
   - CameraNum: 37
     CameraName: CamTV2_04b
   - CameraNum: 38
     CameraName: CamTV2_05
   - CameraNum: 39
     CameraName: CamTV2_05b
   - CameraNum: 40
     CameraName: CamTV2_06
   - CameraNum: 41
     CameraName: CamTV2_06b
   - CameraNum: 42
     CameraName: CamTV1_05b
   - CameraNum: 43
     CameraName: CamTV3_05
   - CameraNum: 44
     CameraName: CamTV2_09
   - CameraNum: 45
     CameraName: CamTV2_09b
   - CameraNum: 46
     CameraName: CamTV2_10
   - CameraNum: 47
     CameraName: CamTV2_10b
   - CameraNum: 48
     CameraName: CamTV2_11b
   - CameraNum: 49
     CameraName: CamTV2_12
   - CameraNum: 50
     CameraName: CamTV2_12b
   - CameraNum: 51
     CameraName: CamTV2_13
   - CameraNum: 52
     CameraName: CamTV1_10b
   - CameraNum: 53
     CameraName: CamTV2_14
   - CameraNum: 54
     CameraName: CamTV2_15
   - CameraNum: 55
     CameraName: CamTV2_16
   - CameraNum: 56
     CameraName: CamTV2_16b
   - CameraNum: 57
     CameraName: CamTV2_17
   - CameraNum: 58
     CameraName: CamTV2_17b
   - CameraNum: 59
     CameraName: CamTV2_18
   - CameraNum: 60
     CameraName: CamTV3_00
   - CameraNum: 61
     CameraName: CamTV3_00b
   - CameraNum: 62
     CameraName: CamTV3_01
   - CameraNum: 63
     CameraName: CamTV3_01b
   - CameraNum: 64
     CameraName: CamTV3_02
   - CameraNum: 65
     CameraName: CamTV3_03
   - CameraNum: 66
     CameraName: CamTV3_04
   - CameraNum: 67
     CameraName: CamTV3_06
   - CameraNum: 68
     CameraName: CamTV3_07
   - CameraNum: 69
     CameraName: CamTV3_08
   - CameraNum: 70
     CameraName: CamTV3_09
   - CameraNum: 71
     CameraName: CamTV3_10
   - CameraNum: 72
     CameraName: CamTV3_12
   - CameraNum: 73
     CameraName: CamTV3_13
   - CameraNum: 74
     CameraName: CamTV3_14
   - CameraNum: 75
     CameraName: CamTV3_11
   - CameraNum: 76
     CameraName: CamTV2_08
   - CameraNum: 77
     CameraName: CamRoll Bar
 - GroupNum: 16
   GroupName: Pit Lane
   Cameras:
   - CameraNum: 1
     CameraName: CamPit Lane 02
   - CameraNum: 2
     CameraName: CamPit Lane 03
   - CameraNum: 3
     CameraName: CamPit Lane 01
   - CameraNum: 4
     CameraName: CamPit Lane 00
 - GroupNum: 17
   GroupName: Pit Lane 2
   Cameras:
   - CameraNum: 1
     CameraName: CamPit Lane 04
 - GroupNum: 18
   GroupName: Blimp
   Cameras:
   - CameraNum: 1
     CameraName: CamBlimp
 - GroupNum: 19
   GroupName: Chopper
   Cameras:
   - CameraNum: 1
     CameraName: CamChopper
 - GroupNum: 20
   GroupName: Chase
   Cameras:
   - CameraNum: 1
     CameraName: CamChase
 - GroupNum: 21
   GroupName: Far Chase
   Cameras:
   - CameraNum: 1
     CameraName: CamFar Chase
 - GroupNum: 22
   GroupName: Rear Chase
   Cameras:
   - CameraNum: 1
     CameraName: CamRear Chase0

RadioInfo:
 SelectedRadioNum: 0
 Radios:
 - RadioNum: 0
   HopCount: 2
   NumFrequencies: 5
   TunedToFrequencyNum: 0
   ScanningIsOn: 1
   Frequencies:
   - FrequencyNum: 0
     FrequencyName: "@SPECTATORS"
     Priority: 0
     CarIdx: -1
     EntryIdx: -1
     ClubID: 0
     CanScan: 1
     CanSquawk: 1
     Muted: 0
     IsMutable: 1
     IsDeletable: 0
   - FrequencyNum: 1
     FrequencyName: "@DRIVERS"
     Priority: 15
     CarIdx: -1
     EntryIdx: -1
     ClubID: 0
     CanScan: 1
     CanSquawk: 0
     Muted: 0
     IsMutable: 1
     IsDeletable: 0
   - FrequencyNum: 2
     FrequencyName: "@ALLTEAMS"
     Priority: 12
     CarIdx: -1
     EntryIdx: -1
     ClubID: 0
     CanScan: 1
     CanSquawk: 0
     Muted: 0
     IsMutable: 1
     IsDeletable: 0
   - FrequencyNum: 3
     FrequencyName: "@RACECONTROL"
     Priority: 80
     CarIdx: -1
     EntryIdx: -1
     ClubID: 0
     CanScan: 1
     CanSquawk: 0
     Muted: 0
     IsMutable: 0
     IsDeletable: 0
   - FrequencyNum: 4
     FrequencyName: "@PRIVATE"
     Priority: 70
     CarIdx: -1
     EntryIdx: 24
     ClubID: 0
     CanScan: 1
     CanSquawk: 1
     Muted: 0
     IsMutable: 0
     IsDeletable: 0

DriverInfo:
 DriverCarIdx: 63
 DriverUserID: 102958
 PaceCarIdx: 0
 DriverHeadPosX: -0.019
 DriverHeadPosY: 0.224
 DriverHeadPosZ: 0.506
 DriverCarIsElectric: 0
 DriverCarIdleRPM: 1200.000
 DriverCarRedLine: 7250.000
 DriverCarEngCylinderCount: 4
 DriverCarFuelKgPerLtr: 0.750
 DriverCarFuelMaxLtr: 77.000
 DriverCarMaxFuelPct: 0.660
 DriverCarGearNumForward: 6
 DriverCarGearNeutral: 1
 DriverCarGearReverse: 1
 DriverCarSLFirstRPM: 5600.000
 DriverCarSLShiftRPM: 6800.000
 DriverCarSLLastRPM: 7000.000
 DriverCarSLBlinkRPM: 7100.000
 DriverCarVersion: 2023.11.22.02
 DriverPitTrkPct: 0.037756
 DriverCarEstLapTime: 111.8651
 DriverSetupName: sebring.sto
 DriverSetupIsModified: 0
 DriverSetupLoadTypeName: user
 DriverSetupPassedTech: 1
 DriverIncidentCount: 0
 Drivers:
 - CarIdx: 0
   UserName: Pace Car
   AbbrevName: 
   Initials: 
   UserID: -1
   TeamID: 0
   TeamName: Pace Car
   CarNumber: "0"
   CarNumberRaw: 0
   CarPath: safety pcporsche911cup
   CarClassID: 11
   CarID: 108
   CarIsPaceCar: 1
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: safety pcporsche911cup
   CarScreenNameShort: safety pcporsche911cup
   CarClassShortName: 
   CarClassRelSpeed: 0
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 1.000 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 122.3444
   IRating: 0
   LicLevel: 1
   LicSubLevel: 0
   LicString: R 0.00
   LicColor: 0xffffff
   IsSpectator: 0
   CarDesignStr: 0,ffffff,ffffff,ffffff
   HelmetDesignStr: 0,ffffff,ffffff,ffffff
   SuitDesignStr: 0,ffffff,ffffff,ffffff
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,ffffff,ffffff
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: -none-
   ClubID: 0
   DivisionName: Division 1
   DivisionID: 0
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 1
   UserName: Myron Ianny
   AbbrevName: Ianny, M
   Initials: MI
   UserID: 640155
   TeamID: 0
   TeamName: Myron Ianny
   CarNumber: "1"
   CarNumberRaw: 1
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 4996
   LicLevel: 19
   LicSubLevel: 342
   LicString: A 3.42
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 13,800000,000000,8f8f8f.cc8600
   HelmetDesignStr: 22,b0afaf,a80000,000000
   SuitDesignStr: 2,a80000,000000,ffffff
   BodyType: 0
   FaceType: 1
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 123
   CarSponsor_2: 175
   ClubName: Italy
   ClubID: 41
   DivisionName: Division 1
   DivisionID: 0
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 2
   UserName: Arnaud Genest
   AbbrevName: Genest, A
   Initials: AG
   UserID: 344959
   TeamID: 0
   TeamName: Arnaud Genest
   CarNumber: "2"
   CarNumberRaw: 2
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 4618
   LicLevel: 19
   LicSubLevel: 364
   LicString: A 3.64
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 23,302c21,ffffff,f52d49
   HelmetDesignStr: 62,302c21,ffffff,f52d49
   SuitDesignStr: 1,342d2d,b90e0e,ffffff
   BodyType: 1
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Canada
   ClubID: 15
   DivisionName: Division 1
   DivisionID: 0
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 3
   UserName: Thomas Boeing
   AbbrevName: Boeing, T
   Initials: TB
   UserID: 587062
   TeamID: 0
   TeamName: Thomas Boeing
   CarNumber: "3"
   CarNumberRaw: 3
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 3524
   LicLevel: 20
   LicSubLevel: 423
   LicString: A 4.23
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 3,ffffff,111111,f06e34
   HelmetDesignStr: 53,ffffff,111111,bf0b0b
   SuitDesignStr: 1,ffffff,111111,f06e34
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: DE-AT-CH
   ClubID: 42
   DivisionName: Division 2
   DivisionID: 1
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 4
   UserName: Jorge Gonzaga
   AbbrevName: Gonzaga, J
   Initials: JG
   UserID: 742181
   TeamID: 0
   TeamName: Jorge Gonzaga
   CarNumber: "4"
   CarNumberRaw: 4
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 3364
   LicLevel: 20
   LicSubLevel: 433
   LicString: A 4.33
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 13,000000,faff00,ff0000,c7c7c7
   HelmetDesignStr: 24,cd0000,eaff00,188c00
   SuitDesignStr: 23,6a0000,185200,d0ed1c
   BodyType: 1
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 145
   CarSponsor_2: 139
   ClubName: UK and I
   ClubID: 36
   DivisionName: Division 2
   DivisionID: 1
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 5
   UserName: Brett Barker
   AbbrevName: Barker, B
   Initials: BB
   UserID: 16148
   TeamID: 0
   TeamName: Brett Barker
   CarNumber: "5"
   CarNumberRaw: 5
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 2774
   LicLevel: 20
   LicSubLevel: 499
   LicString: A 4.99
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 23,e7e3e3,3a539f,b12b2b
   HelmetDesignStr: 36,e7e3e3,3a539f,b12b2b
   SuitDesignStr: 8,ffffff,3f61c7,cd1919
   BodyType: 0
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Australia/NZ
   ClubID: 34
   DivisionName: Division 2
   DivisionID: 1
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 6
   UserName: Nick Phillips
   AbbrevName: Phillips, N
   Initials: NP
   UserID: 15573
   TeamID: 0
   TeamName: Nick Phillips
   CarNumber: "6"
   CarNumberRaw: 6
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 2702
   LicLevel: 18
   LicSubLevel: 247
   LicString: A 2.47
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 1,ff0000,00ff00,0000ff
   HelmetDesignStr: 65,000000,e19b0b,ffffff
   SuitDesignStr: 25,000000,e19b0b,ffffff
   BodyType: 0
   FaceType: 6
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: UK and I
   ClubID: 36
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 7
   UserName: Jon Frum
   AbbrevName: Frum, J
   Initials: JF
   UserID: 432090
   TeamID: 0
   TeamName: Jon Frum
   CarNumber: "7"
   CarNumberRaw: 7
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1927
   LicLevel: 19
   LicSubLevel: 350
   LicString: A 3.50
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 4,ff9a00,fcc600,ff0000
   HelmetDesignStr: 35,f79900,f7f7f7,ff0000
   SuitDesignStr: 15,ffa500,ffffff,ff0000
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 1
   CarSponsor_2: 187
   ClubName: Florida
   ClubID: 22
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 8
   UserName: Ramon Aguayo Domene
   AbbrevName: Domene, R
   Initials: RD
   UserID: 320522
   TeamID: 0
   TeamName: Ramon Aguayo Domene
   CarNumber: "8"
   CarNumberRaw: 8
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1845
   LicLevel: 15
   LicSubLevel: 317
   LicString: B 3.17
   LicColor: 0x00c702
   IsSpectator: 0
   CarDesignStr: 23,5fdd0d,0a0909,060606
   HelmetDesignStr: 57,5fdd0d,0a0909,060606
   SuitDesignStr: 1,060505,26ef04,141313
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Iberia
   ClubID: 38
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 9
   UserName: Martin B Jones
   AbbrevName: Jones, M
   Initials: MJ
   UserID: 54807
   TeamID: 0
   TeamName: Martin B Jones
   CarNumber: "9"
   CarNumberRaw: 9
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1734
   LicLevel: 15
   LicSubLevel: 365
   LicString: B 3.65
   LicColor: 0x00c702
   IsSpectator: 0
   CarDesignStr: 11,000000,0f0537,feb405
   HelmetDesignStr: 3,000000,0f0537,feb405
   SuitDesignStr: 1,000000,fdbc24,291b00
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: UK and I
   ClubID: 36
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 10
   UserName: Harry Davis Iii2
   AbbrevName: Iii2, H
   Initials: HI
   UserID: 861410
   TeamID: 0
   TeamName: Harry Davis Iii2
   CarNumber: "10"
   CarNumberRaw: 10
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1658
   LicLevel: 10
   LicSubLevel: 296
   LicString: C 2.96
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 6,111111,ffee47,0300c2
   HelmetDesignStr: 1,111111,ffee47,0300c2
   SuitDesignStr: 1,111111,ffee47,0300c2
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: West
   ClubID: 32
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 11
   UserName: James Burke6
   AbbrevName: Burke6, J
   Initials: JB
   UserID: 336540
   TeamID: 0
   TeamName: James Burke6
   CarNumber: "11"
   CarNumberRaw: 11
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1610
   LicLevel: 14
   LicSubLevel: 205
   LicString: B 2.05
   LicColor: 0x00c702
   IsSpectator: 0
   CarDesignStr: 2,ff0000,00ff00,0000ff
   HelmetDesignStr: 0,f4be57,f4be57,f4be57
   SuitDesignStr: 13,0022ef,ff880a,e0001b
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Midwest
   ClubID: 29
   DivisionName: Division 3
   DivisionID: 2
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 12
   UserName: Liam Fruzyna
   AbbrevName: Fruzyna, L
   Initials: LF
   UserID: 610481
   TeamID: 0
   TeamName: Liam Fruzyna
   CarNumber: "12"
   CarNumberRaw: 12
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1410
   LicLevel: 18
   LicSubLevel: 235
   LicString: A 2.35
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 11,000000,aa00cc,000000
   HelmetDesignStr: 36,000000,aa00cc,000000
   SuitDesignStr: 22,000000,aa00cc,39ee2e
   BodyType: 0
   FaceType: 4
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Illinois
   ClubID: 26
   DivisionName: Division 4
   DivisionID: 3
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 13
   UserName: Thomas Kinell
   AbbrevName: Kinell, T
   Initials: TK
   UserID: 626527
   TeamID: 0
   TeamName: Thomas Kinell
   CarNumber: "13"
   CarNumberRaw: 13
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1389
   LicLevel: 19
   LicSubLevel: 328
   LicString: A 3.28
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 2,ff0000,00ff00,0000ff
   HelmetDesignStr: 65,ff5c00,ff5c00,ff5c00
   SuitDesignStr: 10,ff5c00,ff5c00,ffffff
   BodyType: 0
   FaceType: 4
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Scandinavia
   ClubID: 43
   DivisionName: Division 7
   DivisionID: 6
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 14
   UserName: Ryan Kristoff
   AbbrevName: Kristoff, R
   Initials: RK
   UserID: 62876
   TeamID: 0
   TeamName: Ryan Kristoff
   CarNumber: "14"
   CarNumberRaw: 14
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1370
   LicLevel: 10
   LicSubLevel: 270
   LicString: C 2.70
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 1,ff0000,00ff00,0000ff
   HelmetDesignStr: 28,ed2129,ffffff,000000
   SuitDesignStr: 21,ffffff,e7dfe0,000000
   BodyType: 1
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Michigan
   ClubID: 28
   DivisionName: Division 5
   DivisionID: 4
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 15
   UserName: Joao Coutinho
   AbbrevName: Coutinho, J
   Initials: JC
   UserID: 268532
   TeamID: 0
   TeamName: Joao Coutinho
   CarNumber: "15"
   CarNumberRaw: 15
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1334
   LicLevel: 11
   LicSubLevel: 353
   LicString: C 3.53
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 3,000000,000000,ffffff
   HelmetDesignStr: 14,000000,00aba1,ffffff
   SuitDesignStr: 0,00b1ac,c7c7c7,000000
   BodyType: 0
   FaceType: 4
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 172
   CarSponsor_2: 169
   ClubName: Iberia
   ClubID: 38
   DivisionName: Division 5
   DivisionID: 4
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 16
   UserName: Maxime Clausses
   AbbrevName: Clausses, M
   Initials: MC
   UserID: 997115
   TeamID: 0
   TeamName: Maxime Clausses
   CarNumber: "16"
   CarNumberRaw: 16
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1236
   LicLevel: 11
   LicSubLevel: 314
   LicString: C 3.14
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 12,7de54c,ffffff,1f2892
   HelmetDesignStr: 1,7de54c,ffffff,1f2892
   SuitDesignStr: 1,7de54c,ffffff,1f2892
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: France
   ClubID: 39
   DivisionName: Division 5
   DivisionID: 4
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 17
   UserName: Eduardo Diaz Mendez
   AbbrevName: Mendez, E
   Initials: EM
   UserID: 546188
   TeamID: 0
   TeamName: Eduardo Diaz Mendez
   CarNumber: "17"
   CarNumberRaw: 17
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1149
   LicLevel: 17
   LicSubLevel: 138
   LicString: A 1.38
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 2,ff0000,00ff00,0000ff
   HelmetDesignStr: 67,2a3795,ed2129,000000
   SuitDesignStr: 0,000000,2a3795,ed2129
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Atlantic
   ClubID: 18
   DivisionName: Division 7
   DivisionID: 6
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 18
   UserName: Elizabeth Arnold2
   AbbrevName: Arnold2, E
   Initials: EA
   UserID: 905285
   TeamID: 0
   TeamName: Elizabeth Arnold2
   CarNumber: "18"
   CarNumberRaw: 18
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1145
   LicLevel: 11
   LicSubLevel: 352
   LicString: C 3.52
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 1,ff0000,00ff00,0000ff
   HelmetDesignStr: 65,000000,fd0015,af8227
   SuitDesignStr: 15,0d0c0d,000000,f61717
   BodyType: 0
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Florida
   ClubID: 22
   DivisionName: Division 7
   DivisionID: 6
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 19
   UserName: Mark Forayter
   AbbrevName: Forayter, M
   Initials: MF
   UserID: 290141
   TeamID: 0
   TeamName: Mark Forayter
   CarNumber: "19"
   CarNumberRaw: 19
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1143
   LicLevel: 15
   LicSubLevel: 331
   LicString: B 3.31
   LicColor: 0x00c702
   IsSpectator: 0
   CarDesignStr: 11,ffffff,000000,000000.fcc30f
   HelmetDesignStr: 57,d9eb0d,000000,ffffff
   SuitDesignStr: 34,66b429,000000,23fa00
   BodyType: 1
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 224
   CarSponsor_2: 215
   ClubName: Illinois
   ClubID: 26
   DivisionName: Division 7
   DivisionID: 6
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 20
   UserName: David Gondola
   AbbrevName: Gondola, D
   Initials: DG
   UserID: 964389
   TeamID: 0
   TeamName: David Gondola
   CarNumber: "20"
   CarNumberRaw: 20
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 917
   LicLevel: 18
   LicSubLevel: 263
   LicString: A 2.63
   LicColor: 0x0153db
   IsSpectator: 0
   CarDesignStr: 10,0b0b0b,ff0909,fc0d0d,050404
   HelmetDesignStr: 57,20c911,030303,2cef0e
   SuitDesignStr: 1,e0efe0,090909,2f800f
   BodyType: 1
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 223
   CarSponsor_2: 169
   ClubName: New England
   ClubID: 12
   DivisionName: Division 7
   DivisionID: 6
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 21
   UserName: Sean Akins
   AbbrevName: Akins, S
   Initials: SA
   UserID: 887530
   TeamID: 0
   TeamName: Sean Akins
   CarNumber: "21"
   CarNumberRaw: 21
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 872
   LicLevel: 11
   LicSubLevel: 336
   LicString: C 3.36
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 20,faff00,000000,6b03b3
   HelmetDesignStr: 2,faff00,000000,6b03b3
   SuitDesignStr: 26,d00202,ffffff,ff0000
   BodyType: 0
   FaceType: 8
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Georgia
   ClubID: 21
   DivisionName: Division 8
   DivisionID: 7
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 22
   UserName: Kim Ipsen
   AbbrevName: Ipsen, K
   Initials: KI
   UserID: 975865
   TeamID: 0
   TeamName: Kim Ipsen
   CarNumber: "22"
   CarNumberRaw: 22
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 411
   LicLevel: 11
   LicSubLevel: 335
   LicString: C 3.35
   LicColor: 0xfeec04
   IsSpectator: 0
   CarDesignStr: 6,ffad33,ffad33,060504
   HelmetDesignStr: 17,ffad33,ffad33,060504
   SuitDesignStr: 28,0e0d0d,ff3333,fffefe
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 0
   ClubName: Scandinavia
   ClubID: 43
   DivisionName: Rookie
   DivisionID: 10
   CurDriverIncidentCount: -1
   TeamIncidentCount: -1
 - CarIdx: 63
   UserName: Jonathan Glanz
   AbbrevName: 
   Initials: 
   UserID: 102958
   TeamID: 0
   TeamName: Jonathan Glanz
   CarNumber: ""
   CarNumberRaw: -1
   CarPath: radicalsr10
   CarClassID: 3283
   CarID: 149
   CarIsPaceCar: 0
   CarIsAI: 0
   CarIsElectric: 0
   CarScreenName: Radical SR10
   CarScreenNameShort: Radical SR10
   CarClassShortName: Radical SR10
   CarClassRelSpeed: 80
   CarClassLicenseLevel: 0
   CarClassMaxFuelPct: 0.660 %
   CarClassWeightPenalty: 0.000 kg
   CarClassPowerAdjust: 0.000 %
   CarClassDryTireSetLimit: 0 %
   CarClassColor: 0xffffff
   CarClassEstLapTime: 111.8651
   IRating: 1255
   LicLevel: 19
   LicSubLevel: 340
   LicString: A 3.40
   LicColor: 0x0153db
   IsSpectator: 1
   CarDesignStr: 17,010201,050505,1c59f1,f9f8f8
   HelmetDesignStr: 4,b82f37,284a94,111111
   SuitDesignStr: 4,b82f37,284a94,111111
   BodyType: 0
   FaceType: 0
   HelmetType: 0
   CarNumberDesignStr: 0,0,ffffff,777777,000000
   CarSponsor_1: 0
   CarSponsor_2: 173
   ClubName: New York
   ClubID: 14
   DivisionName: Division 5
   DivisionID: 4
   CurDriverIncidentCount: 0
   TeamIncidentCount: 0

SplitTimeInfo:
 Sectors:
 - SectorNum: 0
   SectorStartPct: 0.000000
 - SectorNum: 1
   SectorStartPct: 0.130902
 - SectorNum: 2
   SectorStartPct: 0.306900
 - SectorNum: 3
   SectorStartPct: 0.442240
 - SectorNum: 4
   SectorStartPct: 0.531580
 - SectorNum: 5
   SectorStartPct: 0.658844
 - SectorNum: 6
   SectorStartPct: 0.876665

CarSetup:
 UpdateCount: 3
 TiresAero:
  LeftFrontTire:
   StartingPressure: 138 kPa
   LastHotPressure: 138 kPa
   LastTempsOMI: 44C, 44C, 44C
   TreadRemaining: 100%, 100%, 100%
  LeftRearTire:
   StartingPressure: 138 kPa
   LastHotPressure: 138 kPa
   LastTempsOMI: 44C, 44C, 44C
   TreadRemaining: 100%, 100%, 100%
  RightFrontTire:
   StartingPressure: 138 kPa
   LastHotPressure: 138 kPa
   LastTempsIMO: 44C, 44C, 44C
   TreadRemaining: 100%, 100%, 100%
  RightRearTire:
   StartingPressure: 138 kPa
   LastHotPressure: 138 kPa
   LastTempsIMO: 44C, 44C, 44C
   TreadRemaining: 100%, 100%, 100%
  AeroSettings:
   RearWingSetting: 9 hole
   OfDivePlanes: 1
   WingGurneySetting: On
 Chassis:
  Front:
   ArbSize:  Soft
   ToeIn: -2.3 mm
   SteeringRatio: 12.0
   DisplayPage: Race1
  LeftFront:
   CornerWeight: 1921 N
   RideHeight: 61.9 mm
   ShockDefl: 8.9 mm 63.0 mm
   SpringPerchOffset: 89.0 mm
   SpringRate: 180 N/mm
   LsCompDamping: 9 clicks
   HsCompDamping: 4 clicks
   HsRbdDamping: 3 clicks
   Camber: -2.5 deg
  LeftRear:
   CornerWeight: 2262 N
   RideHeight: 77.8 mm
   ShockDefl: 20.8 mm 74.0 mm
   SpringDefl: 17.2 mm 75.0 mm
   SpringPerchOffset: 82.0 mm
   SpringRate: 120 N/mm
   LsCompDamping: 8 clicks
   HsCompDamping: 6 clicks
   HsRbdDamping: 3 clicks
   Camber: -1.8 deg
   ToeIn: +0.2 mm
  RightFront:
   CornerWeight: 1921 N
   RideHeight: 61.9 mm
   ShockDefl: 8.9 mm 63.0 mm
   SpringPerchOffset: 89.0 mm
   SpringRate: 180 N/mm
   LsCompDamping: 9 clicks
   HsCompDamping: 4 clicks
   HsRbdDamping: 3 clicks
   Camber: -2.5 deg
  RightRear:
   CornerWeight: 2262 N
   RideHeight: 77.8 mm
   ShockDefl: 20.8 mm 74.0 mm
   SpringDefl: 17.2 mm 75.0 mm
   SpringPerchOffset: 82.0 mm
   SpringRate: 120 N/mm
   LsCompDamping: 8 clicks
   HsCompDamping: 6 clicks
   HsRbdDamping: 3 clicks
   Camber: -1.8 deg
   ToeIn: +0.2 mm
  Rear:
   ArbSize:  Medium
   CrossWeight: 50.0%
 BrakesDriveUnit:
  BrakeSpec:
   PadCompound: Medium
   BrakePressureBias: 63.0%
  Fuel:
   FuelLevel: 40.0 L
  Engine:
   BoostLevel_Cal: 8
   ThrottleShape_Tps: 1
  GearRatios:
   GearStack: Std
   SpeedInFirst: 92.7 Km/h
   SpeedInSecond: 124.6 Km/h
   SpeedInThird: 162.0 Km/h
   SpeedInFourth: 203.4 Km/h
   SpeedInFifth: 244.7 Km/h
   SpeedInSixth: 283.2 Km/h
...
```