/**
 * SplashScreen component
 * Initial screen with optional User ID input
 */

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { generateRandomParticipantId } from '../../utils/dataExport';
import './SplashScreen.css';

export default function SplashScreen() {
  const [userId, setUserId] = useState('');
  const [condition, setCondition] = useState<'1' | '2' | ''>('');
  const { initializeSession, setAppState } = useAppContext();

  const handleStart = () => {
    // CONDITION-BASED assignment: 1 = laban, 2 = metaphor
    // User selects condition on the splash screen.
    const promptSet = condition === '1' ? 'laban' : 'metaphor';

    // RANDOM assignment (commented out — restore to re-enable):
    // const promptSet = Math.random() < 0.5 ? 'laban' : 'metaphor';

    // Generate random ID if user didn't provide one
    const participantId = userId.trim() || generateRandomParticipantId();

    // Initialize session
    initializeSession(participantId, promptSet);

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
            {/* Participant ID (optional) (normal version) */}
            Student Name
          </label>
          <input
            type="text"
            id="userId"
            className="user-id-input"
            // placeholder="Enter your Prolific ID or leave blank" normal version
            placeholder="Example: Jane Doe" // K class study version
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <p className="user-id-hint">
            {/* If you are participating through Prolific, please enter your Prolific ID.
            Otherwise, you can leave this blank. */}
            Enter your first and last name in this format. It should match the name you use in class.
          </p>
        </div>

        <div className="condition-section">
          <label className="user-id-label">Condition</label>
          <div className="condition-buttons">
            <button
              className={`condition-button${condition === '1' ? ' condition-button--selected' : ''}`}
              onClick={() => setCondition('1')}
              type="button"
            >
              1
            </button>
            <button
              className={`condition-button${condition === '2' ? ' condition-button--selected' : ''}`}
              onClick={() => setCondition('2')}
              type="button"
            >
              2
            </button>
          </div>
          <p className="user-id-hint">Select the condition number assigned to you.</p>
        </div>

        <button
          className="start-button"
          onClick={handleStart}
          disabled={condition === ''}
        >
          Begin Tutorial
        </button>
      </div>
    </div>
  );
}
