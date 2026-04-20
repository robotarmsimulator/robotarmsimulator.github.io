/**
 * Timeline component
 * Video-player style timeline with step controls and scrubbing
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './Timeline.css';

// Track if user has seen the redraw hint. This persists across component remounts within session
let hasShownRedrawHint = false;

const STEP_FRAMES = 1; // play around with this

export default function Timeline() {
  const [isDragging, setIsDragging] = useState(false);
  const [showRedrawConfirm, setShowRedrawConfirm] = useState(false);
  const [liveRecordingMs, setLiveRecordingMs] = useState<number>(0);
  const recordingStartRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const {
    currentTrajectory,
    setRobotConfig,
    robotConfig,
    redrawFromFrame,
    playbackFrame,
    setPlaybackFrame,
    recordingState
  } = useAppContext();

  const currentFrame = playbackFrame;
  const totalFrames = currentTrajectory?.frames.length || 0;
  const isPlaying = recordingState === 'playing';

  // drive a live clock from performance.now() during recording so the display
  // never pauses when the arm is stationary
  useEffect(() => {
    if (recordingState === 'recording') {
      const baseMs = currentTrajectory?.frames.at(-1)?.timestamp ?? 0;
      recordingStartRef.current = performance.now() - baseMs;

      const id = setInterval(() => {
        setLiveRecordingMs(performance.now() - recordingStartRef.current);
      }, 100);
      return () => clearInterval(id);
    } else {
      setLiveRecordingMs(0);
    }
  }, [recordingState]);

  // const currentTimeMs =
  //   totalFrames > 0 && currentTrajectory
  //     ? (currentTrajectory.frames[Math.min(currentFrame, totalFrames - 1)]?.timestamp ?? 0)
  //     : 0;

  const frameTimeMs =
  totalFrames > 0 && currentTrajectory
    ? (currentTrajectory.frames[Math.min(currentFrame, totalFrames - 1)]?.timestamp ?? 0)
    : 0;

  const [playbackNow, setPlaybackNow] = useState(0);
  const playbackStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (recordingState === 'playing') {
      // const startTime =
      //   currentTrajectory?.frames[currentFrame]?.timestamp ?? 0;
      const startTime = frameTimeMs;
      playbackStartRef.current = performance.now() - startTime;

      const tick = () => {
        setPlaybackNow(performance.now());
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [recordingState, frameTimeMs]);

  const currentTimeMs =
    recordingState === 'playing'
      ? playbackNow - playbackStartRef.current
      : frameTimeMs;
      
  const totalTimeMs =
    totalFrames > 0 && currentTrajectory
      ? currentTrajectory.frames[totalFrames - 1].timestamp
      : 0;

  // During recording, use the live wall-clock value instead of frame timestamps
  const displayCurrentMs = recordingState === 'recording' ? liveRecordingMs : currentTimeMs;
  const displayTotalMs = recordingState === 'recording' ? liveRecordingMs : totalTimeMs;

  const formatTime = (ms: number) => (ms / 1000).toFixed(1) + 's';

  // During recording the scrub head is always pinned to the end
  // const progress = recordingState === 'recording'
  //   ? 1
  //   : (totalFrames > 1 ? currentFrame / (totalFrames - 1) : 0);

  const progress =
  totalTimeMs > 0
    ? currentTimeMs / totalTimeMs
    : 0;

  // this updates robot config when frame changes during scrubbing
  useEffect(() => {
    if (!currentTrajectory || totalFrames === 0 || recordingState === 'playing') return;
    const frame = currentTrajectory.frames[currentFrame];
    if (frame) {
      setRobotConfig({
        ...robotConfig,
        shoulderAngle: frame.shoulderAngle,
        elbowAngle: frame.elbowAngle
      });
    }
  }, [currentFrame, recordingState]);

  // Reset to last frame when trajectory changes
  useEffect(() => {
    if (totalFrames > 0) {
      setPlaybackFrame(totalFrames - 1);
    }
  }, [totalFrames]);

  const seekToFrame = useCallback(
    (frame: number) => {
      if (isPlaying) return;
      setPlaybackFrame(Math.max(0, Math.min(totalFrames - 1, frame)));
    },
    [isPlaying, totalFrames, setPlaybackFrame]
  );

  const getFrameFromPointer = useCallback((clientX: number): number => {
    if (!trackRef.current || totalFrames === 0) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.round(Math.max(0, Math.min(1, ratio)) * (totalFrames - 1));
  }, [totalFrames]);

  // Attach document-level mouse listeners while dragging so the scrub
  // continues even when the pointer leaves the track element.
  useEffect(() => {
    if (!isDragging) return;
 
    const handleMouseMove = (e: MouseEvent) => {
      seekToFrame(getFrameFromPointer(e.clientX));
    };
 
    const handleMouseUp = () => {
      setIsDragging(false);
    };
 
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
 
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, seekToFrame, getFrameFromPointer]);

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    setIsDragging(true);
    seekToFrame(getFrameFromPointer(e.clientX));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isPlaying) return;
    setIsDragging(true);
    seekToFrame(getFrameFromPointer(e.touches[0].clientX));
  }; 
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging || isPlaying) return;
    seekToFrame(getFrameFromPointer(e.touches[0].clientX));
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleRedrawFromHere = () => {
    if (!hasShownRedrawHint) {
      setShowRedrawConfirm(true);
    } else {
      redrawFromFrame(currentFrame);
    }
  };

  const confirmRedraw = () => {
    hasShownRedrawHint = true;
    setShowRedrawConfirm(false);
    redrawFromFrame(currentFrame);
  };

  const cancelRedraw = () => setShowRedrawConfirm(false);

  const canRedraw = currentFrame > 0 && currentFrame < totalFrames - 1;

  if (!currentTrajectory || totalFrames === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">
          Click the robot's blue gripper to start recording.
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="timeline-player">
        {/* Skip to start */}
        <button
          className="timeline-step-btn"
          onClick={() => seekToFrame(0)}
          disabled={isPlaying || currentFrame === 0}
          title="Skip to beginning"
        >
          <SkipBack size={12} />
        </button>

        {/* Step back */}
        <button
          className="timeline-step-btn"
          onClick={() => seekToFrame(currentFrame - STEP_FRAMES)}
          disabled={isPlaying || currentFrame === 0}
          title="Step back"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Scrubbable progress track */}
        <div
          ref={trackRef}
          className={`timeline-track${isDragging ? ' dragging' : ''}`}
          onMouseDown={handleTrackMouseDown}
          //onMouseMove={handleTrackMouseMove}
          //onMouseUp={handleTrackMouseUp}
          // onMouseLeave={handleTrackMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="timeline-fill" style={{ width: `${progress * 100}%` }} />
          <div className="timeline-thumb" style={{ left: `${progress * 100}%` }} />
        </div>

        {/* Step forward */}
        <button
          className="timeline-step-btn"
          onClick={() => seekToFrame(currentFrame + STEP_FRAMES)}
          disabled={isPlaying || currentFrame >= totalFrames - 1}
          title="Step forward"
        >
          <ChevronRight size={14} />
        </button>

        {/* skip to end */}
        <button
          className="timeline-step-btn"
          onClick={() => seekToFrame(totalFrames - 1)}
          disabled={isPlaying || currentFrame >= totalFrames - 1}
          title="Skip to end"
        >
          <SkipForward size={12} />
        </button>

        <span className="timeline-time">
          {formatTime(displayCurrentMs)} / {formatTime(displayTotalMs)}
        </span>
      </div>

      <button
        className="redraw-button"
        onClick={handleRedrawFromHere}
        disabled={!canRedraw || isPlaying}
        title={
          canRedraw
            ? 'Delete everything after this point and continue drawing from here'
            : 'Scrub to a point in the middle to use Redraw'
        }
      >
        Redraw from Here
      </button>

      {showRedrawConfirm && (
        <div className="modal-overlay" onClick={cancelRedraw}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Redraw from Here?</h3>
            <p>
              Everything after this point will be deleted. You can then continue
              drawing from here.
            </p>
            <div className="modal-buttons">
              <button className="modal-button primary" onClick={confirmRedraw}>
                Redraw
              </button>
              <button className="modal-button" onClick={cancelRedraw}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
