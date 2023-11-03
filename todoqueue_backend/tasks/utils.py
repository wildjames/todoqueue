from datetime import timedelta
from typing import List
from logging import getLogger
import math
from profanity_check import predict as is_profane
import random

logger = getLogger(__name__)


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


def piecewise_linear(x, gradient1, gradient2, threshold):
    """
    A piecewise linear function that increases with gradient1 up to a threshold,
    then transitions to gradient2.

    Args:
        x (float): The x value.
        gradient1 (float): The gradient of the first part of the function.
        gradient2 (float): The gradient of the second part of the function.
        threshold (float): The x value at which the function transitions from gradient1 to gradient2.

    Returns:
        float: The y value of the function at x.
    """
    if x <= threshold:
        return gradient1 * x
    else:
        return (gradient1 * threshold) + (gradient2 * (x - threshold))


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def bp_function(
    completion_time_minutes: float,
    grossness: float,
    grossnesses: List[float] = None,
    completion_times: List[float] = None,
) -> float:
    """Return the brownie points for a given completion time and grossness. Optionally, pass in a list of
    grossnesses and completion times to calculate the brownie points in the context of the history of how
    long it has taken to complete this task in the past.

    Args:
        completion_time_minutes (float): The time it took to complete the task in minutes.
        grossness (float): The grossness of the task.
        grossnesses (List[float], optional): A list of grossnesses for this task. Defaults to None.
        completion_times (List[float], optional): A list of completion times for this task. Defaults to None.

    Returns:
        float: The brownie points
    """
    
    if completion_time_minutes == 0:
        logger.debug("Completion time is 0, returning 0 brownie points")
        return 0
    
    user_gross_scale_range = [0, 5]
    output_gross_scale_range = [0, 100]

    # grossness = piecewise_linear(grossness, 1.0, 4.0, 2.5)
    grossness = renormalize(
        float(grossness), user_gross_scale_range, output_gross_scale_range
    )

    # completion_time_minutes = piecewise_linear(completion_time_minutes, 2.0, 0.75, 30)

    random_factor = 1 #random.uniform(1.0, 1.1)
    random_base = random.uniform(0, 50)

    # Calculate the brownie points
    # The sigmoid scales are just hand tuned to make the graph look nice
    brownie_points = 200 * sigmoid(completion_time_minutes / 20) + grossness - 100
    brownie_points = (brownie_points * random_factor) + random_base
    
    logger.debug(f"  Completion time: {completion_time_minutes}")
    logger.debug(f"  Grossness: {grossness}")
    logger.debug(f"  Random factor: {random_factor:.2f}")
    logger.debug(f"  Random base: {random_base:.2f}")
    logger.debug(f"  Brownie points: {brownie_points}")

    return int(brownie_points)


def validate_profanity(value):
    logger.info("Validating profanity")
    return is_profane([value])[0] == 1

