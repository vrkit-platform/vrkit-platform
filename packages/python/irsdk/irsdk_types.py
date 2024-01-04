class ChatCommandMode:
    macro = 0  # pass in a number from 1-15 representing the chat macro to launch
    begin_chat = 1  # Open up a new chat window
    reply = 2  # Reply to last private chat
    cancel = 3  # Close chat window


class PitCommandMode:  # this only works when the driver is in the car
    clear = 0  # Clear all pit checkboxes
    ws = 1  # Clean the winshield, using one tear off
    fuel = 2  # Add fuel, optionally specify the amount to add in liters or pass '0' to use existing amount
    lf = 3  # Change the left front tire, optionally specifying the pressure in KPa or pass '0' to use existing pressure
    rf = 4  # right front
    lr = 5  # left rear
    rr = 6  # right rear
    clear_tires = 7  # Clear tire pit checkboxes
    fr = 8  # Request a fast repair
    clear_ws = 9  # Uncheck Clean the winshield checkbox
    clear_fr = 10  # Uncheck request a fast repair
    clear_fuel = 11  # Uncheck add fuel


class TelemCommandMode:  # You can call this any time, but telemtry only records when driver is in there car
    stop = 0  # Turn telemetry recording off
    start = 1  # Turn telemetry recording on
    restart = 2  # Write current file to disk and start a new one


class RpyStateMode:
    erase_tape = 0  # clear any data in the replay tape


class ReloadTexturesMode:
    all = 0  # reload all textuers
    car_idx = 1  # reload only textures for the specific carIdx


class RpySrchMode:
    to_start = 0
    to_end = 1
    prev_session = 2
    next_session = 3
    prev_lap = 4
    next_lap = 5
    prev_frame = 6
    next_frame = 7
    prev_incident = 8
    next_incident = 9


class RpyPosMode:
    begin = 0
    current = 1
    end = 2


class csMode:
    at_incident = -3
    at_leader = -2
    at_exciting = -1


class PitSvFlags:
    lf_tire_change = 0x01
    rf_tire_change = 0x02
    lr_tire_change = 0x04
    rr_tire_change = 0x08
    fuel_fill = 0x10
    windshield_tearoff = 0x20
    fast_repair = 0x40


class PitSvStatus:
    # status
    none = 0
    in_progress = 1
    complete = 2
    # errors
    too_far_left = 100
    too_far_right = 101
    too_far_forward = 102
    too_far_back = 103
    bad_angle = 104
    cant_fix_that = 105


class PaceMode:
    single_file_start = 0
    double_file_start = 1
    single_file_restart = 2
    double_file_restart = 3
    not_pacing = 4


class PaceFlags:
    end_of_line = 0x01
    free_pass = 0x02
    waved_around = 0x04


class CarLeftRight:
    clear = 1  # no cars around us.
    car_left = 2  # there is a car to our left.
    car_right = 3  # there is a car to our right.
    car_left_right = 4  # there are cars on each side.
    two_cars_left = 5  # there are two cars to our left.
    two_cars_right = 6  # there are two cars to our right.


class FFBCommandMode:  # You can call this any time
    ffb_command_max_force = 0  # Set the maximum force when mapping steering torque force to direct input units (float in Nm)


class VideoCaptureMode:
    trigger_screen_shot = 0  # save a screenshot to disk
    start_video_capture = 1  # start capturing video
    end_video_capture = 2  # stop capturing video
    toggle_video_capture = 3  # toggle video capture on/off
    show_video_timer = 4  # show video timer in upper left corner of display
    hide_video_timer = 5  # hide video timer


class StatusField:
    status_connected = 1


class EngineWarnings:
    water_temp_warning = 0x01
    fuel_pressure_warning = 0x02
    oil_pressure_warning = 0x04
    engine_stalled = 0x08
    pit_speed_limiter = 0x10
    rev_limiter_active = 0x20
    oil_temp_warning = 0x40


class Flags:
    # global flags
    checkered = 0x0001
    white = 0x0002
    green = 0x0004
    yellow = 0x0008
    red = 0x0010
    blue = 0x0020
    debris = 0x0040
    crossed = 0x0080
    yellow_waving = 0x0100
    one_lap_to_green = 0x0200
    green_held = 0x0400
    ten_to_go = 0x0800
    five_to_go = 0x1000
    random_waving = 0x2000
    caution = 0x4000
    caution_waving = 0x8000

    # drivers black flags
    black = 0x010000
    disqualify = 0x020000
    servicible = 0x040000  # car is allowed service (not a flag)
    furled = 0x080000
    repair = 0x100000

    # start lights
    start_hidden = 0x10000000
    start_ready = 0x20000000
    start_set = 0x40000000
    start_go = 0x80000000


class TrkLoc:
    not_in_world = -1
    off_track = 0
    in_pit_stall = 1
    aproaching_pits = 2
    on_track = 3


class TrkSurf:
    not_in_world = -1
    undefined = 0
    asphalt_1 = 1
    asphalt_2 = 2
    asphalt_3 = 3
    asphalt_4 = 4
    concrete_1 = 5
    concrete_2 = 6
    racing_dirt_1 = 7
    racing_dirt_2 = 8
    paint_1 = 9
    paint_2 = 10
    rumble_1 = 11
    rumble_2 = 12
    rumble_3 = 13
    rumble_4 = 14
    grass_1 = 15
    grass_2 = 16
    grass_3 = 17
    grass_4 = 18
    dirt_1 = 19
    dirt_2 = 20
    dirt_3 = 21
    dirt_4 = 22
    sand = 23
    gravel_1 = 24
    gravel_2 = 25
    grasscrete = 26
    astroturf = 27


class SessionState:
    invalid = 0
    get_in_car = 1
    warmup = 2
    parade_laps = 3
    racing = 4
    checkered = 5
    cool_down = 6


class CameraState:
    is_session_screen = 0x0001  # the camera tool can only be activated if viewing the session screen (out of car)
    is_scenic_active = 0x0002  # the scenic camera is active (no focus car)

    # these can be changed with a broadcast message
    cam_tool_active = 0x0004
    ui_hidden = 0x0008
    use_auto_shot_selection = 0x0010
    use_temporary_edits = 0x0020
    use_key_acceleration = 0x0040
    use_key10x_acceleration = 0x0080
    use_mouse_aim_mode = 0x0100


class BroadcastMsg:
    cam_switch_pos = 0  # car position, group, camera
    cam_switch_num = 1  # driver #, group, camera
    cam_set_state = 2  # CameraState, unused, unused
    replay_set_play_speed = 3  # speed, slowMotion, unused
    replay_set_play_position = 4  # RpyPosMode, Frame Number (high, low)
    replay_search = 5  # RpySrchMode, unused, unused
    replay_set_state = 6  # RpyStateMode, unused, unused
    reload_textures = 7  # ReloadTexturesMode, carIdx, unused
    chat_command = 8  # ChatCommandMode, subCommand, unused
    pit_command = 9  # PitCommandMode, parameter
    telem_command = 10  # irsdk_TelemCommandMode, unused, unused
    ffb_command = 11  # irsdk_FFBCommandMode, value (float, high, low)
    replay_search_session_time = 12  # sessionNum, sessionTimeMS (high, low)
    video_capture = 13  # irsdk_VideoCaptureMode, unused, unused

