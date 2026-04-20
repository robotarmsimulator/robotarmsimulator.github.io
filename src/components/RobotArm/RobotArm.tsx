/**
 * RobotArm component
 * Mouse-follow control system with automatic recording
 */

import { useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { forwardKinematics } from '../../utils/kinematics';
import { CANVAS_CONFIG } from '../../constants/config';
import { useMouseTracking } from '../../hooks/useMouseTracking';
import { useRobotControl } from '../../hooks/useRobotControl';
import { useRecording } from '../../hooks/useRecording';
import { usePlayback } from '../../hooks/usePlayback';
import { useTargetDetection } from '../../hooks/useTargetDetection';
import {
  clearCanvas,
  drawWorkspace,
  drawRobotArmEnhanced,
  drawTrajectoryPath,
  drawTarget,
  drawCursorIndicator,
  drawRecordingIndicator
} from '../../utils/canvasRendering';
import './RobotArm.css';

export default function RobotArm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    robotConfig,
    setRobotConfig,
    targetPosition,
    recordingState,
    currentTrajectory,
    setCurrentTrajectory,
    startRecording,
    stopRecording,
    stopPlayback,
    playbackFrame,
    setPlaybackFrame
  } = useAppContext();

  // Pointer tracking (handles mouse, touch, and stylus uniformly)
  const {
    mousePosition,
    isFollowing,
    setIsFollowing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave
  } = useMouseTracking({ canvasRef, robotConfig, recordingState });

  // Robot movement control
  useRobotControl({
    mousePosition,
    isFollowing,
    setIsFollowing,
    robotConfig,
    setRobotConfig,
    targetPosition,
    recordingState,
    currentTrajectory,
    startRecording,
    stopRecording
  });

  // Recording functionality
  const { frameBufferRef } = useRecording({
    recordingState,
    robotConfig,
    currentTrajectory,
    setCurrentTrajectory
  });

  // Playback functionality
  usePlayback({
    recordingState,
    currentTrajectory,
    robotConfig,
    setRobotConfig,
    stopPlayback,
    playbackFrame,
    setPlaybackFrame
  });

  // Target detection
  useTargetDetection({
    robotConfig,
    targetPosition,
    currentTrajectory,
    setCurrentTrajectory
  });

  // Render the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;

    canvas.width = CANVAS_CONFIG.width * dpr;
    canvas.height = CANVAS_CONFIG.height * dpr;

    ctx.scale(dpr, dpr);

    // Clear canvas
    clearCanvas(ctx);

    // Draw workspace area (range circle centered on robot base)
    drawWorkspace(ctx, robotConfig.shoulderPosition);

    // Calculate arm positions
    const { elbowPosition, endEffectorPosition } = forwardKinematics(robotConfig);

    // Draw trajectory path first (underneath).
    // During recording, read directly from the live buffer (no React state update needed).
    // After recording, use the flushed trajectory from state.
    const pathFrames = recordingState === 'recording'
      ? frameBufferRef.current
      : (currentTrajectory?.frames ?? []);
    if (pathFrames.length > 1) {
      drawTrajectoryPath(ctx, pathFrames);
    }

    // Draw target
    if (targetPosition) {
      drawTarget(ctx, targetPosition);
    }

    // Draw robot arm with depth
    drawRobotArmEnhanced(ctx, robotConfig.shoulderPosition, elbowPosition, endEffectorPosition);

    // Draw cursor indicator ONLY when NOT dragging
    // While dragging, the end effector itself shows where the robot is (direct manipulation)
    if (!isFollowing && mousePosition) {
      drawCursorIndicator(ctx, mousePosition);
    }

    // Draw recording indicator
    if (recordingState === 'recording') {
      drawRecordingIndicator(ctx);
    }
  }, [robotConfig, targetPosition, currentTrajectory, mousePosition, isFollowing, recordingState]);

  return (
    <div className="robot-arm-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_CONFIG.width}
        height={CANVAS_CONFIG.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="robot-arm-canvas"
      />
    </div>
  );
}
