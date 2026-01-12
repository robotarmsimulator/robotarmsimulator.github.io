/**
 * Help button component
 * Provides options to replay tutorial or report an issue
 */

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import './HelpButton.css';

export default function HelpButton() {
  const [showMenu, setShowMenu] = useState(false);
  const { setAppState } = useAppContext();

  const handleReplayTutorial = () => {
    if (window.confirm('Replay the tutorial? Your current progress will be saved.')) {
      setAppState('tutorial');
      setShowMenu(false);
    }
  };

  const handleReportIssue = () => {
    window.open('https://github.com/robotarmsimulator/robotarmsimulator.github.io/issues', '_blank');
    setShowMenu(false);
  };

  return (
    <div className="help-button-container">
      <button
        className="help-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Help and support"
      >
        ?
      </button>

      {showMenu && (
        <div className="help-menu">
          <button className="help-menu-item" onClick={handleReplayTutorial}>
            Replay Tutorial
          </button>
          <button className="help-menu-item" onClick={handleReportIssue}>
            Report an Issue
          </button>
          <button className="help-menu-item close" onClick={() => setShowMenu(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
