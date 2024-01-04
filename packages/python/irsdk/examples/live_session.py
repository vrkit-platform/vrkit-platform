from irsdk.irsdk_client import IRClient
from irsdk.irsdk_disk_client import IRDiskClient
import time


# this is our State class, with some helpful variables
class State:
    ir_connected = False
    last_car_setup_tick = -1


ir: IRClient | None = None
state: State | None = None


# here we check if we are connected to iracing
# so we can retrieve some data
def check_iracing():
    global ir, state

    if state.ir_connected and not (ir.is_initialized and ir.is_connected):
        state.ir_connected = False
        # don't forget to reset your State variables
        state.last_car_setup_tick = -1
        # we are shutting down ir library (clearing all internal variables)
        ir.shutdown()
        print('irsdk disconnected')
    elif not state.ir_connected and ir.startup() and ir.is_initialized and ir.is_connected:
        state.ir_connected = True
        print('irsdk connected')


# our main loop, where we retrieve data
# and do something useful with it
def loop():
    global ir, state

    # on each tick we freeze buffer with live telemetry
    # it is optional, but useful if you use vars like CarIdxXXX
    # this way you will have consistent data from those vars inside one tick
    # because sometimes while you retrieve one CarIdxXXX variable
    # another one in next line of code could change
    # to the next iracing internal tick_count,
    # and you will get inconsistent data
    ir.freeze_var_buffer_latest()

    # retrieve live telemetry data
    # check here for list of available variables
    # https://github.com/kutu/pyirsdk/blob/master/vars.txt
    # this is not full list, because some cars has additional
    # specific variables, like break bias, wings adjustment, etc
    t = ir['SessionTime']
    print('session time:', t)

    if ir['Lon']:
        print(ir['Lat'],",",ir['Lon'])
    # retrieve CarSetup from session data
    # we also check if CarSetup data has been updated
    # with ir.get_session_info_update_by_key(key)
    # but first you need to request data, before checking if its updated
    # car_setup = ir['CarSetup']
    # if car_setup:
    #     car_setup_tick = ir.get_session_info_update_by_key('CarSetup')
    #     if car_setup_tick != state.last_car_setup_tick:
    #         state.last_car_setup_tick = car_setup_tick
    #         print('car setup update count:', car_setup['UpdateCount'])
    # now you can go to garage, and do some changes with your setup
    # this line will be printed, only when you change something
    # and press apply button, but not every 1 sec
    # note about session info data
    # you should always check if data exists first
    # before do something like ir['WeekendInfo']['TeamRacing']
    # so do like this:
    # if ir['WeekendInfo']:
    #   print(ir['WeekendInfo']['TeamRacing'])

    # and just as an example
    # you can send commands to iracing
    # like switch cameras, rewind in replay mode, send chat and pit commands, etc
    # check pyirsdk.py library to see what commands are available
    # https://github.com/kutu/pyirsdk/blob/master/irsdk.py#L134 (class BroadcastMsg)
    # when you run this script, camera will be switched to P1
    # and very first camera in list of cameras in iracing
    # while script is running, change camera by yourself in iracing
    # and notice how this code changes it back every 1 sec
    # ir.cam_switch_pos(0, 1)


def process_live_session():
    global ir, state

    # initializing ir and state
    ir = IRClient()
    state = State()

    try:
        # infinite loop
        while True:
            # check if we are connected to iracing
            check_iracing()
            # if we are, then process data
            if state.ir_connected:
                loop()
            # sleep for 1 second
            # maximum you can use is 1/60
            # cause iracing updates data with 60 fps
            time.sleep(1)
    except KeyboardInterrupt:
        # press ctrl+c to exit
        pass

process_live_session()