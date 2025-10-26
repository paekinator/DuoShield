import requests

KP_INDEX_URL = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
XRAY_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
SOLAR_WIND_URL = "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"
PROTON_FLUX_URL = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-6-hour.json"

def fetch_kp_index():
    try:
        r = requests.get(KP_INDEX_URL, timeout=20); r.raise_for_status(); return r.json()
    except Exception as e:
        return {"error": str(e), "source": KP_INDEX_URL}

def fetch_xray_flux():
    try:
        r = requests.get(XRAY_URL, timeout=20); r.raise_for_status(); return r.json()
    except Exception as e:
        return {"error": str(e), "source": XRAY_URL}

def fetch_solar_wind():
    try:
        r = requests.get(SOLAR_WIND_URL, timeout=20); r.raise_for_status(); return r.json()
    except Exception as e:
        return {"error": str(e), "source": SOLAR_WIND_URL}

def fetch_proton_flux():
    try:
        r = requests.get(PROTON_FLUX_URL, timeout=20); r.raise_for_status(); return r.json()
    except Exception as e:
        return {"error": str(e), "source": PROTON_FLUX_URL}

def summarize_space_weather():
    kp = fetch_kp_index()
    xray = fetch_xray_flux()
    kp_latest = kp[-1] if isinstance(kp, list) and kp else None
    try:
        kp_val = float(kp_latest.get("kp_index") or kp_latest.get("kp", 0)) if kp_latest else 0
        risk = "elevated" if kp_val >= 5 else "nominal"
    except Exception:
        risk = "unknown"
    return {"kp_latest": kp_latest, "xray_sample_len": len(xray) if isinstance(xray, list) else 0, "geomagnetic_risk": risk}

def get_location_specific_weather(lat: float, lon: float, alt: float):
    """Get space weather data specific to a location"""
    # Get base space weather data
    base_weather = get_detailed_space_weather()
    
    # Calculate location-specific modifications
    # Higher altitudes experience stronger solar wind effects
    altitude_factor = 1.0 + (alt / 1000.0) * 0.1  # 10% increase per 1000km altitude
    
    # Polar regions experience stronger geomagnetic effects
    geomag_factor = 1.0
    if abs(lat) > 60:  # Polar regions
        geomag_factor = 1.5
    elif abs(lat) > 30:  # Mid-latitudes
        geomag_factor = 1.2
    
    # Modify solar wind speed based on location
    modified_speed = base_weather["solar_wind"]["speed_km_s"] * altitude_factor
    
    # Modify KP index based on geomagnetic latitude
    modified_kp = base_weather["kp_index"]["value"] * geomag_factor
    modified_kp = min(modified_kp, 9.0)  # Cap at maximum KP
    
    # Update the base weather with location-specific values
    base_weather["solar_wind"]["speed_km_s"] = modified_speed
    base_weather["kp_index"]["value"] = modified_kp
    
    # Recalculate risk levels based on modified values
    if modified_kp >= 7:
        base_weather["kp_index"]["level"] = "SEVERE"
        base_weather["kp_index"]["risk"] = "HIGH"
    elif modified_kp >= 5:
        base_weather["kp_index"]["level"] = "MODERATE" 
        base_weather["kp_index"]["risk"] = "ELEVATED"
    else:
        base_weather["kp_index"]["level"] = "QUIET"
        base_weather["kp_index"]["risk"] = "LOW"
    
    # Add location-specific threats
    location_threats = []
    if abs(lat) > 60 and modified_kp > 3:
        location_threats.append({
            "type": "Polar Region Geomagnetic Activity",
            "level": "HIGH" if modified_kp > 5 else "MODERATE",
            "impact": "Enhanced radiation exposure in polar regions",
            "recommendation": "Monitor radiation levels, consider orbit adjustment"
        })
    
    if alt > 1000:  # High altitude
        location_threats.append({
            "type": "High Altitude Solar Wind",
            "level": "MODERATE",
            "impact": "Increased atmospheric drag and radiation exposure",
            "recommendation": "Monitor orbital decay, check power systems"
        })
    
    # Add location-specific threats to existing threats
    base_weather["threats"] = location_threats + base_weather["threats"]
    
    return base_weather

def get_detailed_space_weather():
    """Get comprehensive space weather data"""
    kp = fetch_kp_index()
    xray = fetch_xray_flux()
    solar_wind = fetch_solar_wind()
    proton_flux = fetch_proton_flux()
    
    # Process KP index
    kp_latest = kp[-1] if isinstance(kp, list) and kp else None
    kp_val = 0
    try:
        kp_val = float(kp_latest.get("kp_index") or kp_latest.get("kp", 0)) if kp_latest else 0
    except Exception:
        pass
    
    # Determine geomagnetic storm level
    if kp_val >= 7:
        geomag_level = "SEVERE"
        geomag_risk = "HIGH"
    elif kp_val >= 5:
        geomag_level = "MODERATE"
        geomag_risk = "ELEVATED"
    else:
        geomag_level = "QUIET"
        geomag_risk = "LOW"
    
    # Process X-ray flux for solar flares
    xray_latest = None
    solar_flare_risk = "LOW"
    if isinstance(xray, list) and xray:
        xray_latest = xray[-1]
        try:
            flux = float(xray_latest.get("flux", 0))
            if flux > 1e-4:
                solar_flare_risk = "HIGH"
            elif flux > 1e-5:
                solar_flare_risk = "MODERATE"
        except Exception:
            pass
    
    # Process solar wind
    solar_wind_latest = None
    solar_wind_speed = 0
    if isinstance(solar_wind, list) and solar_wind:
        solar_wind_latest = solar_wind[-1]
        try:
            # Calculate solar wind speed from magnetic field data
            # This is a simplified calculation - real solar wind speed
            # requires more complex analysis of the magnetic field
            bt = float(solar_wind_latest.get("bt", 0))
            bx = float(solar_wind_latest.get("bx_gse", 0))
            by = float(solar_wind_latest.get("by_gse", 0))
            bz = float(solar_wind_latest.get("bz_gse", 0))
            
            # Simple approximation: higher magnetic field strength
            # generally correlates with higher solar wind speed
            if bt > 0:
                # Rough approximation: 300-800 km/s range based on Bt
                solar_wind_speed = 300 + (bt * 50)  # Scale factor for approximation
                solar_wind_speed = min(solar_wind_speed, 800)  # Cap at reasonable max
            else:
                solar_wind_speed = 400  # Default moderate speed
        except Exception:
            solar_wind_speed = 400  # Default moderate speed
    
    # Overall threat assessment
    threats = []
    if geomag_risk == "HIGH":
        threats.append({
            "type": "Geomagnetic Storm",
            "level": "CRITICAL",
            "impact": "Potential satellite drag increase, orientation control issues",
            "recommendation": "Monitor orbit closely, prepare for potential drag compensation"
        })
    elif geomag_risk == "ELEVATED":
        threats.append({
            "type": "Geomagnetic Activity",
            "level": "HIGH",
            "impact": "Increased atmospheric drag, minor communication disruption",
            "recommendation": "Monitor telemetry, standby for maneuvers"
        })
    
    if solar_flare_risk == "HIGH":
        threats.append({
            "type": "Solar Flare",
            "level": "CRITICAL",
            "impact": "Radiation damage risk, communication blackouts possible",
            "recommendation": "Enable radiation hardening protocols, prepare backup comm"
        })
    
    if solar_wind_speed > 600:
        threats.append({
            "type": "High-Speed Solar Wind",
            "level": "HIGH",
            "impact": "Increased radiation exposure, potential system anomalies",
            "recommendation": "Monitor power systems, check radiation shielding"
        })
    
    # Only add threats if there are actual dangers - no "nominal conditions" threat
    
    return {
        "kp_index": {
            "value": kp_val,
            "level": geomag_level,
            "risk": geomag_risk,
            "latest": kp_latest
        },
        "solar_flare": {
            "risk": solar_flare_risk,
            "xray_latest": xray_latest,
            "data_points": len(xray) if isinstance(xray, list) else 0
        },
        "solar_wind": {
            "speed_km_s": solar_wind_speed,
            "latest": solar_wind_latest
        },
        "proton_flux": {
            "data_points": len(proton_flux) if isinstance(proton_flux, list) else 0
        },
        "threats": threats,
        "overall_risk": geomag_risk if geomag_risk in ["HIGH", "ELEVATED"] else solar_flare_risk
    }
