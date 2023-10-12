from datetime import timedelta
from typing import List
from logging import getLogger, INFO, basicConfig

logger = getLogger(__name__)
basicConfig(level=INFO)


def renormalize(value, old_range, new_range):
    old_range_width = old_range[1] - old_range[0]
    new_range_width = new_range[1] - new_range[0]
    new_value = (
        ((value - old_range[0]) * new_range_width) / old_range_width
    ) + new_range[0]
    return new_value


def parse_duration(duration_str):
    """Generate a timedelta object from a string formatted for a DurationField ("[-]DD HH:MM:SS")"""
    # Split by days and time
    if " " in duration_str:
        days_str, time_str = duration_str.split(" ")
        days = int(days_str)
    else:
        days = 0
        time_str = duration_str

    # Split time into hours, minutes, and seconds
    hours, minutes, seconds = map(int, time_str.split(":"))

    # Create a timedelta object
    return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)


def bp_function(completion_time_minutes: float, grossness: float, grossnesses: List[float]=None, completion_times: List[float]=None) -> float:
    """Return the brownie points for a given completion time and grossness. Optionally, pass in a list of 
    grossnesses and completion times to calculate the brownie points in the context of the history of how
    long it has taken to complete this task in the past.
    
    Args:
        completion_time_minutes (float): The time it took to complete the task in minutes.
        grossness (float): The grossness of the task.
        grossnesses (List[float], optional): A list of grossnesses for this task. Defaults to None.
        completion_times (List[float], optional): A list of completion times for this task. Defaults to None.
    """
    user_gross_scale_range = [0, 5]
    output_gross_scale_range = [0, 50]

    grossness = renormalize(
        float(grossness), user_gross_scale_range, output_gross_scale_range
    )

    # Calculate the brownie points
    brownie_points = completion_time_minutes + grossness
    logger.info(f"  Brownie points: {brownie_points}")

    return brownie_points
