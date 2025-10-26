from datetime import datetime, timezone
import math

def datetime_to_julian_date(dt: datetime):
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    year = dt.year
    month = dt.month
    day = dt.day + (dt.hour + (dt.minute + (dt.second + dt.microsecond/1e6)/60)/60)/24.0
    if month <= 2:
        year -= 1
        month += 12
    A = math.floor(year/100)
    B = 2 - A + math.floor(A/4)
    jd = math.floor(365.25*(year + 4716)) + math.floor(30.6001*(month + 1)) + day + B - 1524.5
    jd_int = math.floor(jd)
    fr = jd - jd_int
    return jd_int, fr
