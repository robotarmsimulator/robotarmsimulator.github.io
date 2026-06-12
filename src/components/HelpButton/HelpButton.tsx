/**
 * Help button component
 * Provides options to replay tutorial, replay a trajectory CSV, or report an issue
 */

import { useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { importTrajectoryCSV } from '../../utils/dataExport';
import './HelpButton.css';

export default function HelpButton() {
  const [showMenu, setShowMenu] = useState(false);
  const { appState, setAppState, setCurrentTrajectory, setPlaybackFrame, setRecordingState } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplayTutorial = () => {
    if (window.confirm('Replay the tutorial? Your current progress will be saved.')) {
      setAppState('tutorial');
      setShowMenu(false);
    }
  };

  const handleReplayTrajectory = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const trajectory = await importTrajectoryCSV(file);
    if (!trajectory) {
      alert('Could not read the trajectory file. Please select a valid trajectory CSV.');
      return;
    }

    setCurrentTrajectory(trajectory);
    setPlaybackFrame(0);
    setRecordingState('playing');
    if (appState !== 'recording') {
      setAppState('recording');
    }
  };

  const handleReportIssue = () => {
    window.open('https://github.com/robotarmsimulator/robotarmsimulator.github.io/issues', '_blank');
    setShowMenu(false);
  };

  return (
    <div className="help-button-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
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
          <button className="help-menu-item" onClick={handleReplayTrajectory}>
            Replay Trajectory
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
