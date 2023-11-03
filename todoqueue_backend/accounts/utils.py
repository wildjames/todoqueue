from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta

from logging import getLogger, DEBUG, basicConfig
basicConfig(level=DEBUG)
logger = getLogger(__name__)

def is_rate_limited(identifier, request_type, max_attempts=5, period=timedelta(hours=1)):
    """
    Check if the identifier has exceeded the maximum number of attempts within the period.
    """
    logger.debug("Checking rate limit")
    
    current_time = timezone.now()
    cache_key = f"password_reset_attempts_{request_type}_{identifier}"
    attempts = cache.get(cache_key, [])

    # Filter out attempts older than the rate-limiting period
    attempts = [attempt for attempt in attempts if current_time - attempt < period]

    logger.debug(f"Endpoint {cache_key} attempts: {len(attempts)}")
    if len(attempts) >= max_attempts:
        return True

    # Add the current attempt and update the cache
    attempts.append(current_time)
    cache.set(cache_key, attempts, period.total_seconds())

    return False