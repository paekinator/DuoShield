from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import numpy as np
from sgp4.api import Satrec, WGS72
from utils import datetime_to_julian_date
from probability import compute_collision_probability_analysis, generate_maneuver_suggestions

@dataclass
class TLE:
    name: str
    l1: str
    l2: str

def sat_from_tle(l1: str, l2: str) -> Satrec:
    return Satrec.twoline2rv(l1, l2, WGS72)

def propagate_teme_km(sat: Satrec, t: datetime):
    jd, fr = datetime_to_julian_date(t)
    e, r, v = sat.sgp4(jd, fr)
    if e != 0:
        raise RuntimeError(f"SGP4 error code {e}")
    return np.array(r), np.array(v)  # km, km/s in TEME

def teme_to_lat_lon_alt(r_teme):
    """Convert TEME coordinates to latitude, longitude, altitude"""
    x, y, z = r_teme
    r = float(np.linalg.norm(r_teme))
    
    # Calculate latitude
    lat = np.arcsin(z / r) * 180 / np.pi
    
    # Calculate longitude
    lon = np.arctan2(y, x) * 180 / np.pi
    
    # Calculate altitude (subtract Earth radius ~6371 km)
    alt = r - 6371.0
    
    return {"lat": lat, "lon": lon, "alt": alt}

def get_orbital_position(tle: TLE, t: datetime) -> Dict:
    """Get current position of a satellite"""
    sat = sat_from_tle(tle.l1, tle.l2)
    r, v = propagate_teme_km(sat, t)
    pos = teme_to_lat_lon_alt(r)
    pos["x"] = float(r[0])
    pos["y"] = float(r[1])
    pos["z"] = float(r[2])
    pos["vx"] = float(v[0])
    pos["vy"] = float(v[1])
    pos["vz"] = float(v[2])
    return pos

def screen_conjunctions(user_tle: TLE, catalog: List[TLE],
                        window_hours: float = 24.0, step_seconds: float = 60.0,
                        threshold_km: float = 5.0, max_catalog: int = 300,
                        include_collision_probability: bool = True) -> List[Dict]:
    now = datetime.now(timezone.utc)
    tgrid = [now + timedelta(seconds=i) for i in range(0, int(window_hours*3600)+1, int(step_seconds))]
    user_sat = sat_from_tle(user_tle.l1, user_tle.l2)
    user_r, user_v = [], []
    for t in tgrid:
        r, v = propagate_teme_km(user_sat, t)
        user_r.append(r); user_v.append(v)
    user_r = np.vstack(user_r); user_v = np.vstack(user_v)

    results = []
    for idx, tle in enumerate(catalog[:max_catalog]):
        try:
            other = sat_from_tle(tle.l1, tle.l2)
        except Exception:
            continue
        dmins, relspeeds, tca_idx = [], [], 0
        for k, t in enumerate(tgrid):
            try:
                r2, v2 = propagate_teme_km(other, t)
            except Exception:
                dmins.append(np.inf); relspeeds.append(np.nan); continue
            dr = user_r[k] - r2
            dv = user_v[k] - v2
            d = float(np.linalg.norm(dr))
            dmins.append(d); relspeeds.append(float(np.linalg.norm(dv)))
            if d <= dmins[tca_idx]: tca_idx = k
        dmin = min(dmins)
        if dmin < threshold_km:
            # Get positions at TCA for collision probability analysis
            tca_time = tgrid[tca_idx]
            try:
                r1_tca, v1_tca = propagate_teme_km(user_sat, tca_time)
                r2_tca, v2_tca = propagate_teme_km(other, tca_time)
                r_rel = r1_tca - r2_tca
                v_rel = v1_tca - v2_tca
                
                result = {
                    "other_name": tle.name,
                    "min_distance_km": dmin,
                    "tca_utc": tca_time.isoformat(),
                    "rel_speed_km_s": relspeeds[tca_idx],
                    "catalog_index": idx
                }
                
                # Add collision probability analysis if requested
                if include_collision_probability:
                    try:
                        pc_analysis = compute_collision_probability_analysis(
                            r_rel, v_rel, user_tle.name, tle.name
                        )
                        result.update(pc_analysis)
                        
                        # Add maneuver suggestions based on collision probability
                        if "collision_probability" in result and result["collision_probability"].get("pc_2d") is not None:
                            pc_2d = result["collision_probability"]["pc_2d"]
                            suggestions = generate_maneuver_suggestions(r_rel, v_rel, pc_2d, tca_time)
                            result["maneuver_suggestions"] = suggestions
                            
                    except Exception as e:
                        print(f"Error computing collision probability for {tle.name}: {e}")
                        result["collision_probability"] = {"error": str(e)}
                        result["safety_level"] = "UNKNOWN"
                
                results.append(result)
                
            except Exception as e:
                print(f"Error processing TCA for {tle.name}: {e}")
                # Fallback to basic result without collision probability
                results.append({
                    "other_name": tle.name,
                    "min_distance_km": dmin,
                    "tca_utc": tca_time.isoformat(),
                    "rel_speed_km_s": relspeeds[tca_idx],
                    "catalog_index": idx,
                    "collision_probability": {"error": str(e)}
                })
    
    results.sort(key=lambda x: x["min_distance_km"])
    return results
