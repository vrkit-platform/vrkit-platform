"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""

import TrackMetadata_pb2
import builtins
import google.protobuf.descriptor
import google.protobuf.message
import typing

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor

@typing.final
class TrackLayoutMetadata(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    ID_FIELD_NUMBER: builtins.int
    NAME_FIELD_NUMBER: builtins.int
    TRACK_METADATA_FIELD_NUMBER: builtins.int
    id: builtins.str
    name: builtins.str
    @property
    def track_metadata(self) -> TrackMetadata_pb2.TrackMetadata: ...
    def __init__(
        self,
        *,
        id: builtins.str = ...,
        name: builtins.str = ...,
        track_metadata: TrackMetadata_pb2.TrackMetadata | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["track_metadata", b"track_metadata"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["id", b"id", "name", b"name", "track_metadata", b"track_metadata"]) -> None: ...

global___TrackLayoutMetadata = TrackLayoutMetadata
