/**
 * Controls component
 * Provides reset, complete, undo/redo buttons
 * Recording starts automatically on first movement
 */

import { useAppContext } from '../../context/AppContext';
import './Controls.css';

export default function Controls() {
  const {
    currentTrajectory,
    resetCurrentMotion,
    completeCurrentMotion,
    undo,
    redo,
    canUndo,
    canRedo,
    recordingState,
    startPlayback,
    stopPlayback
  } = useAppContext();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the current motion? This cannot be undone.')) {
      resetCurrentMotion();
    }
  };

  const handleComplete = () => {
    if (currentTrajectory?.completed) {
      completeCurrentMotion();
    } else {
      alert('Please move the robot arm to the target position before completing.');
    }
  };

  const handlePlayback = () => {
    if (recordingState === 'playing') {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const canComplete = currentTrajectory?.completed || false;
  const hasFrames = (currentTrajectory?.frames.length || 0) > 0;
  const canPlay = hasFrames && recordingState !== 'recording';

  return (
    <div className="controls-container">
      <div className="controls-info">
        <div className="status-indicator">
          {recordingState === 'recording' && (
            <div className="recording-badge">
              <span className="pulse-dot"></span>
              Recording (move mouse to draw)
            </div>
          )}
          {recordingState === 'playing' && (
            <div className="info-badge">
              Playing back motion
            </div>
          )}
          {recordingState === 'idle' && !hasFrames && (
            <div className="info-badge">
              Click on the blue end effector to begin
            </div>
          )}
        </div>
      </div>

      <div className="controls-group">
        <button
          className={`control-button ${recordingState === 'playing' ? 'recording' : ''}`}
          onClick={handlePlayback}
          disabled={!canPlay}
          title={recordingState === 'playing' ? 'Stop playback' : 'Play recorded motion'}
        >
          <span className="icon">{recordingState === 'playing' ? '⏸' : '▶'}</span>
          <span className="label">{recordingState === 'playing' ? 'Pause' : 'Play'}</span>
        </button>

        <button
          className="control-button"
          onClick={handleReset}
          disabled={!currentTrajectory || !hasFrames || recordingState === 'playing'}
          title="Reset current motion"
        >
          <span className="icon">↻</span>
          <span className="label">Reset</span>
        </button>

        <button
          className="control-button undo"
          onClick={undo}
          disabled={!canUndo || recordingState === 'playing'}
          title="Undo last change"
        >
          <span className="icon">↶</span>
          <span className="label">Undo</span>
        </button>

        <button
          className="control-button redo"
          onClick={redo}
          disabled={!canRedo || recordingState === 'playing'}
          title="Redo last change"
        >
          <span className="icon">↷</span>
          <span className="label">Redo</span>
        </button>
      </div>

      <button
        className={`control-button complete ${canComplete ? 'ready' : ''}`}
        onClick={handleComplete}
        disabled={!canComplete || recordingState === 'playing'}
        title={canComplete ? 'Complete and move to next prompt' : 'Move arm to target first'}
      >
        <span className="icon">✓</span>
        <span className="label">Complete</span>
      </button>
    </div>
  );
}
