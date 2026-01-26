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
  playbackFrame: number;
  setPlaybackFrame: (frame: number) => void;
}

export function usePlayback({
  recordingState,
  currentTrajectory,
  setRobotConfig,
  stopPlayback,
  playbackFrame,
  setPlaybackFrame
}: UsePlaybackProps) {
  const playbackStartTimeRef = useRef<number>(0);
  const startFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentTrajectoryRef = useRef(currentTrajectory);
  const setRobotConfigRef = useRef(setRobotConfig);
  const stopPlaybackRef = useRef(stopPlayback);
  const setPlaybackFrameRef = useRef(setPlaybackFrame);
  const wasPlayingRef = useRef(false);
  const startingFrameRef = useRef(0);
  const lastFrameIndexRef = useRef(-1);

  // Keep refs in sync - update synchronously during render for immediate access
  currentTrajectoryRef.current = currentTrajectory;
  setRobotConfigRef.current = setRobotConfig;
  stopPlaybackRef.current = stopPlayback;
  setPlaybackFrameRef.current = setPlaybackFrame;

  // Capture starting frame when transitioning TO playing state
  // This runs before the main effect, ensuring we have the correct starting frame
  if (recordingState === 'playing' && !wasPlayingRef.current) {
    startingFrameRef.current = playbackFrame;
  }
  wasPlayingRef.current = recordingState === 'playing';

  // Handle playback state changes
  useEffect(() => {
    // Cancel any existing animation when state changes
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    if (recordingState === 'playing' && currentTrajectory && currentTrajectory.frames.length > 0) {
      // Use the starting frame captured during render
      const startFrame = Math.min(startingFrameRef.current, currentTrajectory.frames.length - 1);
      startFrameTimeRef.current = currentTrajectory.frames[startFrame]?.timestamp || 0;
      playbackStartTimeRef.current = performance.now();
      lastFrameIndexRef.current = startFrame;

      const animate = (currentTime: number) => {
        const trajectory = currentTrajectoryRef.current;
        if (!trajectory || trajectory.frames.length === 0) return;

        // Calculate elapsed time since playback started, offset by starting frame time
        const elapsedTime = (currentTime - playbackStartTimeRef.current) + startFrameTimeRef.current;

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

        // Only update state if the frame actually changed
        if (frameIndex !== lastFrameIndexRef.current) {
          lastFrameIndexRef.current = frameIndex;
          const targetFrame = trajectory.frames[frameIndex];

          // Update the playback frame for the timeline to show
          setPlaybackFrameRef.current(frameIndex);

          // Update robot config to match this frame
          setRobotConfigRef.current((prevConfig) => ({
            ...prevConfig,
            shoulderAngle: targetFrame.shoulderAngle,
            elbowAngle: targetFrame.elbowAngle
          }));
        }

        // If we've reached the end, stop playback
        if (frameIndex >= trajectory.frames.length - 1) {
          stopPlaybackRef.current();
          return;
        }

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [recordingState, currentTrajectory]);
}
