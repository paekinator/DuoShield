import { useState } from 'react';
import './DecisionDashboard.css';

interface ManeuverAction {
  type: string;
  description: string;
  timing: string;
  delta_v_estimate: string;
  reason: string;
  priority: string;
  fuel_cost: string;
}

interface Suggestion {
  event_with?: string;
  tca?: string;
  distance_km?: number;
  relative_speed_km_s?: number;
  action?: ManeuverAction;
  // Space weather mitigation fields
  type?: string;
  threat?: string;
  recommendation?: string;
  priority?: string;
}

interface Decision {
  id: string;
  satelliteName: string;
  suggestion: Suggestion;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'rejected';
}

interface DecisionDashboardProps {
  decisions: Decision[];
  onApprove: (decisionId: string) => void;
  onReject: (decisionId: string) => void;
  onExecute: (decisionId: string) => void;
}

const DecisionDashboard = ({ decisions, onApprove, onReject, onExecute }: DecisionDashboardProps) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filteredDecisions = filter === 'all' 
    ? decisions 
    : decisions.filter(d => d.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffd700';
      case 'approved': return '#00ff00';
      case 'executing': return '#00bfff';
      case 'completed': return '#90ee90';
      case 'rejected': return '#ff6b6b';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff8800';
      case 'MEDIUM': return '#ffd700';
      case 'LOW': return '#00ff00';
      default: return '#666';
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
    <div className="decision-dashboard">
      <div className="dashboard-header">
        <h3>Decision Support System</h3>
        <div className="dashboard-stats">
          <div className="stat">
            <span className="stat-value">{decisions.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value">{decisions.filter(d => d.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-value">{decisions.filter(d => d.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat">
            <span className="stat-value">{decisions.filter(d => d.status === 'executing').length}</span>
            <span className="stat-label">Executing</span>
          </div>
        </div>
      </div>

      <div className="decision-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''} 
          onClick={() => setFilter('pending')}
        >
          Pending Review
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''} 
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
      </div>

      <div className="decision-content">
        <div className="decision-list">
          {filteredDecisions.length === 0 ? (
            <div className="no-decisions">
              <p>No decisions {filter !== 'all' && `in ${filter} state`}</p>
            </div>
          ) : (
            filteredDecisions.map((decision) => (
              <div 
                key={decision.id}
                className={`decision-item ${selectedDecision?.id === decision.id ? 'selected' : ''}`}
                onClick={() => setSelectedDecision(decision)}
              >
                <div className="decision-item-header">
                  <span className="decision-satellite">{decision.satelliteName}</span>
                  <span 
                    className="decision-status"
                    style={{ backgroundColor: getStatusColor(decision.status) }}
                  >
                    {decision.status.toUpperCase()}
                  </span>
                </div>
                <div className="decision-item-info">
                  {decision.suggestion.type === 'space_weather_mitigation' ? (
                    <>
                      <div className="info-row">
                        <span className="info-label">Threat:</span>
                        <span className="info-value">{decision.suggestion.threat}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Recommendation:</span>
                        <span className="info-value">{decision.suggestion.recommendation}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Priority:</span>
                        <span 
                          className="info-value priority"
                          style={{ color: getPriorityColor(decision.suggestion.priority || 'MEDIUM') }}
                        >
                          {decision.suggestion.priority || 'MEDIUM'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="info-label">Threat:</span>
                        <span className="info-value">{decision.suggestion.event_with}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Distance:</span>
                        <span className="info-value danger">{decision.suggestion.distance_km?.toFixed(2)} km</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">TCA:</span>
                        <span className="info-value">{formatTCA(decision.suggestion.tca || '')}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Priority:</span>
                        <span 
                          className="info-value priority"
                          style={{ color: getPriorityColor(decision.suggestion.action?.priority || 'MEDIUM') }}
                        >
                          {decision.suggestion.action?.priority || 'MEDIUM'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedDecision && (
          <div className="decision-details">
            <div className="details-header">
              <h4>{selectedDecision.suggestion.type === 'space_weather_mitigation' ? 'Space Weather Mitigation' : 'Maneuver Details'}</h4>
              <button 
                className="btn-close"
                onClick={() => setSelectedDecision(null)}
              >
                ×
              </button>
            </div>

            <div className="details-content">
              {selectedDecision.suggestion.type === 'space_weather_mitigation' ? (
                <div className="detail-section">
                  <h5>Space Weather Threat</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Satellite</span>
                      <span className="detail-value">{selectedDecision.satelliteName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Threat Type</span>
                      <span className="detail-value">{selectedDecision.suggestion.threat}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Priority</span>
                      <span 
                        className="detail-value priority"
                        style={{ color: getPriorityColor(selectedDecision.suggestion.priority || 'MEDIUM') }}
                      >
                        {selectedDecision.suggestion.priority || 'MEDIUM'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h5>Recommended Action</h5>
                    <div className="recommendation-box">
                      <p>{selectedDecision.suggestion.recommendation}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <h5>Conjunction Information</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Primary Satellite</span>
                      <span className="detail-value">{selectedDecision.satelliteName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Secondary Object</span>
                      <span className="detail-value">{selectedDecision.suggestion.event_with}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Miss Distance</span>
                      <span className="detail-value danger">
                        {selectedDecision.suggestion.distance_km?.toFixed(3)} km
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Relative Speed</span>
                      <span className="detail-value">
                        {selectedDecision.suggestion.relative_speed_km_s?.toFixed(2)} km/s
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Time to TCA</span>
                      <span className="detail-value">
                        {formatTCA(selectedDecision.suggestion.tca || '')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Priority Level</span>
                      <span 
                        className="detail-value"
                        style={{ color: getPriorityColor(selectedDecision.suggestion.action?.priority || 'MEDIUM') }}
                      >
                        {selectedDecision.suggestion.action?.priority || 'MEDIUM'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Recommended Action</h5>
                    <div className="action-card">
                      <div className="action-type">
                        {selectedDecision.suggestion.action?.type?.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <p className="action-description">
                        {selectedDecision.suggestion.action?.description}
                      </p>
                      <div className="action-params">
                        <div className="param">
                          <span className="param-label">Timing:</span>
                          <span className="param-value">{selectedDecision.suggestion.action?.timing}</span>
                        </div>
                        <div className="param">
                          <span className="param-label">Δv Estimate:</span>
                          <span className="param-value">{selectedDecision.suggestion.action?.delta_v_estimate}</span>
                        </div>
                        <div className="param">
                          <span className="param-label">Fuel Cost:</span>
                          <span className="param-value">{selectedDecision.suggestion.action?.fuel_cost}</span>
                        </div>
                      </div>
                      <div className="action-reason">
                        <strong>Rationale:</strong> {selectedDecision.suggestion.action?.reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-actions">
              {selectedDecision.status === 'pending' && (
                <>
                  <button 
                    className="btn-action btn-approve"
                    onClick={() => onApprove(selectedDecision.id)}
                  >
                    ✓ {selectedDecision.suggestion.type === 'space_weather_mitigation' ? 'Approve Mitigation' : 'Approve Maneuver'}
                  </button>
                  <button 
                    className="btn-action btn-reject"
                    onClick={() => onReject(selectedDecision.id)}
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              {selectedDecision.status === 'approved' && (
                <button 
                  className="btn-action btn-execute"
                  onClick={() => onExecute(selectedDecision.id)}
                >
                  {selectedDecision.suggestion.type === 'space_weather_mitigation' ? '🛡️ Execute Mitigation' : '🚀 Execute Maneuver'}
                </button>
              )}
              {selectedDecision.status === 'executing' && (
                <div className="executing-status">
                  <div className="spinner"></div>
                  <span>{selectedDecision.suggestion.type === 'space_weather_mitigation' ? 'Mitigation in progress...' : 'Maneuver in progress...'}</span>
                </div>
              )}
              {selectedDecision.status === 'completed' && (
                <div className="completed-status">
                  ✓ {selectedDecision.suggestion.type === 'space_weather_mitigation' ? 'Mitigation completed successfully' : 'Maneuver completed successfully'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionDashboard;
