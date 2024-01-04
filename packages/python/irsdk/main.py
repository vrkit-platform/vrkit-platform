from enum import Enum

import folium

from irsdk.live_session import process_live_session

import irsdk.irsdk_disk_client
from util.logging import info

import irsdk_client


def process_ibt_file():
    ibt_file = "Y:\\data\\local-share\\iracing\\telemetry\\ligierjsp320_twinring fullrc 2023-12-24 22-43-26.ibt"
    # ir = irsdk.IRSDK()
    # ir.startup(test_file=ibt_file)
    # ir.freeze_var_buffer_latest()

    ir = irsdk.irsdk_disk_client.IRDiskClient()
    ir.open(ibt_file)

    info(f"record_count={ir.record_count}")
    speed_pairs = ["Speed", list(filter(lambda v: v is not None and v != 0.0, ir.get_all("Speed")))]

    lats = list(filter(lambda v: v is not None and v != 0.0, ir.get_all("Lat")))
    lons = list(filter(lambda v: v is not None and v != 0.0, ir.get_all("Lon")))
    coords = list(zip(lats, lons))

    lat_center = (max(lats) + min(lats)) / 2
    lon_center = (max(lons) + min(lons)) / 2

    lat_pairs = ["Latitude", lats]
    lon_pairs = ["Longitude", lons]

    for [label, values] in [lat_pairs, lon_pairs, speed_pairs]:
        info(label)
        info(f"count={len(values)},max={max(values)},max={min(values)},avg={sum(values) / len(values)}`")
        info(" ")

    # Create a map centered on Iran
    session_map = folium.Map(location=[lat_center, lon_center], zoom_start=16)

    # Loop through the data and add markers for each location
    # for i, row in coords:
    #     folium.Marker(
    #         [row['Latitude'], row['Longitude']],
    #         popup=row['Location']
    #     ).add_to(session_map)

    # Add a line to connect the markers
    locations = coords  # data[['Latitude', 'Longitude']].values.tolist()
    folium.PolyLine(locations, color='red').add_to(session_map)
    session_map.show_in_browser()


# if __name__ == "__main__":
#     # process_ibt_file()
#     process_live_session()
