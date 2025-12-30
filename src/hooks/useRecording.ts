/**
 * useRecording hook
 * Manages recording state and frame capture
 * Uses requestAnimationFrame for optimal recording at display refresh rate
 */

import { useEffect, useRef } from 'react';
import type { RobotArmConfig, MotionFrame, MotionTrajectory, RecordingState } from '../types';
import { forwardKinematics } from '../utils/kinematics';

interface UseRecordingProps {
  recordingState: RecordingState;
  robotConfig: RobotArmConfig;
  currentTrajectory: MotionTrajectory | null;
  setCurrentTrajectory: (trajectory: MotionTrajectory) => void;
}

export function useRecording({
  recordingState,
  robotConfig,
  currentTrajectory,
  setCurrentTrajectory
}: UseRecordingProps) {
  const startTimeRef = useRef<number>(0);
  const lastRecordedConfigRef = useRef<{ shoulderAngle: number; elbowAngle: number } | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const robotConfigRef = useRef(robotConfig);
  const currentTrajectoryRef = useRef(currentTrajectory);
  const setCurrentTrajectoryRef = useRef(setCurrentTrajectory);

  // Keep refs in sync
  useEffect(() => {
    robotConfigRef.current = robotConfig;
    currentTrajectoryRef.current = currentTrajectory;
    setCurrentTrajectoryRef.current = setCurrentTrajectory;
  }, [robotConfig, currentTrajectory, setCurrentTrajectory]);

  // Recording loop using requestAnimationFrame
  useEffect(() => {
    if (recordingState === 'recording') {
      // Initialize start time on first recording or continuing from a point
      if (startTimeRef.current === 0) {
        const trajectory = currentTrajectoryRef.current;
        const baseTimestamp = trajectory && trajectory.frames.length > 0
          ? trajectory.frames[trajectory.frames.length - 1].timestamp
          : 0;
        startTimeRef.current = performance.now() - baseTimestamp;
      }

      // Recording loop
      const recordFrame = () => {
        const config = robotConfigRef.current;
        const trajectory = currentTrajectoryRef.current;

        if (!trajectory) {
          animationFrameRef.current = requestAnimationFrame(recordFrame);
          return;
        }

        // Check if configuration actually changed (avoid duplicate frames)
        const lastConfig = lastRecordedConfigRef.current;
        const hasChanged = !lastConfig ||
          Math.abs(lastConfig.shoulderAngle - config.shoulderAngle) > 0.0001 ||
          Math.abs(lastConfig.elbowAngle - config.elbowAngle) > 0.0001;

        if (hasChanged) {
          // Record this frame
          const { elbowPosition, endEffectorPosition } = forwardKinematics(config);

          const frame: MotionFrame = {
            timestamp: performance.now() - startTimeRef.current,
            shoulderAngle: config.shoulderAngle,
            elbowAngle: config.elbowAngle,
            endEffectorPosition,
            elbowPosition
          };

          setCurrentTrajectoryRef.current({
            ...trajectory,
            frames: [...trajectory.frames, frame]
          });

          // Update last recorded configuration
          lastRecordedConfigRef.current = {
            shoulderAngle: config.shoulderAngle,
            elbowAngle: config.elbowAngle
          };
        }

        // Continue recording loop
        animationFrameRef.current = requestAnimationFrame(recordFrame);
      };

      // Start recording loop
      animationFrameRef.current = requestAnimationFrame(recordFrame);
    } else {
      // Stop recording
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      startTimeRef.current = 0;
      lastRecordedConfigRef.current = null;
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recordingState]);
}
