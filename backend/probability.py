"""
Collision Probability (Pc) Calculations
Based on the orbital conjunction analysis specification
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone
import math

def compute_encounter_plane(r_rel: np.ndarray, v_rel: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute encounter plane basis vectors for 2D collision probability
    
    Args:
        r_rel: Relative position vector (km)
        v_rel: Relative velocity vector (km/s)
    
    Returns:
        u_hat: Direction of relative motion (unit vector)
        e1, e2: Orthonormal basis spanning encounter plane
    """
    # Direction of relative motion
    u_hat = v_rel / np.linalg.norm(v_rel)
    
    # Create orthonormal basis for encounter plane
    # Choose e1 perpendicular to u_hat
    if abs(u_hat[2]) < 0.9:
        e1 = np.cross(u_hat, np.array([0, 0, 1]))
    else:
        e1 = np.cross(u_hat, np.array([1, 0, 0]))
    e1 = e1 / np.linalg.norm(e1)
    
    # e2 completes the orthonormal basis
    e2 = np.cross(u_hat, e1)
    e2 = e2 / np.linalg.norm(e2)
    
    return u_hat, e1, e2

def project_to_encounter_plane(r_rel: np.ndarray, e1: np.ndarray, e2: np.ndarray) -> np.ndarray:
    """
    Project 3D relative position to 2D encounter plane
    
    Args:
        r_rel: 3D relative position vector
        e1, e2: Encounter plane basis vectors
    
    Returns:
        mu_2d: 2D mean position in encounter plane
    """
    return np.array([np.dot(e1, r_rel), np.dot(e2, r_rel)])

def compute_2d_collision_probability(mu_2d: np.ndarray, P_2d: np.ndarray, hbr_m: float) -> float:
    """
    Compute 2D collision probability using Chan/Alfriend approximation
    
    Args:
        mu_2d: 2D mean position in encounter plane
        P_2d: 2D covariance matrix in encounter plane
        hbr_m: Hard Body Radius in meters
    
    Returns:
        Pc: Collision probability (0-1)
    """
    try:
        # Convert HBR from meters to km
        hbr_km = hbr_m / 1000.0
        
        # Check if covariance is positive definite
        eigenvals = np.linalg.eigvals(P_2d)
        if np.any(eigenvals <= 0):
            # Regularize covariance
            P_2d = P_2d + np.eye(2) * 1e-6
        
        # Cholesky decomposition
        L = np.linalg.cholesky(P_2d)
        
        # Transform to whitened coordinates
        y = np.linalg.solve(L, mu_2d)
        
        # Mahalanobis distance
        d_mahal = np.linalg.norm(y)
        
        # Chan/Alfriend approximation for 2D Gaussian integral over circle
        if d_mahal == 0:
            # Special case: mean at origin
            Pc = 1 - np.exp(-0.5 * (hbr_km**2) / np.linalg.det(P_2d))
        else:
            # General case
            sigma_eff = np.sqrt(np.linalg.det(P_2d))
            r_norm = hbr_km / sigma_eff
            
            if d_mahal < r_norm:
                # Mean inside circle
                Pc = 1 - np.exp(-0.5 * r_norm**2) * (1 + 0.5 * r_norm**2)
            else:
                # Mean outside circle
                Pc = np.exp(-0.5 * (d_mahal - r_norm)**2) * (1 - np.exp(-0.5 * r_norm**2))
        
        return max(0.0, min(1.0, Pc))
        
    except Exception as e:
        print(f"Error computing 2D collision probability: {e}")
        return 0.0

def compute_mahalanobis_distance(mu_2d: np.ndarray, P_2d: np.ndarray) -> float:
    """
    Compute Mahalanobis miss distance for diagnostics
    
    Args:
        mu_2d: 2D mean position
        P_2d: 2D covariance matrix
    
    Returns:
        Mahalanobis distance
    """
    try:
        P_inv = np.linalg.inv(P_2d)
        return np.sqrt(mu_2d.T @ P_inv @ mu_2d)
    except:
        return float('inf')

def estimate_hard_body_radius(sat1_name: str, sat2_name: str) -> float:
    """
    Estimate Hard Body Radius (HBR) for collision probability
    
    Args:
        sat1_name, sat2_name: Satellite names for size estimation
    
    Returns:
        HBR in meters
    """
    # Default HBR estimates based on satellite type
    # This is a simplified model - in practice, use actual satellite dimensions
    
    # ISS and large satellites
    if any(keyword in sat1_name.upper() for keyword in ['ISS', 'SPACE STATION', 'TIANGONG']):
        r1 = 50.0  # meters
    elif any(keyword in sat1_name.upper() for keyword in ['STARLINK', 'ONEWEB', 'KEPLER']):
        r1 = 3.0   # meters
    else:
        r1 = 5.0   # default
    
    if any(keyword in sat2_name.upper() for keyword in ['ISS', 'SPACE STATION', 'TIANGONG']):
        r2 = 50.0
    elif any(keyword in sat2_name.upper() for keyword in ['STARLINK', 'ONEWEB', 'KEPLER']):
        r2 = 3.0
    else:
        r2 = 5.0
    
    return r1 + r2

def compute_collision_probability_analysis(
    r_rel: np.ndarray, 
    v_rel: np.ndarray, 
    sat1_name: str, 
    sat2_name: str,
    P_rel: Optional[np.ndarray] = None
) -> Dict:
    """
    Complete collision probability analysis for a conjunction
    
    Args:
        r_rel: Relative position vector (km)
        v_rel: Relative velocity vector (km/s)
        sat1_name, sat2_name: Satellite names
        P_rel: Relative covariance matrix (optional)
    
    Returns:
        Dictionary with collision probability analysis
    """
    try:
        # Basic encounter parameters
        d_min = np.linalg.norm(r_rel)
        v_rel_mag = np.linalg.norm(v_rel)
        
        # Estimate Hard Body Radius
        hbr_m = estimate_hard_body_radius(sat1_name, sat2_name)
    except Exception as e:
        print(f"Error in basic parameters: {e}")
        return {
            "min_distance_km": 0,
            "relative_speed_km_s": 0,
            "hbr_meters": 10,
            "collision_probability": {"error": str(e)},
            "safety_level": "UNKNOWN"
        }
    
    result = {
        "min_distance_km": d_min,
        "relative_speed_km_s": v_rel_mag,
        "hbr_meters": hbr_m,
        "collision_probability": {
            "pc_2d": None,
            "pc_3d": None,
            "pc_mc": None,
            "mahalanobis_distance": None,
            "encounter_plane": {
                "mu_2d": None,
                "P_2d": None
            }
        }
    }
    
    # If no covariance provided, use simplified model
    if P_rel is None:
        # Create a simple covariance based on distance and velocity
        # This is a heuristic - in practice, use proper covariance propagation
        sigma_pos = max(0.1, d_min * 0.1)  # 10% of distance, minimum 100m
        sigma_vel = max(0.01, v_rel_mag * 0.05)  # 5% of velocity
        
        # Create diagonal covariance (uncorrelated)
        P_rel = np.diag([sigma_pos**2, sigma_pos**2, sigma_pos**2, 
                        sigma_vel**2, sigma_vel**2, sigma_vel**2])
    
    try:
        # Compute encounter plane
        u_hat, e1, e2 = compute_encounter_plane(r_rel, v_rel)
        
        # Project to encounter plane
        mu_2d = project_to_encounter_plane(r_rel, e1, e2)
        
        # Project covariance to encounter plane
        E = np.array([e1, e2])  # Projection matrix
        P_2d = E @ P_rel[:3, :3] @ E.T  # Only position covariance
        
        # Compute 2D collision probability
        pc_2d = compute_2d_collision_probability(mu_2d, P_2d, hbr_m)
        
        # Compute Mahalanobis distance
        mahal_dist = compute_mahalanobis_distance(mu_2d, P_2d)
        
        # Update result
        result["collision_probability"]["pc_2d"] = pc_2d
        result["collision_probability"]["mahalanobis_distance"] = mahal_dist
        result["collision_probability"]["encounter_plane"]["mu_2d"] = mu_2d.tolist()
        result["collision_probability"]["encounter_plane"]["P_2d"] = P_2d.tolist()
        
        # Safety assessment
        if pc_2d > 1e-4:
            result["safety_level"] = "CRITICAL"
        elif pc_2d > 1e-5:
            result["safety_level"] = "HIGH"
        elif pc_2d > 1e-6:
            result["safety_level"] = "MEDIUM"
        else:
            result["safety_level"] = "LOW"
            
    except Exception as e:
        print(f"Error in collision probability analysis: {e}")
        result["collision_probability"]["error"] = str(e)
        result["safety_level"] = "UNKNOWN"
    
    return result

def generate_maneuver_suggestions(
    r_rel: np.ndarray, 
    v_rel: np.ndarray, 
    pc_2d: float,
    tca_utc: datetime
) -> List[Dict]:
    """
    Generate maneuver suggestions based on collision probability
    
    Args:
        r_rel: Relative position at TCA
        v_rel: Relative velocity at TCA
        pc_2d: 2D collision probability
        tca_utc: Time of closest approach
    
    Returns:
        List of maneuver suggestions
    """
    suggestions = []
    
    if pc_2d > 1e-4:  # Critical threshold
        # Out-of-plane maneuver (most effective for increasing miss distance)
        suggestions.append({
            "type": "out_of_plane_maneuver",
            "description": "Execute small out-of-plane Δv maneuver",
            "timing": "30 minutes before TCA",
            "delta_v_estimate": "0.5-1.5 m/s",
            "direction": "Cross-track (out-of-plane)",
            "reason": "Increase miss distance; minimal phasing impact",
            "priority": "CRITICAL",
            "fuel_cost": "Low",
            "expected_effectiveness": "High"
        })
        
    elif pc_2d > 1e-5:  # High threshold
        # Along-track maneuver
        suggestions.append({
            "type": "along_track_maneuver", 
            "description": "Execute along-track bias maneuver",
            "timing": "1-2 hours before TCA",
            "delta_v_estimate": "0.2-0.8 m/s",
            "direction": "Along-track",
            "reason": "Desynchronize TCA timing with minimal fuel expenditure",
            "priority": "HIGH",
            "fuel_cost": "Very Low",
            "expected_effectiveness": "Medium"
        })
        
    elif pc_2d > 1e-6:  # Medium threshold
        # Monitoring recommendation
        suggestions.append({
            "type": "monitor",
            "description": "Continue monitoring conjunction",
            "timing": "Continuous",
            "delta_v_estimate": "0 m/s",
            "direction": "None",
            "reason": "Distance acceptable but requires monitoring",
            "priority": "MEDIUM",
            "fuel_cost": "None",
            "expected_effectiveness": "N/A"
        })
    
    return suggestions
