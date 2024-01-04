VERSION = '1.3.3'
SIM_STATUS_URL = 'http://127.0.0.1:32034/get_sim_status?object=simStatus'
DATAVALIDEVENTNAME = 'Local\\IRSDKDataValidEvent'
MEMMAPFILE = 'Local\\IRSDKMemMapFileName'
MEMMAPFILESIZE = 1164 * 1024
BROADCASTMSGNAME = 'IRSDK_BROADCASTMSG'
VAR_TYPE_MAP = ['c', '?', 'i', 'I', 'f', 'd']
YAML_TRANSLATER = bytes.maketrans(b'\x81\x8D\x8F\x90\x9D', b'     ')
YAML_CODE_PAGE = 'cp1252'
