import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import ThreeBackground from './components/ThreeBackground'
import Header from './components/Header'
import Footer from './components/Footer'
import MissionControlWrapper from './components/MissionControlWrapper'

function App() {
  return (
    <Router>
      <ThreeBackground />
      <Header />
      
      <Routes>
        <Route path="/mission-control" element={
          <MissionControlWrapper />
        } />
        
        <Route path="/" element={
          <div className="page-wrapper">
            <section id="home" className="hero-section">
              <div className="container">
                <header className="header">
                  <h1 className="title">AZSPACE</h1>
                  <p className="subtitle">Next-Generation Space Intelligence</p>
                </header>

                <main className="main-content">
                  <div className="cta-section">
                    <button 
                      className="cta-button primary"
                      onClick={() => document.getElementById('duoshield-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Get Started
                    </button>
                  </div>
                </main>
              </div>
            </section>

            {/* DuoShield Hero Section */}
            <section id="duoshield-section" className="duoshield-hero">
              <div className="container">
                <div className="hero-content">
                  <h1 className="duoshield-title">DuoShield Beta v0.9</h1>
                  <p className="duoshield-tagline">
                    Advanced orbital-threat detection system predicting and visualizing dangers for satellites in real-time
                  </p>
                  <button 
                    className="enter-beta-btn"
                    onClick={() => {
                      window.location.href = '/mission-control';
                    }}
                  >
                    Enter Beta v0.9
                  </button>
                </div>
              </div>
            </section>

            {/* Main Info Section */}
            <section className="duoshield-info">
              <div className="container">
                <h2 className="section-title">DuoShield Beta v0.9</h2>
                <p className="intro-text">
                  DuoShield Beta v0.9 is an orbital-threat detection system that predicts and visualizes dangers for satellites. 
                  It merges two powerful sub-systems to provide comprehensive protection against both physical and solar threats.
                </p>

                {/* Two Sub-Systems */}
                <div className="subsystems-grid">
                  <div className="subsystem-card debris">
                    <div className="subsystem-icon">🛰</div>
                    <h3>AZDebrisSentinel</h3>
                    <p>
                      Monitors satellite conjunctions and debris risks using live data from U.S. Space Command / Space-Track 
                      and CelesTrak (T.S. Kelso). Provides real-time alerts on potential collisions and orbital debris threats.
                    </p>
                  </div>

                  <div className="subsystem-card solar">
                    <div className="subsystem-icon">☀️</div>
                    <h3>AZHelioGuard</h3>
                    <p>
                      Tracks solar activity and Coronal Mass Ejection (CME) events using NOAA Space Weather Prediction Center (SWPC) 
                      and AWS Open Data Registry sources. Monitors space weather conditions that could impact satellite operations.
                    </p>
                  </div>
                </div>

                {/* How It Works */}
                <div className="how-it-works">
                  <h3 className="subsection-title">How It Works</h3>
                  <p className="explanation-text">
                    DuoShield uses these APIs to continuously ingest real-time debris and solar data, run predictive analysis 
                    through the AZ Space backend engine, and visualize threats on a 3D globe powered by CesiumJS. The system 
                    provides risk levels and suggested mitigation actions, allowing satellite operators to make informed decisions 
                    and take proactive measures to protect their assets.
                  </p>
                </div>

                {/* Data Sources */}
                <div className="data-sources">
                  <h3 className="subsection-title">Data Sources</h3>
                  <div className="sources-grid">
                    <div className="source-card">
                      <h4>U.S. Space Command / Space-Track</h4>
                      <p>Satellite Catalog and Conjunction Bulletins</p>
                      <a href="https://www.space-track.org" target="_blank" rel="noopener noreferrer" className="source-link">
                        Visit Space-Track.org →
                      </a>
                    </div>

                    <div className="source-card">
                      <h4>SpacePolicyOnline</h4>
                      <p>Context and policy updates</p>
                      <a href="https://spacepolicyonline.com" target="_blank" rel="noopener noreferrer" className="source-link">
                        Visit SpacePolicyOnline →
                      </a>
                    </div>

                    <div className="source-card">
                      <h4>CelesTrak (T.S. Kelso)</h4>
                      <p>Public TLE data and SOCRATES conjunction reports</p>
                      <a href="https://celestrak.org" target="_blank" rel="noopener noreferrer" className="source-link">
                        Visit CelesTrak →
                      </a>
                    </div>

                    <div className="source-card">
                      <h4>NOAA SWPC Data Service</h4>
                      <p>Space weather open data (forecasts, indices, alerts)</p>
                      <a href="https://www.swpc.noaa.gov" target="_blank" rel="noopener noreferrer" className="source-link">
                        Visit NOAA SWPC →
                      </a>
                    </div>

                    <div className="source-card">
                      <h4>AWS Open Data Registry</h4>
                      <p>NOAA space weather datasets and license</p>
                      <a href="https://registry.opendata.aws" target="_blank" rel="noopener noreferrer" className="source-link">
                        Visit AWS Registry →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Footer />
          </div>
        } />
        
        
        <Route path="/about" element={
          <div className="page-wrapper">
            <section className="about-section">
              <div className="container">
                <h2 className="section-title">About AZSpace</h2>
                <p className="section-subtitle">Where technology meets creativity</p>
                
                <div className="about-content">
                  <div className="about-text">
                    <p>
                      AZSpace is a demonstration of modern web technologies working in harmony. 
                      We combine the power of React's component architecture with the visual 
                      capabilities of Three.js to create immersive web experiences.
                    </p>
                    <p>
                      Our mission is to push the boundaries of what's possible on the web, 
                      creating interfaces that are not just functional, but truly engaging 
                      and memorable.
                    </p>
                  </div>
                  
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">100%</div>
                      <div className="stat-label">TypeScript</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">60fps</div>
                      <div className="stat-label">Performance</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">∞</div>
                      <div className="stat-label">Possibilities</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <Footer />
          </div>
        } />
        
        <Route path="/features" element={
          <div className="page-wrapper">
            <section className="features-section">
              <div className="container">
                <h2 className="section-title">Amazing Features</h2>
                <p className="section-subtitle">Discover what makes AZSpace special</p>
                
                <div className="features-detailed">
                  <div className="feature-item">
                    <div className="feature-number">01</div>
                    <h3>3D Space Environment</h3>
                    <p>Experience a fully interactive 3D space with satellites, asteroids, and particle effects that respond to your movements.</p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-number">02</div>
                    <h3>Responsive Design</h3>
                    <p>Seamlessly adapts to any screen size, from mobile devices to large desktop displays.</p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-number">03</div>
                    <h3>Modern Tech Stack</h3>
                    <p>Built with the latest technologies including React 18, TypeScript, and Three.js for optimal performance.</p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-number">04</div>
                    <h3>Smooth Animations</h3>
                    <p>Every interaction is enhanced with carefully crafted animations for a delightful user experience.</p>
                  </div>
                </div>
              </div>
            </section>
            <Footer />
          </div>
        } />
        
        <Route path="/contact" element={
          <div className="page-wrapper">
            <section className="contact-section">
              <div className="container">
                <h2 className="section-title">Get In Touch</h2>
                <p className="section-subtitle">Let's create something amazing together</p>
                
                <div className="contact-content">
                  <form className="contact-form">
                    <div className="form-group">
                      <input type="text" placeholder="Your Name" className="form-input" />
                    </div>
                    <div className="form-group">
                      <input type="email" placeholder="Your Email" className="form-input" />
                    </div>
                    <div className="form-group">
                      <textarea placeholder="Your Message" rows={5} className="form-input"></textarea>
                    </div>
                    <button type="submit" className="cta-button primary">Send Message</button>
                  </form>
                </div>
              </div>
            </section>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App
