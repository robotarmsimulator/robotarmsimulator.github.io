/**
 * Main App component
 * Routes between different application states
 */

import { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Tutorial from './components/Tutorial/Tutorial';
import EndScreen from './components/EndScreen/EndScreen';
import RobotArm from './components/RobotArm/RobotArm';
import Controls from './components/Controls/Controls';
import PromptDisplay from './components/PromptDisplay/PromptDisplay';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import HelpButton from './components/HelpButton/HelpButton';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { getActivePosePreset } from './constants/config';
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
      const activePose = getActivePosePreset();

      // Reset robot to initial position from active preset
      setRobotConfig({
        ...robotConfig,
        shoulderAngle: activePose.initialShoulderAngle,
        elbowAngle: activePose.initialElbowAngle
      });

      setTargetPosition(activePose.targetPosition);
      setCurrentTrajectory({
        frames: [],
        startPosition: { x: 50, y: 50 }, // Default start position
        targetPosition: activePose.targetPosition,
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
    <>
      <div className="app-main">
        <div className="top-bar">
          <div className="top-bar-left">
            <PromptDisplay />
          </div>
          <div className="top-bar-right">
            <ProgressIndicator />
            <ThemeToggle />
            <HelpButton />
          </div>
        </div>
        <RobotArm />
        <Controls />
      </div>
      <footer className="app-footer">
        Robot Arm Simulator v8.0 | Created by Damien Pearl |
        <a href="https://github.com/dmprgm/robot-arm-sim_v8.0.0" target="_blank" rel="noopener noreferrer"> GitHub</a>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
