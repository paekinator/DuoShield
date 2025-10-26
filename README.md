# AZSpace - Satellite Risk Management System

A comprehensive satellite risk management system built with React, Three.js, and FastAPI. Monitor satellite positions, track space weather, and manage collision risks in real-time.

## 🚀 Features

### Mission Control Center
- **Real-time Satellite Tracking**: Monitor multiple satellites with orbital position data
- **3D Earth Visualization**: Interactive 3D Earth with satellite position indicators
- **Space Weather Monitoring**: Track KP index, solar wind speed, and space weather threats
- **Collision Risk Assessment**: Calculate collision probabilities and conjunction alerts
- **Decision Support System**: Get recommended maneuvers and mitigation strategies

### Key Capabilities
- **Multi-Satellite Support**: Track and manage multiple satellites simultaneously
- **Location-Specific Weather**: Space weather data tailored to satellite positions
- **Real-time Alerts**: Critical situation notifications with severity levels
- **Interactive 3D Graphics**: Three.js powered Earth and satellite visualizations
- **Maneuver Recommendations**: AI-powered collision avoidance suggestions

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Three.js** for 3D graphics and WebGL rendering
- **React Router DOM** for navigation
- **CSS3** with modern glassmorphic design

### Backend
- **FastAPI** (Python) for high-performance API
- **SGP4** for satellite orbit propagation
- **NOAA SWPC** integration for space weather data
- **Celestrak** for real-time TLE data

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python app.py
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/azspace.git
   cd azspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```

3. **Start both servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend && python app.py
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
azspace/
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── pages/             # Page components
│   └── App.tsx           # Main app component
├── backend/              # FastAPI backend
│   ├── app.py           # Main API server
│   ├── orbit.py         # Orbital calculations
│   ├── swpc.py          # Space weather data
│   └── probability.py   # Collision probability
├── public/
│   └── models/          # 3D models (Earth, satellites)
└── README.md
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /space-weather` - Global space weather data
- `POST /positions` - Satellite positions with location-specific weather
- `POST /analyze` - Collision risk analysis
- `GET /satellites` - Available satellite data

### Data Sources
- **Celestrak**: Real-time TLE data
- **NOAA SWPC**: Space weather monitoring
- **SGP4**: Orbital propagation

## 🎯 Usage

### Adding Satellites
1. Navigate to Mission Control
2. Add satellite TLE data
3. Monitor real-time positions
4. Track space weather conditions

### Risk Management
1. View alerts in Alert Center
2. Review recommendations in Decision Support
3. Execute approved maneuvers
4. Monitor fleet status

## 🌟 Key Features

### 3D Visualization
- Interactive Earth model with realistic geography
- Satellite position tracking with visual indicators
- Real-time orbital animations
- Space weather overlay

### Risk Assessment
- Collision probability calculations
- Conjunction screening
- Maneuver recommendations
- Threat level classification

### Space Weather
- KP index monitoring
- Solar wind speed tracking
- Geomagnetic activity alerts
- Location-specific conditions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NOAA Space Weather Prediction Center** for space weather data
- **Celestrak** for satellite TLE data
- **Three.js** community for 3D graphics support
- **FastAPI** for high-performance Python web framework

## 📞 Support

For support, email hajinpaek@gmail.com or create an issue in this repository.

---

**AZSpace** - Protecting satellites, securing space operations 🛰️
