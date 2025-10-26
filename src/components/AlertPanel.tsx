import { useState, useEffect } from 'react';
import AlertDetailOverlay from './AlertDetailOverlay';
import './AlertPanel.css';

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

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onViewDetails: (alertId: string) => void;
  selectedAlert: Alert | null;
  onCloseOverlay: () => void;
}

const AlertPanel = ({ alerts, onAcknowledge, onViewDetails, selectedAlert, onCloseOverlay }: AlertPanelProps) => {
  const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('all');
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Play alert sound for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged);
    if (criticalAlerts.length > 0 && audioEnabled) {
      // Could add audio alert here
      console.log('🚨 CRITICAL ALERT');
    }
  }, [alerts, audioEnabled]);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      default: return '🟢';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const formatTCA = (tca: string) => {
    try {
      const date = new Date(tca);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 24) {
        return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return 'N/A';
    }
  };

  const handleViewDetails = (alertId: string) => {
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
      onViewDetails(alertId);
    }
  };

  return (
    <div className="alert-panel">
      <div className="alert-header">
        <h3>
          Alert Center
          {unacknowledgedCount > 0 && (
            <span className="alert-badge">{unacknowledgedCount}</span>
          )}
        </h3>
        <div className="alert-controls">
          <button 
            className={`audio-toggle ${audioEnabled ? 'active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <div className="alert-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button 
          className={filter === 'CRITICAL' ? 'active' : ''} 
          onClick={() => setFilter('CRITICAL')}
        >
          Critical ({alerts.filter(a => a.severity === 'CRITICAL').length})
        </button>
        <button 
          className={filter === 'HIGH' ? 'active' : ''} 
          onClick={() => setFilter('HIGH')}
        >
          High ({alerts.filter(a => a.severity === 'HIGH').length})
        </button>
        <button 
          className={filter === 'MEDIUM' ? 'active' : ''} 
          onClick={() => setFilter('MEDIUM')}
        >
          Medium ({alerts.filter(a => a.severity === 'MEDIUM').length})
        </button>
      </div>

      <div className="alert-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✓</div>
            <p>No alerts at this severity level</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item severity-${alert.severity.toLowerCase()} ${alert.acknowledged ? 'acknowledged' : ''}`}
            >
              <div className="alert-icon">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="alert-content">
                <div className="alert-title">
                  <span className="alert-satellite">{alert.satelliteName}</span>
                  <span className="alert-type">{alert.type.toUpperCase()}</span>
                </div>
                <div className="alert-message">{alert.message}</div>
                {alert.tca && (
                  <div className="alert-meta">
                    <span>TCA in: <strong>{formatTCA(alert.tca)}</strong></span>
                    {alert.distance !== undefined && (
                      <span>Distance: <strong>{alert.distance.toFixed(2)} km</strong></span>
                    )}
                  </div>
                )}
                <div className="alert-time">{formatTime(alert.timestamp)}</div>
              </div>
              <div className="alert-actions">
                {!alert.acknowledged && (
                  <button 
                    className="btn-acknowledge"
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </button>
                )}
                <button 
                  className="btn-details"
                  onClick={() => handleViewDetails(alert.id)}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default AlertPanel;

