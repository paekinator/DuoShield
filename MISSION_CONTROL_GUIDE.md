# 🛰 Mission Control - DuoShield Orbital Defense System

## Overview

Mission Control is a comprehensive satellite risk management system that provides real-time monitoring, threat analysis, and decision support for satellite operators. The system integrates real space situational data and space weather conditions to provide actionable intelligence.

## Features

### 🌍 3D Earth Visualization
- Interactive 3D Earth with real-time satellite positions
- Orbital path visualization
- Threat-level color coding
- Smooth rotation and zoom controls

### 🚨 Alert Center
- Real-time conjunction alerts
- Severity-based filtering (Critical, High, Medium, Low)
- Time-to-Collision (TCA) countdown
- Miss distance tracking
- Audio notifications (toggle available)

### 🎯 Decision Support System
- Automated maneuver recommendations
- Detailed conjunction analysis
- Fuel cost estimates
- One-click approval and execution
- Maneuver type suggestions:
  - Out-of-plane Δv maneuvers
  - Along-track bias maneuvers
  - Continuous monitoring

### ☀️ Space Weather Monitor
- Real-time KP index gauge
- Solar flare risk assessment
- Solar wind speed tracking
- Geomagnetic storm warnings
- Impact analysis and recommendations

### 🛸 Satellite Fleet Management
- Add multiple satellites via TLE data
- Real-time position tracking
- Threat level indicators
- Sample satellite quick-load (ISS, Hubble)
- Color-coded satellite tracking

## Getting Started

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the project root:
```bash
cd /path/to/azspace
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration (optional):
```bash
echo "VITE_API_BASE=http://localhost:8000" > .env.local
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Using Mission Control

### Accessing Mission Control

1. Open your browser to `http://localhost:5173`
2. Click on "Enter Beta v0.9" button
3. You'll be taken to the Mission Control dashboard

### Adding Satellites

#### Method 1: Sample Satellites (Quick Start)
1. Click the "+ Add" button in the Fleet panel
2. Click "Load Sample Satellites"
3. This adds ISS and Hubble Space Telescope

#### Method 2: Custom Satellites
1. Click the "+ Add" button in the Fleet panel
2. Fill in the form:
   - **Satellite Name**: Any identifier
   - **TLE Line 1**: First line of Two-Line Element set (must start with "1 ")
   - **TLE Line 2**: Second line of Two-Line Element set (must start with "2 ")
   - **Color**: Choose a color for visualization
3. Click "Add Satellite"

**Where to get TLE data:**
- [CelesTrak](https://celestrak.org/)
- [Space-Track.org](https://www.space-track.org/) (requires free registration)

### Analyzing Threats

1. **Automatic Analysis**: System automatically analyzes fleet every minute when auto-refresh is enabled
2. **Manual Analysis**: Click "🔍 Analyze Threats" button in the Fleet panel

The system will:
- Check for conjunctions with 200+ active satellites
- Analyze space weather conditions
- Generate alerts for dangerous situations
- Create decision recommendations

### Managing Alerts

1. **View Alerts**: Check the Alert Center panel on the right
2. **Filter by Severity**: Use filter buttons (All, Critical, High, Medium)
3. **Acknowledge Alerts**: Click "Acknowledge" to mark as reviewed
4. **View Details**: Click "Details" for more information

Alert Severity Levels:
- 🔴 **CRITICAL**: Distance < 1 km
- 🟠 **HIGH**: Distance < 3 km
- 🟡 **MEDIUM**: Distance < 5 km
- 🟢 **LOW**: System notifications

### Decision Making

1. **Review Suggestions**: Check the Decision Support System panel
2. **Click on a Decision**: View detailed analysis
3. **Review the Recommendation**:
   - Conjunction details
   - Maneuver type
   - Timing requirements
   - Fuel cost estimate
   - Rationale
4. **Take Action**:
   - **Approve**: Mark maneuver as approved
   - **Reject**: Decline the suggestion
   - **Execute**: Initiate the maneuver (after approval)

### Monitoring Space Weather

The Space Weather Monitor provides:
- **KP Index Gauge**: Geomagnetic activity (0-9 scale)
- **Solar Flare Risk**: Current threat level
- **Solar Wind Speed**: Real-time measurements
- **Active Threats**: Prioritized list with recommendations

Risk Levels:
- **HIGH/CRITICAL**: Immediate action may be required
- **ELEVATED/MODERATE**: Monitor closely
- **LOW/QUIET**: Normal operations

## Auto-Refresh System

The system automatically refreshes:
- **Satellite Positions**: Every 10 seconds
- **Threat Analysis**: Every 60 seconds
- **Space Weather**: Every 5 minutes

**Pause/Resume**: Use the auto-refresh toggle in the header

## API Endpoints

### Backend API Documentation

Access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Key Endpoints:
- `GET /health` - Health check
- `GET /space-weather` - Detailed space weather data
- `POST /positions` - Get current satellite positions
- `POST /analyze-fleet` - Analyze multiple satellites
- `POST /analyze` - Analyze single satellite (legacy)

## Data Sources

The system uses real-time data from:

1. **CelesTrak** (T.S. Kelso)
   - Active satellite TLE catalog
   - Public domain data
   - https://celestrak.org/

2. **NOAA Space Weather Prediction Center (SWPC)**
   - KP Index (geomagnetic activity)
   - X-ray flux (solar flares)
   - Solar wind data
   - Proton flux measurements
   - https://www.swpc.noaa.gov/

## Technical Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D visualization
- **React Router** - Navigation
- **Vite** - Build tool

### Backend Stack
- **FastAPI** - API framework
- **SGP4** - Orbital propagation
- **NumPy** - Numerical computations
- **Requests** - HTTP client

### Real-Time Features
- WebGL-accelerated 3D graphics
- Efficient state management
- Optimized API polling
- Responsive design

## Performance Optimization

The system is optimized for:
- **Large satellite fleets**: Up to 50 satellites tracked simultaneously
- **Real-time updates**: Sub-second position updates
- **Low latency**: Efficient backend processing with SGP4
- **Responsive UI**: 60fps 3D rendering

## Troubleshooting

### Backend Issues

**Problem**: Backend fails to start
**Solution**: Check Python version (3.8+) and install all dependencies

**Problem**: Catalog fetch timeout
**Solution**: Check internet connection and CelesTrak availability

**Problem**: SGP4 errors
**Solution**: Verify TLE data is valid and properly formatted

### Frontend Issues

**Problem**: 3D visualization not loading
**Solution**: Check WebGL support in browser (chrome://gpu)

**Problem**: API connection error
**Solution**: Verify backend is running and VITE_API_BASE is correct

**Problem**: Satellites not appearing
**Solution**: Wait for position data to load (10 seconds) or check TLE validity

## Future Enhancements

Planned features:
- [ ] Probability of collision (Pc) calculations
- [ ] Covariance analysis
- [ ] Historical conjunction data
- [ ] Automated maneuver execution
- [ ] Multi-user collaboration
- [ ] Mobile app
- [ ] Email/SMS notifications
- [ ] Export reports to PDF

## Support

For issues or questions:
1. Check this guide
2. Review API documentation
3. Check browser console for errors
4. Verify backend logs

## License

This is a demonstration system for educational and research purposes.
Always consult with qualified mission control personnel for actual satellite operations.

## Credits

- **Orbital Data**: CelesTrak / T.S. Kelso
- **Space Weather**: NOAA SWPC
- **Orbital Mechanics**: SGP4 library
- **3D Graphics**: Three.js

---

**⚠️ Disclaimer**: This system provides guidance based on simplified orbital mechanics. 
For operational decisions, always consult official sources and qualified personnel.

