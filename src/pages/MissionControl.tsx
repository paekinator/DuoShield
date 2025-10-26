import { useState, useEffect, useCallback } from 'react';
import EarthVisualization from '../components/EarthVisualization';
import AlertPanel from '../components/AlertPanel';
import DecisionDashboard from '../components/DecisionDashboard';
import SpaceWeatherPanel from '../components/SpaceWeatherPanel';
import AlertDetailOverlay from '../components/AlertDetailOverlay';
import './MissionControl.css';

const API = import.meta.env.VITE_API_BASE ?? "https://azspace-production.railway.app";

interface Satellite {
  id: string;
  name: string;
  tle1: string;
  tle2: string;
  color: string;
  status: 'active' | 'warning' | 'critical';
  position?: {
    lat: number;
    lon: number;
    alt: number;
    x: number;
    y: number;
    z: number;
  };
  threatLevel?: string;
  safetyLevel?: string;
  collisionProbability?: {
    pc_2d?: number;
    pc_3d?: number;
    pc_mc?: number;
    mahalanobis_distance?: number;
    safety_level?: string;
  };
}

interface Alert {
  id: string;
  satelliteName: string;
  type: 'conjunction' | 'space_weather' | 'system';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
  distance?: number;
  tca?: string;
  acknowledged: boolean;
  details?: {
    distance?: number;
    tca?: string;
    relativeSpeed?: number;
    probability?: number;
    confidence?: number;
    source?: string;
    recommendation?: string;
    impact?: string;
    mitigation?: string;
  };
}

interface Decision {
  id: string;
  satelliteName: string;
  suggestion: any;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'rejected';
}

const MissionControl = () => {
  const [mounted, setMounted] = useState(false);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [spaceWeather, setSpaceWeather] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddSatellite, setShowAddSatellite] = useState(false);
  const [autoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSatellite, setNewSatellite] = useState({
    name: '',
    tle1: '',
    tle2: '',
    color: '#00ff00'
  });

  // Mount component safely
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);


  // Fetch space weather (global or location-specific)
  const fetchSpaceWeather = useCallback(async (selectedSatelliteId?: string) => {
    if (!mounted) return;
    setLoading(true);
    try {
      let response;
      if (selectedSatelliteId && satellites.length > 0) {
        // Get location-specific weather for selected satellite
        const selectedSat = satellites.find(s => s.id === selectedSatelliteId);
        if (selectedSat) {
          const positionReq = {
            satellites: [{
              id: selectedSat.id,
              name: selectedSat.name,
              tle1: selectedSat.tle1,
              tle2: selectedSat.tle2
            }]
          };
          response = await fetch(`${API}/positions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(positionReq)
          });
          if (response.ok) {
            const data = await response.json();
            if (data.positions && data.positions[0] && data.positions[0].space_weather) {
              const weatherData = data.positions[0].space_weather;
              setSpaceWeather(weatherData);
              
              // Convert space weather threats to alerts and decisions (only for actual dangers)
              if (weatherData.threats && weatherData.threats.length > 0) {
                const selectedSat = satellites.find(s => s.id === selectedSatelliteId);
                const satelliteName = selectedSat?.name || 'Unknown Satellite';
                
                // Filter out normal/low-risk conditions - only create alerts for actual dangers
                const dangerousThreats = weatherData.threats.filter((threat: any) => {
                  // Skip normal conditions and low-risk items
                  if (threat.type === 'Nominal Conditions' || 
                      threat.level === 'LOW' || 
                      threat.type.includes('Normal') ||
                      threat.type.includes('Nominal')) {
                    return false;
                  }
                  // Only include MEDIUM, HIGH, CRITICAL threats
                  return threat.level === 'MEDIUM' || threat.level === 'HIGH' || threat.level === 'CRITICAL';
                });
                
                if (dangerousThreats.length > 0) {
                  // Create alerts from dangerous threats only
                  const newAlerts = dangerousThreats.map((threat: any, index: number) => ({
                    id: `weather-${selectedSatelliteId}-${index}-${Date.now()}`,
                    satelliteName: satelliteName,
                    type: 'space_weather' as const,
                    severity: threat.level as 'CRITICAL' | 'HIGH' | 'MEDIUM',
                    message: `${threat.type}: ${threat.impact}`,
                    timestamp: new Date().toISOString(),
                    acknowledged: false
                  }));
                  
                  // Create decisions from dangerous threats only
                  const newDecisions = dangerousThreats.map((threat: any, index: number) => ({
                    id: `weather-decision-${selectedSatelliteId}-${index}-${Date.now()}`,
                    satelliteName: satelliteName,
                    suggestion: {
                      type: 'space_weather_mitigation',
                      threat: threat.type,
                      recommendation: threat.recommendation,
                      priority: threat.level
                    },
                    status: 'pending' as const
                  }));
                  
                  // Add new alerts and decisions
                  setAlerts(prev => [...newAlerts, ...prev]);
                  setDecisions(prev => [...newDecisions, ...prev]);
                }
              }
              
              setError(null);
              return;
            }
          }
        }
      }
      
      // Fallback to global space weather
      response = await fetch(`${API}/space-weather`);
      if (!response.ok) throw new Error('Space weather API error');
      const data = await response.json();
      setSpaceWeather(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch space weather:', error);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, [mounted, satellites]);

  // Fetch satellite positions
  const fetchPositions = useCallback(async () => {
    if (satellites.length === 0 || !mounted) return;

    try {
      const response = await fetch(`${API}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satellites })
      });
      if (!response.ok) throw new Error('Positions API error');
      const data = await response.json();
      
      setSatellites(prev => prev.map(sat => {
        const posData = data.positions.find((p: any) => p.id === sat.id);
        if (posData && posData.position) {
          return { ...sat, position: posData.position };
        }
        return sat;
      }));
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  }, [satellites, mounted]);

  // Analyze fleet for threats
  const analyzeFleet = useCallback(async () => {
    if (satellites.length === 0) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch(`${API}/analyze-fleet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satellites,
          window_hours: 24,
          step_seconds: 60,
          threshold_km: 5,
          max_catalog: 200
        })
      });
      
      // Handle 502 Bad Gateway errors as critical alerts
      if (response.status === 502) {
        console.error('502 Bad Gateway - Backend analysis service unavailable');
        setAlerts(prev => [{
          id: `backend-error-${Date.now()}`,
          satelliteName: 'SYSTEM',
          type: 'system' as const,
          severity: 'CRITICAL' as const,
          message: 'Backend analysis service unavailable (502 Bad Gateway) - Critical system failure',
          timestamp: new Date().toISOString(),
          acknowledged: false
        }, ...prev]);
        setError('Backend analysis service unavailable');
        return;
      }
      
      const data = await response.json();
      
      // Process results into alerts and decisions
      const newAlerts: Alert[] = [];
      const newDecisions: Decision[] = [];
      
      data.satellites.forEach((satData: any) => {
        const satellite = satellites.find(s => s.id === satData.satellite_id);
        if (!satellite) return;

        // Update satellite threat level
        setSatellites(prev => prev.map(s => 
          s.id === satData.satellite_id 
            ? { ...s, threatLevel: satData.threat_level }
            : s
        ));

        // Create alerts for events
        if (satData.events && satData.events.length > 0) {
          satData.events.slice(0, 5).forEach((event: any) => {
            const severity = event.min_distance_km < 1.0 ? 'CRITICAL' :
                           event.min_distance_km < 3.0 ? 'HIGH' : 'MEDIUM';
            
            newAlerts.push({
              id: `${satData.satellite_id}-${event.other_name}-${Date.now()}`,
              satelliteName: satellite.name,
              type: 'conjunction',
              severity,
              message: `Conjunction detected with ${event.other_name}`,
              timestamp: new Date().toISOString(),
              distance: event.min_distance_km,
              tca: event.tca_utc,
              acknowledged: false
            });
          });
        }

        // Create decisions for suggestions
        if (satData.suggestions && satData.suggestions.length > 0) {
          satData.suggestions.forEach((suggestion: any) => {
            newDecisions.push({
              id: `${satData.satellite_id}-${suggestion.event_with}-${Date.now()}`,
              satelliteName: satellite.name,
              suggestion,
              status: 'pending'
            });
          });
        }
      });

      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
      setDecisions(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const filtered = newDecisions.filter(d => !existingIds.has(d.id));
        return [...filtered, ...prev];
      });

    } catch (error) {
      console.error('Failed to analyze fleet:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [satellites]);

  // Add satellite
  const addSatellite = () => {
    if (!newSatellite.name || !newSatellite.tle1 || !newSatellite.tle2) {
      alert('Please fill in all fields');
      return;
    }

    if (!newSatellite.tle1.startsWith('1 ') || !newSatellite.tle2.startsWith('2 ')) {
      alert('Invalid TLE format. Lines must start with "1 " and "2 "');
      return;
    }

    const newSat: Satellite = {
      id: `sat-${Date.now()}`,
      ...newSatellite,
      status: 'active'
    };

    setSatellites(prev => [...prev, newSat]);
    setNewSatellite({ name: '', tle1: '', tle2: '', color: '#00ff00' });
    setShowAddSatellite(false);

    // Add system alert
    setAlerts(prev => [{
      id: `system-${Date.now()}`,
      satelliteName: newSat.name,
      type: 'system',
      severity: 'LOW',
      message: `Satellite ${newSat.name} added to tracking`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }, ...prev]);
  };

  // Remove satellite
  const removeSatellite = (id: string) => {
    setSatellites(prev => prev.filter(s => s.id !== id));
  };

  // Alert handlers
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };


  // Decision handlers
  const approveDecision = (decisionId: string) => {
    setDecisions(prev => prev.map(d => 
      d.id === decisionId ? { ...d, status: 'approved' } : d
    ));
    
    // Update fleet status to operational when decisions are approved
    setSatellites(prev => prev.map(sat => ({
      ...sat,
      status: 'active' as const,
      threatLevel: 'LOW'
    })));
    
    // Add system alert for operational status
    setAlerts(prev => [{
      id: `operational-${Date.now()}`,
      satelliteName: 'FLEET',
      type: 'system',
      severity: 'LOW',
      message: 'Fleet operational - All systems green',
      timestamp: new Date().toISOString(),
      acknowledged: false
    }, ...prev]);
  };

  const rejectDecision = (decisionId: string) => {
    setDecisions(prev => prev.map(d => 
      d.id === decisionId ? { ...d, status: 'rejected' } : d
    ));
  };

  const executeDecision = (decisionId: string) => {
    setDecisions(prev => prev.map(d => 
      d.id === decisionId ? { ...d, status: 'executing' } : d
    ));

    // Simulate execution
    setTimeout(() => {
      setDecisions(prev => prev.map(d => 
        d.id === decisionId ? { ...d, status: 'completed' } : d
      ));

      const decision = decisions.find(d => d.id === decisionId);
      if (decision) {
        setAlerts(prev => [{
          id: `execution-${Date.now()}`,
          satelliteName: decision.satelliteName,
          type: 'system',
          severity: 'LOW',
          message: `Maneuver executed successfully`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        }, ...prev]);
      }
    }, 3000);
  };

  const selectAction = (decisionId: string, action: string) => {
    console.log(`Selected action ${action} for decision ${decisionId}`);
    // You can add logic here to handle the selected action
    // For now, we'll just log it and could update the decision with the selected action
  };

  const handleViewAlertDetails = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      // Add some mock detailed data if not present
      const alertWithDetails = {
        ...alert,
        details: {
          ...alert.details,
          distance: alert.distance || Math.random() * 1000 + 50,
          tca: alert.tca || new Date(Date.now() + Math.random() * 86400000).toISOString(),
          relativeSpeed: alert.details?.relativeSpeed || Math.random() * 5 + 1,
          probability: alert.details?.probability || Math.random() * 0.001,
          confidence: alert.details?.confidence || 0.7 + Math.random() * 0.3,
          source: alert.details?.source || 'Space-Track.org / CelesTrak',
          recommendation: alert.details?.recommendation || 'Consider performing a collision avoidance maneuver within the next 24 hours.',
          impact: alert.details?.impact || 'Potential collision could result in satellite loss and debris generation.',
          mitigation: alert.details?.mitigation || 'Out-of-plane maneuver recommended with Δv of 0.5-2.0 m/s.'
        }
      };
      setSelectedAlert(alertWithDetails);
    }
  };

  const handleCloseAlertOverlay = () => {
    setSelectedAlert(null);
  };


  // Auto-refresh effects
  useEffect(() => {
    fetchSpaceWeather();
    const interval = setInterval(fetchSpaceWeather, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [fetchSpaceWeather]);

  useEffect(() => {
    if (!autoRefresh || satellites.length === 0) return;
    const interval = setInterval(fetchPositions, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, satellites.length]);

  useEffect(() => {
    if (!autoRefresh || satellites.length === 0) return;
    const interval = setInterval(analyzeFleet, 60000); // Every minute
    return () => clearInterval(interval);
  }, [autoRefresh, satellites.length]);

  // Sample satellites for demo
  const addSampleSatellites = () => {
    const samples = [
      {
        id: 'iss',
        name: 'ISS (ZARYA)',
        tle1: '1 25544U 98067A   24298.50000000  .00016717  00000+0  10270-3 0  9005',
        tle2: '2 25544  51.6400 208.9163 0006317  69.9862 320.6634 15.50192628473224',
        color: '#00ff00',
        status: 'active' as const
      },
      {
        id: 'hubble',
        name: 'HUBBLE SPACE TELESCOPE',
        tle1: '1 20580U 90037B   24298.50000000  .00001390  00000+0  71139-4 0  9991',
        tle2: '2 20580  28.4697 259.1734 0002901 300.5682 151.9476 15.09742863334442',
        color: '#00aaff',
        status: 'active' as const
      }
    ];
    setSatellites(prev => [...prev, ...samples.filter(s => !prev.find(p => p.id === s.id))]);
  };

  // Show loading screen while initializing
  if (!mounted) {
    return (
      <div className="mission-control">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(0, 255, 136, 0.2)',
            borderTop: '4px solid #00ff88',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ color: '#00ff88' }}>Initializing Mission Control...</div>
        </div>
      </div>
    );
  }

  // Show error if backend connection failed
  if (error) {
    return (
      <div className="mission-control">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ color: '#ff6b6b' }}>Backend Connection Error</h2>
          <p style={{ color: '#888' }}>
            {error}
          </p>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Make sure the backend is running at {API}
          </p>
          <button 
            onClick={() => {
              setError(null);
              fetchSpaceWeather();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#00ff88',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-control">

      <div className="mc-layout">
        {/* Left Panel - Satellite Management */}
        <div className="mc-sidebar left">
          <div className="panel satellite-panel fleet-panel">
            <div className="panel-header">
              <a href="/" className="azspace-logo">
                <img src="/AZSpaceLogo.png" alt="AZSpace Logo" className="logo-icon" />
              </a>
              <div className="fleet-count">Fleet ({satellites.length})</div>
              <button 
                className="btn-add"
                onClick={() => setShowAddSatellite(!showAddSatellite)}
              >
                + Add
              </button>
            </div>
            
            {showAddSatellite && (
              <div className="add-satellite-form">
                <input
                  type="text"
                  placeholder="Satellite Name"
                  value={newSatellite.name}
                  onChange={(e) => setNewSatellite({...newSatellite, name: e.target.value})}
                />
                <textarea
                  placeholder="TLE Line 1"
                  rows={2}
                  value={newSatellite.tle1}
                  onChange={(e) => setNewSatellite({...newSatellite, tle1: e.target.value})}
                />
                <textarea
                  placeholder="TLE Line 2"
                  rows={2}
                  value={newSatellite.tle2}
                  onChange={(e) => setNewSatellite({...newSatellite, tle2: e.target.value})}
                />
                <div className="form-row">
                  <input
                    type="color"
                    value={newSatellite.color}
                    onChange={(e) => setNewSatellite({...newSatellite, color: e.target.value})}
                  />
                  <button className="btn-submit" onClick={addSatellite}>Add Satellite</button>
                </div>
                <button className="btn-sample" onClick={addSampleSatellites}>
                  Load Sample Satellites
                </button>
              </div>
            )}

            <div className="satellite-list">
              {satellites.length === 0 ? (
                <div className="empty-state">
                  <p>No satellites tracked</p>
                  <p>Add satellites to begin monitoring</p>
                </div>
              ) : (
                satellites.map(sat => (
                  <div 
                    key={sat.id} 
                    className={`satellite-item threat-${sat.threatLevel?.toLowerCase() || 'low'} ${selectedSatelliteId === sat.id ? 'selected' : ''}`}
                    onClick={() => {
                      const newSelectedId = selectedSatelliteId === sat.id ? null : sat.id;
                      setSelectedSatelliteId(newSelectedId);
                      // Fetch location-specific weather for selected satellite
                      if (newSelectedId) {
                        fetchSpaceWeather(newSelectedId);
                      } else {
                        // Fetch global weather when no satellite selected
                        fetchSpaceWeather();
                      }
                    }}
                  >
                    <div 
                      className="sat-color-indicator" 
                      style={{ backgroundColor: sat.color }}
                    ></div>
                    <div className="sat-info">
                      <div className="sat-name">{sat.name}</div>
                      <div className={`sat-status ${sat.status === 'active' ? 'operational' : sat.status}`}>
                        {sat.status === 'active' ? '🟢 OPERATIONAL' : sat.status}
                      </div>
                      {sat.position && (
                        <div className="sat-pos">
                          Alt: {sat.position.alt.toFixed(0)} km
                        </div>
                      )}
                      {sat.threatLevel && sat.threatLevel !== 'LOW' && (
                        <div className={`sat-threat threat-${sat.threatLevel.toLowerCase()}`}>
                          {sat.threatLevel}
                        </div>
                      )}
                      {sat.collisionProbability && sat.collisionProbability.pc_2d && (
                        <div className={`sat-safety safety-${sat.collisionProbability.safety_level?.toLowerCase() || 'low'}`}>
                          <div className="safety-label">Safety: {sat.collisionProbability.safety_level || 'UNKNOWN'}</div>
                          <div className="collision-prob">
                            Pc: {sat.collisionProbability.pc_2d.toExponential(2)}
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSatellite(sat.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {satellites.length > 0 && (
              <button 
                className="btn-analyze"
                onClick={analyzeFleet}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : '🔍 Analyze Threats'}
              </button>
            )}
          </div>

          <div className="panel alert-panel">
            <SpaceWeatherPanel data={spaceWeather} loading={loading} />
          </div>
        </div>

        {/* Center - 3D Visualization */}
        <div className="mc-main">
          <div className="visualization-container">
            <EarthVisualization 
              satellites={satellites.map(s => ({
                ...s,
                position: s.position || { lat: 0, lon: 0, alt: 400, x: 0, y: 0, z: 6771 },
                isSelected: s.id === selectedSatelliteId
              }))}
            />
            <div className="viz-overlay">
              <div className="viz-stats">
                <div className="stat">
                  <span className="stat-value">{satellites.length}</span>
                  <span className="stat-label">Satellites</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{alerts.filter(a => !a.acknowledged).length}</span>
                  <span className="stat-label">Active Alerts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{decisions.filter(d => d.status === 'pending').length}</span>
                  <span className="stat-label">Pending Decisions</span>
                </div>
              </div>
            </div>
            
            {/* Transparent Status Indicator */}
            <div className="graphics-status-indicator">
              <span className={`status-dot ${analyzing ? 'analyzing' : 'operational'}`}></span>
              <span>{analyzing ? 'Analyzing...' : 'Operational'}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Alerts & Decisions */}
        <div className="mc-sidebar right">
          <div className="panel alert-panel">
            <AlertPanel 
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
              onViewDetails={handleViewAlertDetails}
            />
          </div>

          <div className="panel decision-dashboard">
            <DecisionDashboard
              decisions={decisions}
              onApprove={approveDecision}
              onReject={rejectDecision}
              onExecute={executeDecision}
              onSelectAction={selectAction}
            />
          </div>
        </div>
      </div>

      <AlertDetailOverlay 
        alert={selectedAlert} 
        onClose={handleCloseAlertOverlay} 
      />
    </div>
  );
};

export default MissionControl;

