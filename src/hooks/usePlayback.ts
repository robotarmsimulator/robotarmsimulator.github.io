/**
 * usePlayback hook
 * Manages playback of recorded motion frames
 */

import { useEffect, useRef } from 'react';
import type { RobotArmConfig, MotionTrajectory, RecordingState } from '../types';
import { RECORDING_CONFIG } from '../constants/config';

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
  setRobotConfig,
  stopPlayback
}: UsePlaybackProps) {
  const playbackFrameIndexRef = useRef<number>(0);
  const playbackIntervalRef = useRef<number | undefined>(undefined);
  const currentTrajectoryRef = useRef(currentTrajectory);
  const setRobotConfigRef = useRef(setRobotConfig);
  const stopPlaybackRef = useRef(stopPlayback);

  // Keep refs in sync
  useEffect(() => {
    currentTrajectoryRef.current = currentTrajectory;
    setRobotConfigRef.current = setRobotConfig;
    stopPlaybackRef.current = stopPlayback;
  }, [currentTrajectory, setRobotConfig, stopPlayback]);

  useEffect(() => {
    if (recordingState === 'playing' && currentTrajectory && currentTrajectory.frames.length > 0) {
      playbackFrameIndexRef.current = 0; // Reset to start

      playbackIntervalRef.current = window.setInterval(() => {
        const trajectory = currentTrajectoryRef.current;
        if (!trajectory || trajectory.frames.length === 0) return;

        const nextIndex = playbackFrameIndexRef.current + 1;

        // If we've reached the end, stop playback
        if (nextIndex >= trajectory.frames.length) {
          stopPlaybackRef.current();
          return;
        }

        // Update robot config to match this frame
        const frame = trajectory.frames[nextIndex];
        setRobotConfigRef.current((prevConfig) => ({
          ...prevConfig,
          shoulderAngle: frame.shoulderAngle,
          elbowAngle: frame.elbowAngle
        }));

        playbackFrameIndexRef.current = nextIndex;
      }, RECORDING_CONFIG.frameInterval);
    } else if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [recordingState, currentTrajectory]);
}
