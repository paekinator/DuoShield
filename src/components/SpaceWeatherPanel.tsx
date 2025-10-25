import React from 'react';
import './SpaceWeatherPanel.css';

interface SpaceWeatherData {
  kp_index: {
    value: number;
    level: string;
    risk: string;
    latest?: any;
  };
  solar_flare: {
    risk: string;
    data_points: number;
    xray_latest?: any;
  };
  solar_wind: {
    speed_km_s: number;
    latest?: any;
  };
  proton_flux?: {
    data_points: number;
  };
  threats: Array<{
    type: string;
    level: string;
    impact: string;
    recommendation: string;
  }>;
  overall_risk: string;
}

interface SpaceWeatherPanelProps {
  data: SpaceWeatherData | null;
  loading?: boolean;
}

const SpaceWeatherPanel = ({ data, loading = false }: SpaceWeatherPanelProps) => {

  const getRiskColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return '#ff0000';
      case 'ELEVATED':
      case 'MODERATE':
        return '#ff8800';
      case 'MEDIUM':
        return '#ffcc00';
      default:
        return '#00ff00';
    }
  };

  const getThreatIcon = (type: string) => {
    if (type.includes('Geomagnetic')) return '🌍';
    if (type.includes('Solar Flare')) return '☀️';
    if (type.includes('Solar Wind')) return '💨';
    return '📊';
  };

  if (loading) {
    return (
      <div className="space-weather-panel">
        <div className="weather-header">
          <h3>Space Weather</h3>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading space weather data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-weather-panel">
        <div className="weather-header">
          <h3>Space Weather</h3>
        </div>
        <div className="error-state">
          <p>Unable to load space weather data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-weather-panel">
      <div className="weather-header">
        <h3>Space Weather Monitor</h3>
        <div 
          className="overall-risk"
          style={{ backgroundColor: getRiskColor(data.overall_risk) }}
        >
          {data.overall_risk} RISK
        </div>
      </div>

      <div className="weather-content">
        <div className="weather-metrics">
          <div className="metric-card">
            <div className="metric-icon">🌍</div>
            <div className="metric-content">
              <div className="metric-label">KP Index</div>
              <div 
                className="metric-value"
                style={{ color: getRiskColor(data.kp_index.level) }}
              >
                {data.kp_index.value.toFixed(1)} ({data.kp_index.level})
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">☀️</div>
            <div className="metric-content">
              <div className="metric-label">Solar Flare Risk</div>
              <div 
                className="metric-value"
                style={{ color: getRiskColor(data.solar_flare.risk) }}
              >
                {data.solar_flare.risk}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💨</div>
            <div className="metric-content">
              <div className="metric-label">Solar Wind Speed</div>
              <div className="metric-value">
                {data.solar_wind.speed_km_s.toFixed(0)} km/s
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">Data Points</div>
              <div className="metric-value">
                {data.solar_flare.data_points || 0}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpaceWeatherPanel;