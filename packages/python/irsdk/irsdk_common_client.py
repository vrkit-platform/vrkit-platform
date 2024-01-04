import struct


class IRSDKStruct:
    @classmethod
    def property_value(cls, offset, var_type):
        struct_type = struct.Struct(var_type)
        return property(lambda self: self.get(offset, struct_type))

    @classmethod
    def property_value_str(cls, offset, var_type):
        struct_type = struct.Struct(var_type)
        return property(lambda self: self.get(offset, struct_type).strip(b'\x00').decode('latin-1'))

    def __init__(self, shared_mem, offset=0):
        self._shared_mem = shared_mem
        self._offset = offset

    def __repr__(self):
        return f'''<{self.__class__.__module__}.{self.__class__.__name__} {', '.join(
            f'{k}={getattr(self, k)!r}'
                for k, p in vars(self.__class__).items()
                if not k.startswith('_') and isinstance(p, property)
        )}>'''

    def get(self, offset, struct_type):
        return struct_type.unpack_from(self._shared_mem, self._offset + offset)[0]


class Header(IRSDKStruct):
    version = IRSDKStruct.property_value(0, 'i')
    status = IRSDKStruct.property_value(4, 'i')
    tick_rate = IRSDKStruct.property_value(8, 'i')

    session_info_update = IRSDKStruct.property_value(12, 'i')
    session_info_len = IRSDKStruct.property_value(16, 'i')
    session_info_offset = IRSDKStruct.property_value(20, 'i')

    num_vars = IRSDKStruct.property_value(24, 'i')
    var_header_offset = IRSDKStruct.property_value(28, 'i')

    num_buf = IRSDKStruct.property_value(32, 'i')
    buf_len = IRSDKStruct.property_value(36, 'i')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.var_buf = [
            VarBuffer(self._shared_mem, 48 + i * 16, buf_len=self.buf_len)
            for i in range(self.num_buf)
        ]


class VarBuffer(IRSDKStruct):
    tick_count = IRSDKStruct.property_value(0, 'i')
    _buf_offset = IRSDKStruct.property_value(4, 'i')

    def __init__(self, *args, buf_len, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_memory_frozen = False
        self._frozen_memory = None
        self._buf_len = buf_len

    def freeze(self):
        self._frozen_memory = self._shared_mem[self._buf_offset: self._buf_offset + self._buf_len]
        self.is_memory_frozen = True

    def unfreeze(self):
        self._frozen_memory = None
        self.is_memory_frozen = False

    def get_memory(self):
        return self._frozen_memory if self.is_memory_frozen else self._shared_mem

    @property
    def buf_offset(self):
        return 0 if self.is_memory_frozen else self._buf_offset


class VarHeader(IRSDKStruct):
    type = IRSDKStruct.property_value(0, 'i')
    offset = IRSDKStruct.property_value(4, 'i')
    count = IRSDKStruct.property_value(8, 'i')
    count_as_time = IRSDKStruct.property_value(12, '?')
    name = IRSDKStruct.property_value_str(16, '32s')
    desc = IRSDKStruct.property_value_str(48, '64s')
    unit = IRSDKStruct.property_value_str(112, '32s')
