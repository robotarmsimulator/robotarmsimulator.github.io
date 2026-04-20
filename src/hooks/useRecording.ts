import { useEffect, useRef } from 'react';
import type { RobotArmConfig, MotionFrame, MotionTrajectory, RecordingState } from '../types';
import { forwardKinematics } from '../utils/kinematics';

interface UseRecordingProps {
  recordingState: RecordingState;
  robotConfig: RobotArmConfig;
  currentTrajectory: MotionTrajectory | null;
  setCurrentTrajectory: (trajectory: MotionTrajectory) => void;
}

const RECORDING_FPS = 60; // attempted changing to 60 from 30
const FRAME_INTERVAL = 1000 / RECORDING_FPS;

export function useRecording({
  recordingState,
  robotConfig,
  currentTrajectory,
  setCurrentTrajectory
}: UseRecordingProps) {
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Exposed so callers can read live frames during recording without triggering re-renders.
  // Off-React frame buffer. Mutations here never trigger re-renders.
  // The rAF loop reads and writes only refs, so there are no stale closures
  // and no O(n) array copies per frame. React state is updated once on stop.
  const frameBufferRef = useRef<MotionFrame[]>([]);
  const baseTrajectoryRef = useRef<MotionTrajectory | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastAngleRef = useRef<{ shoulderAngle: number; elbowAngle: number } | null>(null);

  // Stable refs for props consumed inside rAF — avoids stale closures
  const robotConfigRef = useRef(robotConfig);
  const currentTrajectoryRef = useRef(currentTrajectory);
  const setCurrentTrajectoryRef = useRef(setCurrentTrajectory);

  // These must be defined before the recording effect so they run first,
  // ensuring currentTrajectoryRef is up-to-date when the flush check runs.
  useEffect(() => { robotConfigRef.current = robotConfig; }, [robotConfig]);
  useEffect(() => { currentTrajectoryRef.current = currentTrajectory; }, [currentTrajectory]);
  useEffect(() => { setCurrentTrajectoryRef.current = setCurrentTrajectory; }, [setCurrentTrajectory]);

  useEffect(() => {
    if (recordingState !== 'recording') {
      // Flush buffered frames to React state.
      // Skip if currentTrajectory is null — that means resetCurrentMotion was called
      // and we should discard the buffer, not overwrite the cleared state.
      if (
        frameBufferRef.current.length > 0 &&
        baseTrajectoryRef.current !== null &&
        currentTrajectoryRef.current !== null
      ) {
        const lastFrame = frameBufferRef.current[frameBufferRef.current.length - 1];
        setCurrentTrajectoryRef.current({
          ...baseTrajectoryRef.current,
          frames: frameBufferRef.current,
          // Preserve completed flag — useTargetDetection may have set it to true
          // while recording was still active (e.g. after "redraw from here").
          // Without this, the flush would overwrite completed:true back to false.
          completed: currentTrajectoryRef.current.completed,
          totalTimeMs: lastFrame?.timestamp ?? baseTrajectoryRef.current.totalTimeMs
        });
      }
      frameBufferRef.current = [];
      baseTrajectoryRef.current = null;
      startTimeRef.current = 0;
      lastFrameTimeRef.current = 0;
      lastAngleRef.current = null;
      return;
    }

    // Snapshot the trajectory at the moment recording starts.
    // We never read currentTrajectoryRef inside the rAF loop — the buffer
    // is the sole source of truth while recording is active.
    const snapshot = currentTrajectoryRef.current;
    baseTrajectoryRef.current = snapshot;
    frameBufferRef.current = snapshot ? [...snapshot.frames] : [];

    const existingFrames = frameBufferRef.current;
    const baseTimestamp = existingFrames.length > 0
      ? existingFrames[existingFrames.length - 1].timestamp
      : 0;
    startTimeRef.current = performance.now() - baseTimestamp;

    // Initialize lastFrameTime one interval in the past so the first rAF
    // fires exactly one full FRAME_INTERVAL after recording starts (no burst).
    lastFrameTimeRef.current = performance.now() - FRAME_INTERVAL;

    lastAngleRef.current = existingFrames.length > 0
      ? {
          shoulderAngle: existingFrames[existingFrames.length - 1].shoulderAngle,
          elbowAngle: existingFrames[existingFrames.length - 1].elbowAngle
        }
      : null;

    const recordFrame = (now: number) => {
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed >= FRAME_INTERVAL) {
        // Snap forward by whole intervals to prevent drift accumulation
        lastFrameTimeRef.current = now - (elapsed % FRAME_INTERVAL);

        const config = robotConfigRef.current;
        const last = lastAngleRef.current;
        const hasChanged =
          !last ||
          Math.abs(last.shoulderAngle - config.shoulderAngle) > 0.0001 ||
          Math.abs(last.elbowAngle - config.elbowAngle) > 0.0001;

        if (hasChanged) {
          const { elbowPosition, endEffectorPosition } = forwardKinematics(config);
          frameBufferRef.current.push({
            timestamp: now - startTimeRef.current,
            shoulderAngle: config.shoulderAngle,
            elbowAngle: config.elbowAngle,
            endEffectorPosition,
            elbowPosition
          });
          lastAngleRef.current = {
            shoulderAngle: config.shoulderAngle,
            elbowAngle: config.elbowAngle
          };
        }
      }
      animationFrameRef.current = requestAnimationFrame(recordFrame);
    };

    animationFrameRef.current = requestAnimationFrame(recordFrame);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [recordingState]);

  return { frameBufferRef };
}
