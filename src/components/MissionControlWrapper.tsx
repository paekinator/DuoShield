import React, { useState } from 'react';
import MissionControl from '../pages/MissionControl';
import SpaceLoadingScreen from './SpaceLoadingScreen';

const MissionControlWrapper: React.FC = () => {
  const [showLoading] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const handleLoadingComplete = () => {
    setLoadingComplete(true);
  };

  if (showLoading && !loadingComplete) {
    return <SpaceLoadingScreen onComplete={handleLoadingComplete} />;
  }

  return <MissionControl />;
};

export default MissionControlWrapper;
