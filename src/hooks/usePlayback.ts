/**
 * usePlayback hook
 * Manages playback of recorded motion frames with accurate timing
 */

import { useEffect, useRef } from 'react';
import type { RobotArmConfig, MotionTrajectory, RecordingState } from '../types';

interface UsePlaybackProps {
  recordingState: RecordingState;
  currentTrajectory: MotionTrajectory | null;
  robotConfig: RobotArmConfig;
  setRobotConfig: (config: RobotArmConfig | ((prev: RobotArmConfig) => RobotArmConfig)) => void;
  stopPlayback: () => void;
}

export function usePlayback({
  recordingState,
  currentTrajectory,
  robotConfig,
  setRobotConfig,
  stopPlayback
}: UsePlaybackProps) {
  const playbackStartTimeRef = useRef<number>(0);
  const pausedAtTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentTrajectoryRef = useRef(currentTrajectory);
  const setRobotConfigRef = useRef(setRobotConfig);
  const stopPlaybackRef = useRef(stopPlayback);

  // Keep refs in sync
  useEffect(() => {
    currentTrajectoryRef.current = currentTrajectory;
    setRobotConfigRef.current = setRobotConfig;
    stopPlaybackRef.current = stopPlayback;
  }, [currentTrajectory, setRobotConfig, stopPlayback]);

  // Store pause time when paused
  useEffect(() => {
    if (recordingState === 'paused' && currentTrajectory && animationFrameRef.current) {
      // Find current frame based on robot config
      const currentFrame = currentTrajectory.frames.find(
        frame => Math.abs(frame.shoulderAngle - robotConfig.shoulderAngle) < 0.01 &&
                 Math.abs(frame.elbowAngle - robotConfig.elbowAngle) < 0.01
      );
      if (currentFrame) {
        pausedAtTimeRef.current = currentFrame.timestamp;
      }
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, [recordingState, currentTrajectory, robotConfig]);

  useEffect(() => {
    if (recordingState === 'playing' && currentTrajectory && currentTrajectory.frames.length > 0) {
      // When resuming from pause, adjust start time to account for paused duration
      const now = performance.now();
      if (pausedAtTimeRef.current > 0) {
        playbackStartTimeRef.current = now - pausedAtTimeRef.current;
      } else {
        playbackStartTimeRef.current = now;
        pausedAtTimeRef.current = 0;
      }

      const animate = (currentTime: number) => {
        const trajectory = currentTrajectoryRef.current;
        if (!trajectory || trajectory.frames.length === 0) return;

        // Calculate elapsed time since playback started
        const elapsedTime = currentTime - playbackStartTimeRef.current;

        // Binary search to find the frame that corresponds to this time
        let left = 0;
        let right = trajectory.frames.length - 1;
        let frameIndex = 0;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (trajectory.frames[mid].timestamp <= elapsedTime) {
            frameIndex = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        const targetFrame = trajectory.frames[frameIndex];

        // If we've reached the end, stop playback
        if (frameIndex >= trajectory.frames.length - 1) {
          setRobotConfigRef.current((prevConfig) => ({
            ...prevConfig,
            shoulderAngle: trajectory.frames[trajectory.frames.length - 1].shoulderAngle,
            elbowAngle: trajectory.frames[trajectory.frames.length - 1].elbowAngle
          }));
          stopPlaybackRef.current();
          return;
        }

        // Update robot config to match this frame
        setRobotConfigRef.current((prevConfig) => ({
          ...prevConfig,
          shoulderAngle: targetFrame.shoulderAngle,
          elbowAngle: targetFrame.elbowAngle
        }));

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recordingState, currentTrajectory]);
}
