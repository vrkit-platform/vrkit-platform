import os

import click
from click import echo
from irsdk import IRDiskClient
from irsdk.models import LapMetadata
from irsdk.telmetry import all_lap_metadata, get_lap_trajectory


class ToolContext:
    disk_client: IRDiskClient = None
    debug: bool = False


@click.group()
@click.option('--debug/--no-debug', default=False)
@click.pass_context
def cli(ctx, debug):
    ctx.ensure_object(ToolContext)
    ctx.obj.debug = debug

    # click.echo(f"Debug mode is {'on' if debug else 'off'}")


@cli.group()
@click.option('-i', '--ibt', 'ibt_file', type=click.File('rb'), required=True)
@click.pass_context
def laps(ctx, ibt_file):
    ctx.ensure_object(ToolContext)
    ctx.obj.disk_client = IRDiskClient().open(ibt_file)


@laps.command("summary")
@click.option('--invalid', 'include_invalid_laps', type=bool, default=False)
@click.pass_context
def summary(ctx, include_invalid_laps: bool):
    client = ctx.obj.disk_client

    data = all_lap_metadata(client, include_invalid_laps)
    print(f"Total Laps: {len(data)}")
    fmt_header = "{:<3} {:<15} {:<15} {:<7}"
    fmt_record = "{:<3} {:<15} {:<15} {!r:<7}"
    echo(fmt_header.format('Lap', 'Time', 'Incident #', 'Valid'))
    for record in data:
        echo(fmt_record.format(record.lap, str(record.lap_time), record.incident_count, record.valid))


@laps.command("create_track_map")
@click.option(
    '--lap', 'lap_number',
    type=int,
    default=None,
    help="Lap to use for map, if not specified, then the quickest clean lap will be used."
)
@click.argument('output_file', type=click.File('wb'))
@click.pass_context
def create_track_map(ctx, lap_number, output_file):
    """Generate the data file used for VR track map

    INPUT_FILE is an IBT telemetry file
    OUTPUT_FILE is the destination for our custom format
    """
    client = ctx.obj.disk_client
    echo(f'Generating {output_file.name} from {client.filename}')

    data = all_lap_metadata(client, True)
    if len(data) < 2:
        raise click.ClickException('At least 2 laps of data required')

    del data[0]
    lap: LapMetadata | None = data[lap_number] if lap_number is not None else None

    if lap is None:
        for record in data:
            if lap is None or record.lap_time < lap.lap_time:
                lap = record

    echo(f'Using lap #{lap.lap} with a time of {lap.lap_time}s to generate track map')
    trajectory = get_lap_trajectory(client, lap.lap)
    if trajectory is None:
        raise ValueError('No trajectory')

    echo(f"points = {len(trajectory.path)}")

    trajectory_data = trajectory.SerializeToString()
    output_file.write(trajectory_data)
    echo(
        f"""Wrote trajectory 
         File: {output_file.name} 
         Size: {os.stat(output_file.name).st_size} bytes
         """
    )
