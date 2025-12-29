/**
 * SplashScreen component
 * Initial screen with optional User ID input
 */

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import './SplashScreen.css';

export default function SplashScreen() {
  const [userId, setUserId] = useState('');
  const { initializeSession, setAppState } = useAppContext();

  const handleStart = () => {
    // Randomly assign prompt set
    const promptSet = Math.random() < 0.5 ? 'laban' : 'metaphor';

    // Initialize session
    initializeSession(userId || null, promptSet);

    // Move to tutorial
    setAppState('tutorial');
  };

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1 className="splash-title">Robot Arm Simulator</h1>
        <p className="splash-subtitle">
          Expressive Motion Data Collection Study
        </p>

        <div className="splash-description">
          <p>
            Welcome to the Robot Arm Simulator. In this study, you will create 8 different
            motions using a 2D robot arm. Each motion will be guided by a prompt describing
            a quality or feeling to express through movement.
          </p>
          <p>
            Your task is to move the robot arm from its starting position to the target
            position in a way that expresses the given prompt.
          </p>
        </div>

        <div className="user-id-section">
          <label htmlFor="userId" className="user-id-label">
            Participant ID (optional)
          </label>
          <input
            type="text"
            id="userId"
            className="user-id-input"
            placeholder="Enter your Prolific ID or leave blank"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <p className="user-id-hint">
            If you are participating through Prolific, please enter your Prolific ID.
            Otherwise, you can leave this blank.
          </p>
        </div>

        <button className="start-button" onClick={handleStart}>
          Begin Tutorial
        </button>
      </div>
    </div>
  );
}
