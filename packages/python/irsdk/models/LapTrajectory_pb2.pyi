"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""

import FileInfo_pb2
import LapCoordinate_pb2
import TrackLayoutMetadata_pb2
import builtins
import collections.abc
import google.protobuf.descriptor
import google.protobuf.internal.containers
import google.protobuf.message
import typing

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor

@typing.final
class LapTrajectory(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    @typing.final
    class Metadata(google.protobuf.message.Message):
        DESCRIPTOR: google.protobuf.descriptor.Descriptor

        LAP_FIELD_NUMBER: builtins.int
        LAP_TIME_FIELD_NUMBER: builtins.int
        INCIDENT_COUNT_FIELD_NUMBER: builtins.int
        VALID_FIELD_NUMBER: builtins.int
        lap: builtins.int
        lap_time: builtins.int
        incident_count: builtins.int
        valid: builtins.bool
        def __init__(
            self,
            *,
            lap: builtins.int = ...,
            lap_time: builtins.int = ...,
            incident_count: builtins.int = ...,
            valid: builtins.bool = ...,
        ) -> None: ...
        def ClearField(self, field_name: typing.Literal["incident_count", b"incident_count", "lap", b"lap", "lap_time", b"lap_time", "valid", b"valid"]) -> None: ...

    METADATA_FIELD_NUMBER: builtins.int
    TRACK_LAYOUT_METADATA_FIELD_NUMBER: builtins.int
    FILE_INFO_FIELD_NUMBER: builtins.int
    TIMESTAMP_FIELD_NUMBER: builtins.int
    PATH_FIELD_NUMBER: builtins.int
    timestamp: builtins.int
    @property
    def metadata(self) -> global___LapTrajectory.Metadata: ...
    @property
    def track_layout_metadata(self) -> TrackLayoutMetadata_pb2.TrackLayoutMetadata: ...
    @property
    def file_info(self) -> FileInfo_pb2.FileInfo: ...
    @property
    def path(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[LapCoordinate_pb2.LapCoordinate]: ...
    def __init__(
        self,
        *,
        metadata: global___LapTrajectory.Metadata | None = ...,
        track_layout_metadata: TrackLayoutMetadata_pb2.TrackLayoutMetadata | None = ...,
        file_info: FileInfo_pb2.FileInfo | None = ...,
        timestamp: builtins.int = ...,
        path: collections.abc.Iterable[LapCoordinate_pb2.LapCoordinate] | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["file_info", b"file_info", "metadata", b"metadata", "track_layout_metadata", b"track_layout_metadata"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["file_info", b"file_info", "metadata", b"metadata", "path", b"path", "timestamp", b"timestamp", "track_layout_metadata", b"track_layout_metadata"]) -> None: ...

global___LapTrajectory = LapTrajectory
