# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: LapTrajectory.proto
# Protobuf Python Version: 4.25.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\rLapData.proto\x12\x1dIRacingTools.Models.Telemetry\"S\n\x0bLapMetadata\x12\x0b\n\x03lap\x18\x01 \x01(\r\x12\x10\n\x08lap_time\x18\x02 \x01(\r\x12\x16\n\x0eincident_count\x18\x03 \x01(\r\x12\r\n\x05valid\x18\x04 \x01(\x08\"\xfb\x01\n\rLapTrajectory\x12<\n\x08metadata\x18\x01 \x01(\x0b\x32*.IRacingTools.Models.Telemetry.LapMetadata\x12\x11\n\ttimestamp\x18\x02 \x01(\x03\x12\x10\n\x08track_id\x18\x05 \x01(\r\x12\x12\n\ntrack_name\x18\x06 \x01(\t\x12\x19\n\x11track_layout_name\x18\x07 \x01(\t\x12\x17\n\x0ftrack_layout_id\x18\n \x01(\t\x12?\n\x04path\x18\x14 \x03(\x0b\x32\x31.IRacingTools.Models.Telemetry.LapCoordinate\"\xa0\x01\n\x12LapCoordinate\x12\x10\n\x08lap_time\x18\x01 \x01(\r\x12\x1c\n\x14lap_percent_complete\x18\x02 \x01(\x02\x12\x14\n\x0clap_distance\x18\x03 \x01(\x02\x12\x10\n\x08latitude\x18\n \x01(\x01\x12\x11\n\tlongitude\x18\x0b \x01(\x01\x12\x10\n\x08\x61ltitude\x18\x0c \x01(\x02\x12\r\n\x05speed\x18\x14 \x01(\x02\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'LapData_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  DESCRIPTOR._options = None
  _globals['_LAPMETADATA']._serialized_start=48
  _globals['_LAPMETADATA']._serialized_end=131
  _globals['_LAPTRAJECTORY']._serialized_start=134
  _globals['_LAPTRAJECTORY']._serialized_end=385
  _globals['_LAPTRAJECTORYPOINT']._serialized_start=388
  _globals['_LAPTRAJECTORYPOINT']._serialized_end=548
# @@protoc_insertion_point(module_scope)
