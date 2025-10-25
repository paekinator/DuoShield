import React, { useEffect, useState } from 'react';
import './SpaceLoadingScreen.css';

interface SpaceLoadingScreenProps {
  onComplete: () => void;
}

const SpaceLoadingScreen: React.FC<SpaceLoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Mission Control...');

  const loadingSteps = [
    'Initializing Mission Control...',
    'Loading Orbital Data...',
    'Calibrating Sensors...',
    'Establishing Communication...',
    'Ready for Launch!'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 20;
        if (newProgress <= 100) {
          const stepIndex = Math.floor(newProgress / 20);
          if (stepIndex < loadingSteps.length) {
            setLoadingText(loadingSteps[stepIndex]);
          }
        }
        return newProgress;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [progress, onComplete]);

  return (
    <div className="space-loading-screen">
      <div className="loading-background">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      
      <div className="loading-content">
        <div className="loading-logo">
          <img src="/AZSpaceLogo.png" alt="AZSpace Logo" className="loading-logo-img" />
        </div>
        
        <div className="loading-title">
          <h1>AZSPACE</h1>
          <p>Mission Control</p>
        </div>
        
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{loadingText}</div>
          <div className="progress-percentage">{progress}%</div>
        </div>
        
        <div className="loading-animation">
          <div className="satellite">
            <div className="satellite-body"></div>
            <div className="satellite-solar-panel left"></div>
            <div className="satellite-solar-panel right"></div>
            <div className="satellite-antenna"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceLoadingScreen;
