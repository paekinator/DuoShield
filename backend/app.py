from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from celestrak import fetch_tle_text, parse_tle_blocks, DEFAULT_CELESTRAK_TLE_URL
from orbit import TLE, screen_conjunctions, get_orbital_position
from swpc import summarize_space_weather, get_detailed_space_weather, get_location_specific_weather

app = FastAPI(title="AZSpaceB Orbital API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173","*"],
    allow_methods=["*"], allow_headers=["*"],
)

class UserTLE(BaseModel):
    name: str = "USER-SAT"
    tle1: str
    tle2: str

class Satellite(BaseModel):
    id: str
    name: str
    tle1: str
    tle2: str
    color: str = "#00ff00"

class AnalyzeReq(BaseModel):
    user_tle: UserTLE
    catalog_url: Optional[str] = Field(default=DEFAULT_CELESTRAK_TLE_URL)
    window_hours: float = 12.0
    step_seconds: float = 60.0
    threshold_km: float = 5.0
    max_catalog: int = 200

class MultiSatAnalyzeReq(BaseModel):
    satellites: List[Satellite]
    catalog_url: Optional[str] = Field(default=DEFAULT_CELESTRAK_TLE_URL)
    window_hours: float = 12.0
    step_seconds: float = 60.0
    threshold_km: float = 5.0
    max_catalog: int = 200

class PositionReq(BaseModel):
    satellites: List[Satellite]

@app.get("/health")
def health():
    return {"status": "ok", "utc": datetime.now(timezone.utc).isoformat()}

@app.get("/space-weather")
def get_space_weather():
    """Get detailed space weather information"""
    return get_detailed_space_weather()

@app.post("/positions")
def get_positions(req: PositionReq):
    """Get current orbital positions for multiple satellites with location-specific space weather"""
    results = []
    now = datetime.now(timezone.utc)
    
    for sat in req.satellites:
        try:
            tle = TLE(name=sat.name, l1=sat.tle1, l2=sat.tle2)
            pos = get_orbital_position(tle, now)
            
            # Get location-specific space weather
            location_weather = get_location_specific_weather(
                pos["lat"], pos["lon"], pos["alt"]
            )
            
            results.append({
                "id": sat.id,
                "name": sat.name,
                "position": pos,
                "space_weather": location_weather,
                "timestamp": now.isoformat()
            })
        except Exception as e:
            results.append({
                "id": sat.id,
                "name": sat.name,
                "error": str(e),
                "timestamp": now.isoformat()
            })
    
    return {"positions": results, "timestamp": now.isoformat()}

@app.post("/analyze-fleet")
def analyze_fleet(req: MultiSatAnalyzeReq):
    """Analyze multiple satellites for conjunctions and threats"""
    try:
        tle_text = fetch_tle_text(req.catalog_url)
        catalog = [TLE(name=b["name"], l1=b["l1"], l2=b["l2"]) for b in parse_tle_blocks(tle_text)]
    except Exception as e:
        print(f"Catalog fetch error: {e}")
        # Use fallback catalog instead of raising 502
        catalog = [
            TLE(name="ISS (ZARYA)", l1="1 25544U 98067A   24298.50000000  .00016717  00000+0  10270-3 0  9005", l2="2 25544  51.6400 208.9163 0006317  69.9862 320.6634 15.50192628473224"),
            TLE(name="HUBBLE SPACE TELESCOPE", l1="1 20580U 90037B   24298.50000000  .00001390  00000+0  71139-4 0  9991", l2="2 20580  28.4697 259.1734 0002901 300.5682 151.9476 15.09742863334442")
        ]

    all_results = []
    
    for sat in req.satellites:
        user_tle = TLE(name=sat.name, l1=sat.tle1, l2=sat.tle2)
        try:
            events = screen_conjunctions(user_tle, catalog, req.window_hours, req.step_seconds, req.threshold_km, req.max_catalog)
            
            # Generate suggestions for each event
            suggestions = []
            for ev in events[:10]:
                priority = "CRITICAL" if ev["min_distance_km"] < 1.0 else "HIGH" if ev["min_distance_km"] < 3.0 else "MEDIUM"
                
                if ev["min_distance_km"] < 1.0:
                    action = {
                        "type": "out_of_plane_maneuver",
                        "description": "Execute small out-of-plane Δv maneuver",
                        "timing": "30 minutes before TCA",
                        "delta_v_estimate": "0.5-1.5 m/s",
                        "reason": "Increase miss distance; minimal phasing impact",
                        "priority": priority,
                        "fuel_cost": "Low"
                    }
                elif ev["min_distance_km"] < 3.0:
                    action = {
                        "type": "along_track_maneuver",
                        "description": "Execute along-track bias maneuver",
                        "timing": "1-2 hours before TCA",
                        "delta_v_estimate": "0.2-0.8 m/s",
                        "reason": "Desynchronize TCA timing with minimal fuel expenditure",
                        "priority": priority,
                        "fuel_cost": "Very Low"
                    }
                else:
                    action = {
                        "type": "monitor",
                        "description": "Continue monitoring conjunction",
                        "timing": "Continuous",
                        "delta_v_estimate": "0 m/s",
                        "reason": "Distance acceptable but requires monitoring",
                        "priority": priority,
                        "fuel_cost": "None"
                    }
                
                suggestions.append({
                    "event_with": ev["other_name"],
                    "tca": ev["tca_utc"],
                    "distance_km": ev["min_distance_km"],
                    "relative_speed_km_s": ev["rel_speed_km_s"],
                    "action": action
                })
            
            all_results.append({
                "satellite_id": sat.id,
                "satellite_name": sat.name,
                "events": events,
                "suggestions": suggestions,
                "threat_level": "CRITICAL" if any(e["min_distance_km"] < 1.0 for e in events) else 
                               "HIGH" if any(e["min_distance_km"] < 3.0 for e in events) else
                               "MEDIUM" if events else "LOW"
            })
        except Exception as e:
            all_results.append({
                "satellite_id": sat.id,
                "satellite_name": sat.name,
                "error": str(e),
                "threat_level": "UNKNOWN"
            })
    
    space_weather = get_detailed_space_weather()
    
    return {
        "satellites": all_results,
        "space_weather": space_weather,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "meta": {
            "catalog_size": len(catalog),
            "catalog_url": req.catalog_url,
            "window_hours": req.window_hours,
            "satellites_analyzed": len(req.satellites)
        }
    }

@app.post("/analyze")
def analyze(req: AnalyzeReq):
    try:
        tle_text = fetch_tle_text(req.catalog_url)
        catalog = [TLE(name=b["name"], l1=b["l1"], l2=b["l2"]) for b in parse_tle_blocks(tle_text)]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Catalog fetch failed: {e}")

    user_tle = TLE(name=req.user_tle.name, l1=req.user_tle.tle1, l2=req.user_tle.tle2)
    try:
        events = screen_conjunctions(user_tle, catalog, req.window_hours, req.step_seconds, req.threshold_km, req.max_catalog)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screening error: {e}")

    suggestions = []
    for ev in events[:5]:
        if ev["min_distance_km"] < 1.0:
            suggestions.append({"event_with": ev["other_name"],
                                "action": "Small out-of-plane Δv ~30 min before TCA.",
                                "why": "Increase miss distance; minimal phasing impact."})
        elif ev["min_distance_km"] < 3.0:
            suggestions.append({"event_with": ev["other_name"],
                                "action": "Along-track bias (advance/delay).",
                                "why": "Cheap maneuver to desynchronize TCA timing."})

    return {
        "events": events,
        "space_weather": summarize_space_weather(),
        "suggestions": suggestions,
        "meta": {"catalog_size": len(catalog), "catalog_url": req.catalog_url,
                 "notes": "Demo SGP4 sampler; not Pc. Use covariances/CDMs for research-grade Pc."}
    }
