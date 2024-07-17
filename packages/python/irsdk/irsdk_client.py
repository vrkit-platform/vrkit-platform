#!python3

import re
import mmap
import struct
import ctypes
import yaml

from threading import Thread
from urllib import request, error
from yaml.reader import Reader as YamlReader

from irsdk.irsdk_common_client import Header, VarHeader
from irsdk.irsdk_constants import VERSION, \
    SIM_STATUS_URL, \
    DATAVALIDEVENTNAME, \
    MEMMAPFILE, \
    MEMMAPFILESIZE, BROADCASTMSGNAME, VAR_TYPE_MAP, YAML_TRANSLATER, YAML_CODE_PAGE
from irsdk.irsdk_types import ChatCommandMode, \
    PitCommandMode, \
    TelemCommandMode, \
    RpyStateMode, \
    ReloadTexturesMode, \
    RpySrchMode, \
    RpyPosMode, \
    FFBCommandMode, \
    VideoCaptureMode, \
    BroadcastMsg, \
    StatusField, \
    CameraState
from irsdk.irsdk_yaml_loader import CustomYamlSafeLoader


class IRClient:
    def __init__(self, parse_yaml_async=False):
        self.parse_yaml_async = parse_yaml_async
        self.is_initialized = False
        self.last_session_info_update = 0

        self._shared_mem = None
        self._header = None
        self._data_valid_event = None

        self.__var_headers = None
        self.__var_headers_dict = None
        self.__var_headers_names = None
        self.__var_buffer_latest = None
        self.__session_info_dict = {}
        self.__broadcast_msg_id = None
        self.__test_file = None
        self.__workaround_connected_state = 0

    def __getitem__(self, key):
        if key in self._var_headers_dict:
            var_header = self._var_headers_dict[key]
            var_buf_latest = self._var_buffer_latest
            res = struct.unpack_from(
                VAR_TYPE_MAP[var_header.type] * var_header.count,
                var_buf_latest.get_memory(),
                var_buf_latest.buf_offset + var_header.offset
            )
            return res[0] if var_header.count == 1 else list(res)

        return self._get_session_info(key)

    @property
    def is_connected(self):
        if self._header:
            if self._header.status == StatusField.status_connected:
                self.__workaround_connected_state = 0
            if self.__workaround_connected_state == 0 and self._header.status != StatusField.status_connected:
                self.__workaround_connected_state = 1
            if self.__workaround_connected_state == 1 and (self['SessionNum'] is None or self.__test_file):
                self.__workaround_connected_state = 2
            if self.__workaround_connected_state == 2 and self['SessionNum'] is not None:
                self.__workaround_connected_state = 3
        return self._header is not None and \
            (self.__test_file or self._data_valid_event) and \
            (self._header.status == StatusField.status_connected or self.__workaround_connected_state == 3)

    @property
    def session_info_update(self):
        return self._header.session_info_update

    @property
    def var_headers_names(self):
        if self.__var_headers_names is None:
            self.__var_headers_names = [var_header.name for var_header in self._var_headers]
        return self.__var_headers_names

    def startup(self, test_file=None, dump_to=None):
        if test_file is None:
            if not self._check_sim_status():
                return False
            self._data_valid_event = ctypes.windll.kernel32.OpenEventW(0x00100000, False, DATAVALIDEVENTNAME)
        if not self._wait_valid_data_event():
            self._data_valid_event = None
            return False

        if self._shared_mem is None:
            if test_file:
                self.__test_file = open(test_file, 'rb')
                self._shared_mem = mmap.mmap(self.__test_file.fileno(), 0, access=mmap.ACCESS_READ)
            else:
                self._shared_mem = mmap.mmap(0, MEMMAPFILESIZE, MEMMAPFILE, access=mmap.ACCESS_READ)

        if self._shared_mem:
            if dump_to:
                with open(dump_to, 'wb') as f:
                    # noinspection PyTypeChecker
                    f.write(self._shared_mem)
            self._header = Header(self._shared_mem)
            self.is_initialized = self._header.version >= 1 and len(self._header.var_buf) > 0

        return self.is_initialized

    def shutdown(self):
        self.is_initialized = False
        self.last_session_info_update = 0
        if self._shared_mem:
            self._shared_mem.close()
            self._shared_mem = None
        self._header = None
        self._data_valid_event = None
        self.__var_headers = None
        self.__var_headers_dict = None
        self.__var_headers_names = None
        self.__var_buffer_latest = None
        self.__session_info_dict = {}
        self.__broadcast_msg_id = None
        if self.__test_file:
            self.__test_file.close()
            self.__test_file = None

    def parse_to(self, to_file):
        if not self.is_initialized:
            return
        f = open(to_file, 'w', encoding='utf-8')
        f.write(
            self._shared_mem[self._header.session_info_offset:self._header.session_info_len].rstrip(b'\x00').decode(
                YAML_CODE_PAGE
            )
        )
        # noinspection PyTypeChecker
        f.write(
            '\n'.join(
                [
                    '{:32}{}'.format(i, self[i])
                    for i in sorted(self._var_headers_dict.keys(), key=str.lower)
                ]
            )
        )
        f.close()

    def cam_switch_pos(self, position=0, group=1, camera=0):
        return self._broadcast_msg(BroadcastMsg.cam_switch_pos, position, group, camera)

    def cam_switch_num(self, car_number='1', group=1, camera=0):
        return self._broadcast_msg(BroadcastMsg.cam_switch_num, self._pad_car_num(car_number), group, camera)

    def cam_set_state(self, camera_state=CameraState.cam_tool_active):
        return self._broadcast_msg(BroadcastMsg.cam_set_state, camera_state)

    def replay_set_play_speed(self, speed=0, slow_motion=False):
        return self._broadcast_msg(BroadcastMsg.replay_set_play_speed, speed, 1 if slow_motion else 0)

    def replay_set_play_position(self, pos_mode=RpyPosMode.begin, frame_num=0):
        return self._broadcast_msg(BroadcastMsg.replay_set_play_position, pos_mode, frame_num)

    def replay_search(self, search_mode=RpySrchMode.to_start):
        return self._broadcast_msg(BroadcastMsg.replay_search, search_mode)

    def replay_set_state(self, state_mode=RpyStateMode.erase_tape):
        return self._broadcast_msg(BroadcastMsg.replay_set_state, state_mode)

    def reload_all_textures(self):
        return self._broadcast_msg(BroadcastMsg.reload_textures, ReloadTexturesMode.all)

    def reload_texture(self, car_idx=0):
        return self._broadcast_msg(BroadcastMsg.reload_textures, ReloadTexturesMode.car_idx, car_idx)

    def chat_command(self, chat_command_mode=ChatCommandMode.begin_chat):
        return self._broadcast_msg(BroadcastMsg.chat_command, chat_command_mode)

    def chat_command_macro(self, macro_num=0):
        return self._broadcast_msg(BroadcastMsg.chat_command, ChatCommandMode.macro, macro_num)

    def pit_command(self, pit_command_mode=PitCommandMode.clear, var=0):
        return self._broadcast_msg(BroadcastMsg.pit_command, pit_command_mode, var)

    def telem_command(self, telem_command_mode=TelemCommandMode.stop):
        return self._broadcast_msg(BroadcastMsg.telem_command, telem_command_mode)

    def ffb_command(self, ffb_command_mode=FFBCommandMode.ffb_command_max_force, value=0):
        return self._broadcast_msg(BroadcastMsg.ffb_command, ffb_command_mode, int(value * 65536))

    def replay_search_session_time(self, session_num=0, session_time_ms=0):
        return self._broadcast_msg(BroadcastMsg.replay_search_session_time, session_num, session_time_ms)

    def video_capture(self, video_capture_mode=VideoCaptureMode.trigger_screen_shot):
        return self._broadcast_msg(BroadcastMsg.video_capture, video_capture_mode)

    def _check_sim_status(self):
        try:
            return 'running:1' in request.urlopen(SIM_STATUS_URL).read().decode('utf-8')
        except error.URLError as e:
            print("Failed to connect to sim: {}".format(e.reason))
            return False

    @property
    def _var_buffer_latest(self):
        # return 2nd most recent var buffer
        # because it might be a situation (with most recent var buffer)
        # that half of var buffer written with new data
        # and other half still old
        return sorted(self._header.var_buf, key=lambda v: v.tick_count, reverse=True)[1]

    @property
    def _var_headers(self):
        if self.__var_headers is None:
            self.__var_headers = []
            for i in range(self._header.num_vars):
                var_header = VarHeader(self._shared_mem, self._header.var_header_offset + i * 144)
                self._var_headers.append(var_header)
        return self.__var_headers

    @property
    def _var_headers_dict(self):
        if self.__var_headers_dict is None:
            self.__var_headers_dict = {}
            for var_header in self._var_headers:
                self.__var_headers_dict[var_header.name] = var_header
        return self.__var_headers_dict

    def freeze_var_buffer_latest(self):
        self.unfreeze_var_buffer_latest()
        self._wait_valid_data_event()
        self.__var_buffer_latest = sorted(self._header.var_buf, key=lambda v: v.tick_count, reverse=True)[0]
        self.__var_buffer_latest.freeze()

    def unfreeze_var_buffer_latest(self):
        if self.__var_buffer_latest:
            self.__var_buffer_latest.unfreeze()
            self.__var_buffer_latest = None

    def get_session_info_update_by_key(self, key):
        if key in self.__session_info_dict:
            return self.__session_info_dict[key]['update']
        return None

    def _wait_valid_data_event(self):
        if self._data_valid_event is not None:
            return ctypes.windll.kernel32.WaitForSingleObject(
                self._data_valid_event,
                32
            ) == 0 if self._data_valid_event else False
        else:
            return True

    def _get_session_info(self, key):
        if self.last_session_info_update < self._header.session_info_update:
            self.last_session_info_update = self._header.session_info_update
            for session_data in self.__session_info_dict.values():
                # keep previous parsed data, in case binary data not changed
                if session_data['data']:
                    session_data['data_last'] = session_data['data']
                session_data['data'] = None

        if key not in self.__session_info_dict:
            self.__session_info_dict[key] = dict(data=None)

        session_data = self.__session_info_dict[key]

        # already have and parsed
        if session_data['data']:
            return session_data['data']

        if self.parse_yaml_async:
            if ('async_session_info_update' not in session_data or session_data['async_session_info_update'] <
                    self.last_session_info_update):
                session_data['async_session_info_update'] = self.last_session_info_update
                Thread(target=self._parse_yaml, args=(key, session_data)).start()
        else:
            self._parse_yaml(key, session_data)
        return session_data['data']

    def _get_session_info_binary(self, key):
        start = self._header.session_info_offset
        end = start + self._header.session_info_len
        # search section by key
        match_start = re.compile(('\n%s:\n' % key).encode(YAML_CODE_PAGE)).search(self._shared_mem, start, end)
        if not match_start:
            return None
        match_end = re.compile(b'\n\n').search(self._shared_mem, match_start.start() + 1, end)
        if not match_end:
            return None
        return self._shared_mem[match_start.start() + 1: match_end.start()]

    def _parse_yaml(self, key, session_data):
        session_info_update = self.last_session_info_update
        data_binary = self._get_session_info_binary(key)

        # section not found
        if not data_binary:
            if 'data_last' in session_data:
                return session_data['data_last']
            else:
                return None

        # is binary data the same as last time?
        if 'data_binary' in session_data and data_binary == session_data['data_binary'] and 'data_last' in session_data:
            session_data['data'] = session_data['data_last']
            return session_data['data']
        session_data['data_binary'] = data_binary

        # parsing
        yaml_src = re.sub(
            YamlReader.NON_PRINTABLE,
            '',
            data_binary.translate(YAML_TRANSLATER).rstrip(b'\x00').decode(YAML_CODE_PAGE)
        )
        if key == 'DriverInfo':
            def name_replace(m):
                return m.group(1) + '"%s"' % re.sub(r'(["\\])', r'\\\1', m.group(2))

            yaml_src = re.sub(
                r'((?:DriverSetupName|UserName|TeamName|AbbrevName|Initials): )(.*)',
                name_replace,
                yaml_src
            )
        yaml_src = re.sub(r'(\w+: )(,.*)', r'\1"\2"', yaml_src)
        result = yaml.load(yaml_src, Loader=CustomYamlSafeLoader)
        # check if result is available, and yaml data is not updated while we were parsing it in async mode
        if result and (not self.parse_yaml_async or self.last_session_info_update == session_info_update):
            session_data['data'] = result[key]
            if session_data['data']:
                session_data['update'] = session_info_update
            elif 'data_last' in session_data:
                session_data['data'] = session_data['data_last']

    @property
    def _broadcast_msg_id(self):
        if self.__broadcast_msg_id is None:
            self.__broadcast_msg_id = ctypes.windll.user32.RegisterWindowMessageW(BROADCASTMSGNAME)
        return self.__broadcast_msg_id

    def _broadcast_msg(self, broadcast_type=0, var1=0, var2=0, var3=0):
        return ctypes.windll.user32.SendNotifyMessageW(
            0xFFFF, self._broadcast_msg_id,
            broadcast_type | var1 << 16, var2 | var3 << 16
        )

    def _pad_car_num(self, num):
        num = str(num)
        num_len = len(num)
        zero = num_len - len(num.lstrip("0"))
        if zero > 0 and num_len == zero:
            zero -= 1
        num = int(num)
        if zero:
            num_place = 3 if num > 99 else 2 if num > 9 else 1
            return num + 1000 * (num_place + zero)
        return num
