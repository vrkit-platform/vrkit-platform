import mmap
import struct
import pandas as pd

from irsdk.irsdk_common_client import IRSDKStruct, Header, VarHeader
from packages.python.irsdk.irsdk_constants import VAR_TYPE_MAP


class DiskSubHeader(IRSDKStruct):
    session_start_date = IRSDKStruct.property_value(0, 'Q')
    session_start_time = IRSDKStruct.property_value(8, 'd')
    session_end_time = IRSDKStruct.property_value(16, 'd')
    session_lap_count = IRSDKStruct.property_value(24, 'i')
    session_record_count = IRSDKStruct.property_value(28, 'i')


class IRDiskClient:
    _ibt_file = None
    _shared_mem = None
    _header = None
    _disk_header = None

    __var_headers = None
    __var_headers_dict = None
    __var_headers_names = None
    __session_info_dict = None

    def __init__(self):
        pass

    def __getitem__(self, key):
        return self.get(self.record_count - 1, key)

    @property
    def header(self) -> Header:
        return self._header

    @property
    def disk_header(self) -> DiskSubHeader:
        return self._disk_header

    @property
    def record_count(self) -> int | None:
        return self._disk_header and self._disk_header.session_record_count

    @property
    def filename(self):
        return self._ibt_file and self._ibt_file.name

    @property
    def var_header_buffer_tick(self):
        return self._header and self._header.var_buf[0].tick_count

    @property
    def var_headers_names(self):
        if not self._header:
            return None
        if self.__var_headers_names is None:
            self.__var_headers_names = [var_header.name for var_header in self._var_headers]
        return self.__var_headers_names

    def open(self, ibt_file):
        self._ibt_file = open(ibt_file, 'rb') if isinstance(ibt_file,str) else ibt_file
        self._shared_mem = mmap.mmap(self._ibt_file.fileno(), 0, access=mmap.ACCESS_READ)
        self._header = Header(self._shared_mem)
        self._disk_header = DiskSubHeader(self._shared_mem, 112)
        return self

    def close(self):
        if self._shared_mem:
            self._shared_mem.close()

        if self._ibt_file:
            self._ibt_file.close()

        self._ibt_file = None
        self._shared_mem = None
        self._header = None
        self._disk_header = None

        self.__var_headers = None
        self.__var_headers_dict = None
        self.__var_headers_names = None
        self.__session_info_dict = None

    def get(self, index, *keys):
        if not self._header:
            return None
        if 0 > index >= self._disk_header.session_record_count:
            return None
        values = []
        is_single_key = len(keys) == 1
        for key in keys:
            data = None
            if key in self._var_headers_dict:
                var_header = self._var_headers_dict[key]
                fmt = VAR_TYPE_MAP[var_header.type] * var_header.count
                var_offset = var_header.offset + self._header.var_buf[0].buf_offset + index * self._header.buf_len
                res = struct.unpack_from(fmt, self._shared_mem, var_offset)
                data = list(res) if var_header.count > 1 else res[0]
                if is_single_key:
                    return data

            values.append(data)
        return None if is_single_key else values

    def get_all(self, key):
        if not self._header:
            return None
        if key in self._var_headers_dict:
            var_header = self._var_headers_dict[key]
            fmt = VAR_TYPE_MAP[var_header.type] * var_header.count
            var_offset = var_header.offset + self._header.var_buf[0].buf_offset
            buf_len = self._header.buf_len
            is_array = var_header.count > 1
            results = []
            for i in range(self._disk_header.session_record_count):
                res = struct.unpack_from(fmt, self._shared_mem, var_offset + i * buf_len)
                results.append(list(res) if is_array else res[0])
            return results
        return None

    def get_data_frame(self,index_key:str,*keys):
        if not self._header:
            return None
        data = {}
        if index_key not in keys:
            new_keys = [index_key]
            new_keys.extend(keys)
            keys = new_keys

        for key in keys: # self._var_headers_dict:

            var_header = self._var_headers_dict[key]
            fmt = VAR_TYPE_MAP[var_header.type] * var_header.count
            var_offset = var_header.offset + self._header.var_buf[0].buf_offset
            buf_len = self._header.buf_len
            is_array = var_header.count > 1
            # results = []

            if key not in data:
                data[key] = list()

            for i in range(self._disk_header.session_record_count):
                res = struct.unpack_from(fmt, self._shared_mem, var_offset + i * buf_len)
                data[key].append(list(res) if is_array else res[0])

        return pd.DataFrame(data,index=data[index_key])

    @property
    def _var_headers(self):
        if not self._header:
            return None
        if self.__var_headers is None:
            self.__var_headers = []
            for i in range(self._header.num_vars):
                var_header = VarHeader(self._shared_mem, self._header.var_header_offset + i * 144)
                self._var_headers.append(var_header)
        return self.__var_headers

    @property
    def _var_headers_dict(self):
        if not self._header:
            return None
        if self.__var_headers_dict is None:
            self.__var_headers_dict = {}
            for var_header in self._var_headers:
                self.__var_headers_dict[var_header.name] = var_header
        return self.__var_headers_dict


class IRDiskClientIterator:
    def __init__(self, ibt: IRDiskClient):
        self.__ibt = ibt

        self.__record_index = 0
        self.__record_count = ibt.record_count

    def has_more_records(self):
        return self.__record_index + 1 < self.__record_count

    def next_record(self) -> int | None:
        return self.set_record(self.__record_index + 1)

    def set_record(self, idx) -> int | None:
        total = self.__record_count
        if not total or idx >= total:
            return None

        self.__record_index = idx
        return self.__record_index

    def __iter__(self):
        return self

    def __next__(self):
        if self.next_record() is not None:
            return self
        else:
            raise StopIteration

    def __getitem__(self, key):
        return self.__ibt.get(self.__record_index, key)

    def get(self, *keys):
        return self.__ibt.get(self.__record_index, *keys)

    @property
    def record_index(self):
        return self.__record_index
