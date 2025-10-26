import { useState, useEffect } from 'react';
import './AlertDetailOverlay.css';

interface Alert {
  id: string;
  satelliteName: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
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

interface AlertDetailOverlayProps {
  alert: Alert | null;
  onClose: () => void;
}

const AlertDetailOverlay = ({ alert, onClose }: AlertDetailOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      // Add blur effect to body
      document.body.style.overflow = 'hidden';
      document.body.classList.add('alert-overlay-active');
    } else {
      setIsVisible(false);
      // Remove blur effect from body
      document.body.style.overflow = '';
      document.body.classList.remove('alert-overlay-active');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('alert-overlay-active');
    };
  }, [alert]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && alert) {
        onClose();
      }
    };

    if (alert) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [alert, onClose]);

  if (!alert || !isVisible) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff6b6b';
      case 'MEDIUM': return '#ffa500';
      case 'LOW': return '#00ff00';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      case 'LOW': return 'ℹ️';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatTCA = (tca: string) => {
    if (!tca) return 'N/A';
    try {
      const date = new Date(tca);
      return date.toLocaleString();
    } catch {
      return tca;
    }
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-overlay-content" onClick={(e) => e.stopPropagation()}>
        <div className="alert-overlay-header">
          <div className="alert-title">
            <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
            <h3>Alert Details</h3>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <div className="alert-overlay-body">
          <div className="alert-summary">
            <div className="summary-row">
              <span className="summary-label">Satellite:</span>
              <span className="summary-value">{alert.satelliteName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Type:</span>
              <span className="summary-value">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Severity:</span>
              <span 
                className="summary-value severity"
                style={{ color: getSeverityColor(alert.severity) }}
              >
                {alert.severity}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Timestamp:</span>
              <span className="summary-value">{formatTimestamp(alert.timestamp)}</span>
            </div>
          </div>

          <div className="alert-message">
            <h4>Alert Message</h4>
            <p>{alert.message}</p>
          </div>

          {alert.details && (
            <div className="alert-details">
              <h4>Technical Details</h4>
              
              {alert.details.distance && (
                <div className="detail-section">
                  <h5>Conjunction Data</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Miss Distance:</span>
                      <span className="detail-value danger">
                        {alert.details.distance.toFixed(3)} km
                      </span>
                    </div>
                    {alert.details.tca && (
                      <div className="detail-item">
                        <span className="detail-label">Time of Closest Approach:</span>
                        <span className="detail-value">
                          {formatTCA(alert.details.tca)}
                        </span>
                      </div>
                    )}
                    {alert.details.relativeSpeed && (
                      <div className="detail-item">
                        <span className="detail-label">Relative Speed:</span>
                        <span className="detail-value">
                          {alert.details.relativeSpeed.toFixed(2)} km/s
                        </span>
                      </div>
                    )}
                    {alert.details.probability && (
                      <div className="detail-item">
                        <span className="detail-label">Collision Probability:</span>
                        <span className="detail-value danger">
                          {(alert.details.probability * 100).toFixed(6)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {alert.details.confidence && (
                <div className="detail-section">
                  <h5>Analysis Confidence</h5>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${alert.details.confidence * 100}%` }}
                    ></div>
                    <span className="confidence-text">
                      {Math.round(alert.details.confidence * 100)}% Confidence
                    </span>
                  </div>
                </div>
              )}

              {alert.details.source && (
                <div className="detail-section">
                  <h5>Data Source</h5>
                  <p className="source-info">{alert.details.source}</p>
                </div>
              )}

              {alert.details.recommendation && (
                <div className="detail-section">
                  <h5>Recommendation</h5>
                  <div className="recommendation-box">
                    <p>{alert.details.recommendation}</p>
                  </div>
                </div>
              )}

              {alert.details.impact && (
                <div className="detail-section">
                  <h5>Potential Impact</h5>
                  <p className="impact-text">{alert.details.impact}</p>
                </div>
              )}

              {alert.details.mitigation && (
                <div className="detail-section">
                  <h5>Mitigation Strategy</h5>
                  <p className="mitigation-text">{alert.details.mitigation}</p>
                </div>
              )}
            </div>
          )}

          <div className="alert-actions">
            <button className="btn-acknowledge" onClick={onClose}>
              ✓ Acknowledge Alert
            </button>
            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailOverlay;
