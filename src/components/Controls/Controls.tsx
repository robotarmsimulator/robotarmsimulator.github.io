/**
 * Controls component
 * Provides reset, complete, undo/redo buttons
 * Recording starts automatically on first movement
 */

import { useState } from 'react';
import { Play, Pause, RotateCcw, Undo2, Redo2, Check, Waves } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { gaussianSmoothTrajectory, strengthToSigma } from '../../utils/smoothing';
import Timeline from '../Timeline/Timeline';
import type { MotionTrajectory } from '../../types';
import './Controls.css';

export default function Controls() {
  const [smoothingStrength, setSmoothingStrength] = useState(0);
  const [showSmoothingSlider, setShowSmoothingSlider] = useState(false);
  const [originalTrajectory, setOriginalTrajectory] = useState<MotionTrajectory | null>(null);
  const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false);
  const [showPlaybackWarning, setShowPlaybackWarning] = useState(false);

  const {
    currentTrajectory,
    setCurrentTrajectory,
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
    if (window.confirm('Are you sure you want to reset the current motion? This CAN be undone.')) {
      resetCurrentMotion();
      setHasPlayedAnimation(false);
    }
  };

  const handleComplete = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!currentTrajectory?.completed) {
      alert('Please move the robot arm to the target position before completing.');
      return;
    }

    // Check if Ctrl key is pressed for bypass
    const ctrlPressed = e.ctrlKey || e.metaKey;

    // Check if animation has been played
    if (!hasPlayedAnimation && !ctrlPressed) {
      setShowPlaybackWarning(true);
      return;
    }

    // All checks passed, complete the motion
    completeCurrentMotion();
    setHasPlayedAnimation(false);
  };

  const handlePlayback = () => {
    if (recordingState === 'playing') {
      stopPlayback();
    } else {
      startPlayback();
      setHasPlayedAnimation(true);
    }
  };

  const handleOpenSmoothing = () => {
    if (!currentTrajectory || currentTrajectory.frames.length < 3) {
      alert('Not enough frames to smooth. Please record a longer motion.');
      return;
    }
    // Save original trajectory for real-time preview
    setOriginalTrajectory(currentTrajectory);
    setSmoothingStrength(0);
    setShowSmoothingSlider(true);
  };

  const handleSmoothingChange = (value: number) => {
    setSmoothingStrength(value);

    if (originalTrajectory && value > 0) {
      const sigma = strengthToSigma(value);
      const smoothed = gaussianSmoothTrajectory(originalTrajectory, sigma);
      setCurrentTrajectory(smoothed);
    } else if (originalTrajectory && value === 0) {
      setCurrentTrajectory(originalTrajectory);
    }
  };

  const handleCancelSmoothing = () => {
    if (originalTrajectory) {
      setCurrentTrajectory(originalTrajectory);
    }
    setShowSmoothingSlider(false);
    setOriginalTrajectory(null);
    setSmoothingStrength(0);
  };

  const handleDoneSmoothing = () => {
    // Keep the smoothed version
    setShowSmoothingSlider(false);
    setOriginalTrajectory(null);
  };

  const canComplete = currentTrajectory?.completed || false;
  const hasFrames = (currentTrajectory?.frames.length || 0) > 0;
  const canPlay = hasFrames && recordingState !== 'recording';

  return (
    <div className="controls-container">
      <div className="controls-main">
        <Timeline />

        <div className="controls-group">
        <button
          className={`control-button ${recordingState === 'playing' ? 'recording' : ''}`}
          onClick={handlePlayback}
          disabled={!canPlay}
          title={recordingState === 'playing' ? 'Stop playback' : 'Play recorded motion'}
        >
          {recordingState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
          <span className="label">{recordingState === 'playing' ? 'Pause' : 'Play'}</span>
        </button>

        <button
          className="control-button"
          onClick={handleReset}
          disabled={!currentTrajectory || !hasFrames || recordingState === 'playing'}
          title="Reset current motion"
        >
          <RotateCcw size={16} />
          <span className="label">Reset</span>
        </button>

        <button
          className="control-button smooth"
          onClick={handleOpenSmoothing}
          disabled={!hasFrames || recordingState === 'playing'}
          title="Smooth out the trajectory"
        >
          <Waves size={16} />
          <span className="label">Smooth</span>
        </button>

        <button
          className="control-button undo"
          onClick={undo}
          disabled={!canUndo || recordingState === 'playing'}
          title="Undo last change"
        >
          <Undo2 size={16} />
          <span className="label">Undo</span>
        </button>

        <button
          className="control-button redo"
          onClick={redo}
          disabled={!canRedo || recordingState === 'playing'}
          title="Redo last change"
        >
          <Redo2 size={16} />
          <span className="label">Redo</span>
        </button>
        </div>

        <button
          className={`control-button complete ${canComplete ? 'ready' : ''}`}
          onClick={handleComplete}
          disabled={!canComplete || recordingState === 'playing'}
          title={canComplete ? 'Complete and move to next prompt' : 'Move arm to target first'}
        >
          <Check size={16} />
          <span className="label">Complete</span>
        </button>
      </div>

      {showSmoothingSlider && (
        <div className="smoothing-panel">
          <div className="smoothing-header">
            <label htmlFor="smoothing-slider">Smoothing Strength (drag to preview)</label>
            <span className="smoothing-value">{smoothingStrength}%</span>
          </div>
          <input
            id="smoothing-slider"
            type="range"
            min="0"
            max="100"
            value={smoothingStrength}
            onChange={(e) => handleSmoothingChange(Number(e.target.value))}
            className="smoothing-slider"
          />
          <div className="smoothing-buttons">
            <button className="smoothing-apply" onClick={handleDoneSmoothing}>
              Done
            </button>
            <button className="smoothing-cancel" onClick={handleCancelSmoothing}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPlaybackWarning && (
        <div className="modal-overlay" onClick={() => setShowPlaybackWarning(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Play Animation First</h3>
            <p>Please play the animation before continuing to the next prompt. This helps ensure you review your motion.</p>
            <div className="modal-buttons">
              <button
                className="modal-button primary"
                onClick={() => {
                  setShowPlaybackWarning(false);
                  handlePlayback();
                }}
              >
                Play Now
              </button>
              <button
                className="modal-button"
                onClick={() => setShowPlaybackWarning(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
