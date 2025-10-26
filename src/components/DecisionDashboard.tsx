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
  onSelectAction: (decisionId: string, action: string) => void;
}

const DecisionDashboard = ({ decisions, onApprove, onReject, onExecute, onSelectAction }: DecisionDashboardProps) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedAction, setSelectedAction] = useState<string>('');

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

  const getActionOptions = (decision: Decision) => {
    if (decision.suggestion.type === 'space_weather_mitigation') {
      return [
        { value: 'monitor', label: 'Monitor Situation', description: 'Continue monitoring without action' },
        { value: 'adjust_attitude', label: 'Adjust Attitude', description: 'Change satellite orientation for protection' },
        { value: 'reduce_power', label: 'Reduce Power', description: 'Lower power consumption during event' },
        { value: 'safe_mode', label: 'Enter Safe Mode', description: 'Activate protective safe mode' }
      ];
    } else {
      return [
        { value: 'out_of_plane', label: 'Out-of-Plane Maneuver', description: 'Small Δv perpendicular to orbit' },
        { value: 'along_track', label: 'Along-Track Maneuver', description: 'Advance or delay orbital position' },
        { value: 'radial', label: 'Radial Maneuver', description: 'Adjust altitude slightly' },
        { value: 'monitor', label: 'Monitor Only', description: 'Continue tracking without maneuver' }
      ];
    }
  };

  const handleActionSelect = (decisionId: string, action: string) => {
    setSelectedAction(action);
    onSelectAction(decisionId, action);
  };

  return (
    <div className="decision-dashboard">
      <div className="dashboard-header">
        <h3>Decision Support</h3>
        <div className="status-indicators">
          <div className="indicator pending">
            <div className="indicator-dot"></div>
            <span>{decisions.filter(d => d.status === 'pending').length}</span>
          </div>
          <div className="indicator approved">
            <div className="indicator-dot"></div>
            <span>{decisions.filter(d => d.status === 'approved').length}</span>
          </div>
          <div className="indicator executing">
            <div className="indicator-dot"></div>
            <span>{decisions.filter(d => d.status === 'executing').length}</span>
          </div>
        </div>
      </div>

      <div className="decision-timeline">
        {filteredDecisions.length === 0 ? (
          <div className="no-decisions">
            <div className="no-decisions-icon">📊</div>
            <p>No decisions {filter !== 'all' && `in ${filter} state`}</p>
          </div>
        ) : (
          filteredDecisions.map((decision, index) => (
            <div key={decision.id} className="timeline-item">
              <div className="timeline-marker">
                <div 
                  className="marker-dot"
                  style={{ backgroundColor: getStatusColor(decision.status) }}
                ></div>
                {index < filteredDecisions.length - 1 && <div className="timeline-line"></div>}
              </div>
              
              <div className="timeline-content">
                <div className="decision-card">
                  <div className="card-header">
                    <div className="satellite-info">
                      <span className="satellite-name">{decision.satelliteName}</span>
                      <span className="threat-type">
                        {decision.suggestion.type === 'space_weather_mitigation' 
                          ? decision.suggestion.threat 
                          : `Conjunction with ${decision.suggestion.event_with}`
                        }
                      </span>
                    </div>
                    <div className="priority-indicator">
                      <span 
                        className="priority-dot"
                        style={{ backgroundColor: getPriorityColor(
                          decision.suggestion.priority || 
                          decision.suggestion.action?.priority || 
                          'MEDIUM'
                        ) }}
                      ></span>
                    </div>
                  </div>

                  <div className="card-details">
                    {decision.suggestion.type === 'space_weather_mitigation' ? (
                      <div className="detail-row">
                        <span className="detail-label">Recommendation:</span>
                        <span className="detail-value">{decision.suggestion.recommendation}</span>
                      </div>
                    ) : (
                      <div className="detail-row">
                        <span className="detail-label">Distance:</span>
                        <span className="detail-value danger">
                          {decision.suggestion.distance_km?.toFixed(2)} km
                        </span>
                        <span className="detail-label">TCA:</span>
                        <span className="detail-value">
                          {formatTCA(decision.suggestion.tca || '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {decision.status === 'pending' && (
                    <div className="action-controls">
                      <select 
                        value={selectedAction}
                        onChange={(e) => handleActionSelect(decision.id, e.target.value)}
                        className="action-select"
                      >
                        <option value="">Choose action...</option>
                        {getActionOptions(decision).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="action-buttons">
                        <button 
                          className="btn-approve-small"
                          onClick={() => onApprove(decision.id)}
                        >
                          ✓
                        </button>
                        <button 
                          className="btn-reject-small"
                          onClick={() => onReject(decision.id)}
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  )}

                  {decision.status === 'approved' && (
                    <div className="action-controls">
                      <button 
                        className="btn-execute-small"
                        onClick={() => onExecute(decision.id)}
                      >
                        🚀 Execute
                      </button>
                    </div>
                  )}

                  {decision.status === 'executing' && (
                    <div className="executing-indicator">
                      <div className="spinner-small"></div>
                      <span>Executing...</span>
                    </div>
                  )}

                  {decision.status === 'completed' && (
                    <div className="completed-indicator">
                      <span>✓ Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DecisionDashboard;
