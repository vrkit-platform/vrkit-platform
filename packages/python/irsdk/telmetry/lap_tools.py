from datetime import timedelta
from math import floor

import folium

from irsdk import IRDiskClient
from irsdk.irsdk_disk_client import IRDiskClientIterator
from irsdk.models import LapMetadata, LapTrajectory, LapTrajectoryPoint


def all_lap_metadata(ir: IRDiskClient, include_invalid_laps: bool = False) -> list[LapMetadata]:
    """
    :param ir: An instance of the IRDiskClient class used to access data from iRacing.
    :param include_invalid_laps: A boolean indicating whether to include invalid laps in the result.

    :return: A list of LapMetadata objects representing the overview of laps. Each LapMetadata object contains
      information about the lap number, session time, and incident count.
    """
    data = ir.get_data_frame("SessionTime", "Lap", "LapCurrentLapTime", 'PlayerCarMyIncidentCount')
    lap_incident_data = data.groupby("Lap").aggregate({"SessionTime": 'max',"LapCurrentLapTime": 'max',"PlayerCarMyIncidentCount": 'max'})

    results: list[LapMetadata] = []
    previous_total_incident_count = 0
    lap_incident_data_tuples = lap_incident_data.itertuples()
    for incident_data_idx in range(len(lap_incident_data)):
        incident_data = next(lap_incident_data_tuples)  # lap_incident_data[incident_data_idx]
        lap_number = incident_data[0]
        lap_time = timedelta(seconds=incident_data[2])

        total_incident_count = incident_data[3]

        incident_count = total_incident_count - previous_total_incident_count

        previous_total_incident_count = total_incident_count

        results.append(
            LapMetadata(
                lap=lap_number,
                lap_time=floor(lap_time.total_seconds() * 1000.0),
                incident_count=incident_count,
                valid=incident_count == 0
            )
        )

    return results if not include_invalid_laps else list(filter(lambda lap: lap.valid, results))


def get_lap_trajectory(ir: IRDiskClient, lap: int) -> LapTrajectory:
    """
    :param ir: An instance of the IRDiskClient class used to access data from iRacing.
    :param lap: lap number to retrieve

    :return: LapTrajectory
    """
    data_iter = IRDiskClientIterator(ir)
    started = False
    current_incident_count = 0
    current_lap_time = 0
    trajectory: LapTrajectory | None = None
    while data_iter.next_record() is not None:
        current_lap = data_iter["Lap"]
        if started and current_lap != lap:
            return trajectory

        if current_lap < lap:
            continue

        if current_lap > lap:
            raise EOFError("Current lap is > requested lap, lap not found")

        current_lap_time, lap_percent_complete, lap_distance, lat, lon, alt, speed, current_incident_count = data_iter.get(
            "LapCurrentLapTime",
            "LapDistPct",
            "LapDist",
            "Lat",
            "Lon",
            "Alt",
            "Speed",
            "PlayerCarMyIncidentCount"
        )

        if not started:
            trajectory = LapTrajectory(metadata=LapMetadata(
                lap=lap,
                incident_count=current_incident_count,
                lap_time=0,
                valid=False
            ))
            started = True

        trajectory.path.append(LapTrajectoryPoint(
            lap_time=int(current_lap_time * 1000.0),
            lap_percent_complete=lap_percent_complete,
            lap_distance=lap_distance,
            latitude=lat,
            longitude=lon,
            altitude=alt,
            speed=speed
        ))

    if trajectory is not None:
        trajectory.metadata.incident_count = current_incident_count - trajectory.incident_count
        trajectory.metadata.valid = trajectory.incident_count == 0
        trajectory.metadata.lap_time = int(current_lap_time * 1000.0)

    return trajectory

def to_track_map(trajectory: LapTrajectory) -> folium.Map:
    points = [[point.latitude, point.longitude] for point in trajectory.path]
    lats = [point[0] for point in points]
    lons = [point[1] for point in points]

    lat_center = (max(lats) + min(lats)) / 2
    lon_center = (max(lons) + min(lons)) / 2

    track_map = folium.Map(location=[lat_center, lon_center], zoom_start=16)

    folium.PolyLine(points, color='red').add_to(track_map)
    return track_map


def show_lap_trajectory_in_browser(trajectory: LapTrajectory) -> None:
    to_track_map(trajectory).show_in_browser()