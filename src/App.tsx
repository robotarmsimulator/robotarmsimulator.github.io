/**
 * Main App component
 * Routes between different application states
 */

import { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Tutorial from './components/Tutorial/Tutorial';
import EndScreen from './components/EndScreen/EndScreen';
import RobotArm from './components/RobotArm/RobotArm';
import Controls from './components/Controls/Controls';
import Timeline from './components/Timeline/Timeline';
import PromptDisplay from './components/PromptDisplay/PromptDisplay';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import { generateRandomTarget, ROBOT_CONFIG } from './constants/config';
import { getPromptText } from './constants/prompts';
import './App.css';

function AppContent() {
  const {
    appState,
    userSession,
    setTargetPosition,
    setCurrentTrajectory,
    currentTrajectory,
    setRobotConfig,
    robotConfig
  } = useAppContext();

  // Initialize new motion when entering recording state or moving to next prompt
  useEffect(() => {
    if (appState === 'recording' && userSession && !currentTrajectory) {
      const currentPromptType = userSession.promptOrder[userSession.currentPromptIndex];
      const promptText = getPromptText(currentPromptType, userSession.promptSet);
      const target = generateRandomTarget();

      // Reset robot to initial position
      setRobotConfig({
        ...robotConfig,
        shoulderAngle: ROBOT_CONFIG.initialShoulderAngle,
        elbowAngle: ROBOT_CONFIG.initialElbowAngle
      });

      setTargetPosition(target);
      setCurrentTrajectory({
        frames: [],
        startPosition: { x: 50, y: 50 }, // Default start position
        targetPosition: target,
        promptType: currentPromptType,
        promptText,
        completed: false,
        attemptCount: 1,
        totalTimeMs: 0
      });
    }
  }, [appState, userSession, currentTrajectory]);

  // Render appropriate screen based on app state
  if (appState === 'splash') {
    return <SplashScreen />;
  }

  if (appState === 'tutorial') {
    return <Tutorial />;
  }

  if (appState === 'completed') {
    return <EndScreen />;
  }

  // Recording state - main application interface
  return (
    <div className="app-main">
      <ProgressIndicator />
      <PromptDisplay />
      <RobotArm />
      <Timeline />
      <Controls />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
