/**
 * useRobotControl hook
 * Manages robot movement using inverse kinematics and mouse following
 */

import { useEffect, useState, useRef } from 'react';
import type { Vector2D, RobotArmConfig, RecordingState, MotionTrajectory } from '../types';
import {
  forwardKinematics,
  inverseKinematics,
  isInTargetZone
} from '../utils/kinematics';
import {
  ROBOT_CONFIG,
  SHOULDER_POSITION,
  TARGET_CONFIG
} from '../constants/config';

interface UseRobotControlProps {
  mousePosition: Vector2D | null;
  isFollowing: boolean;
  setIsFollowing: (following: boolean) => void;
  robotConfig: RobotArmConfig;
  setRobotConfig: (config: RobotArmConfig | ((prev: RobotArmConfig) => RobotArmConfig)) => void;
  targetPosition: Vector2D | null;
  recordingState: RecordingState;
  currentTrajectory: MotionTrajectory | null;
  startRecording: () => void;
  stopRecording: () => void;
}

interface UseRobotControlReturn {
  actualTargetPosition: Vector2D | null;
  hasStartedMoving: boolean;
}

export function useRobotControl({
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
}: UseRobotControlProps): UseRobotControlReturn {
  const [actualTargetPosition, setActualTargetPosition] = useState<Vector2D | null>(null);
  const [hasStartedMoving, setHasStartedMoving] = useState(false);
  const robotConfigRef = useRef(robotConfig);
  const setIsFollowingRef = useRef(setIsFollowing);
  const setRobotConfigRef = useRef(setRobotConfig);
  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecording);
  const lastMousePositionRef = useRef<Vector2D | null>(null);
  const cachedIKRef = useRef<{ shoulderAngle: number; elbowAngle: number; clampedTarget: Vector2D } | null>(null);

  // Keep refs in sync
  useEffect(() => {
    robotConfigRef.current = robotConfig;
    setIsFollowingRef.current = setIsFollowing;
    setRobotConfigRef.current = setRobotConfig;
    startRecordingRef.current = startRecording;
    stopRecordingRef.current = stopRecording;
  }, [robotConfig, setIsFollowing, setRobotConfig, startRecording, stopRecording]);

  // Reset states when trajectory changes (new prompt or after redraw)
  useEffect(() => {
    if (currentTrajectory && currentTrajectory.frames.length === 0) {
      setHasStartedMoving(false);
      setActualTargetPosition(null);
    }
  }, [currentTrajectory]);

  // Reset hasStartedMoving when recording stops (for redraw feature)
  useEffect(() => {
    if (recordingState === 'idle') {
      setHasStartedMoving(false);
    }
  }, [recordingState]);

  // Direct manipulation: Update robot position instantly via IK every frame while dragging
  useEffect(() => {
    if (!mousePosition || !isFollowing) {
      // Clear actual target when not following
      setActualTargetPosition(null);
      lastMousePositionRef.current = null;
      cachedIKRef.current = null;
      return;
    }

    // Check if we've reached the target - stop following and recording if so
    const { endEffectorPosition } = forwardKinematics(robotConfigRef.current);
    if (targetPosition && isInTargetZone(endEffectorPosition, targetPosition, TARGET_CONFIG.radius)) {
      setIsFollowingRef.current(false);
      if (recordingState === 'recording') {
        stopRecordingRef.current();
      }
      return;
    }

    // Throttle IK calculations - only recalculate if mouse moved significantly (> 2 pixels)
    const lastMouse = lastMousePositionRef.current;
    const mouseMovedSignificantly = !lastMouse ||
      Math.abs(mousePosition.x - lastMouse.x) > 2 ||
      Math.abs(mousePosition.y - lastMouse.y) > 2;

    let ik: { shoulderAngle: number; elbowAngle: number; clampedTarget: Vector2D };

    if (mouseMovedSignificantly) {
      // Try both elbow configurations and choose the one closest to current
      // This prevents unwanted flipping when grabbing the end effector
      const ikElbowUp = inverseKinematics(
        SHOULDER_POSITION,
        mousePosition,
        ROBOT_CONFIG.upperArmLength,
        ROBOT_CONFIG.lowerArmLength,
        true
      );

      const ikElbowDown = inverseKinematics(
        SHOULDER_POSITION,
        mousePosition,
        ROBOT_CONFIG.upperArmLength,
        ROBOT_CONFIG.lowerArmLength,
        false
      );

      // Calculate angular distance for both solutions
      const currentShoulder = robotConfigRef.current.shoulderAngle;
      const currentElbow = robotConfigRef.current.elbowAngle;

      const distUp = Math.abs(ikElbowUp.shoulderAngle - currentShoulder) +
                     Math.abs(ikElbowUp.elbowAngle - currentElbow);
      const distDown = Math.abs(ikElbowDown.shoulderAngle - currentShoulder) +
                       Math.abs(ikElbowDown.elbowAngle - currentElbow);

      // Choose the solution with minimal joint angle change
      ik = distUp < distDown ? ikElbowUp : ikElbowDown;

      // Cache the result
      cachedIKRef.current = ik;
      lastMousePositionRef.current = mousePosition;
    } else if (cachedIKRef.current) {
      // Use cached IK result if mouse hasn't moved significantly
      ik = cachedIKRef.current;
    } else {
      // Fallback - shouldn't normally reach here
      return;
    }

    // Store the clamped target position for visualization
    // This represents where the end effector will actually be
    setActualTargetPosition(ik.clampedTarget);

    // Only update robot config if angles changed significantly (> 0.001 radians)
    const currentShoulder = robotConfigRef.current.shoulderAngle;
    const currentElbow = robotConfigRef.current.elbowAngle;
    const anglesChangedSignificantly =
      Math.abs(ik.shoulderAngle - currentShoulder) > 0.001 ||
      Math.abs(ik.elbowAngle - currentElbow) > 0.001;

    if (anglesChangedSignificantly) {
      // Update joint angles immediately (direct manipulation - no interpolation)
      setRobotConfigRef.current((prevConfig: RobotArmConfig) => ({
        ...prevConfig,
        shoulderAngle: ik.shoulderAngle,
        elbowAngle: ik.elbowAngle
      }));
    }

    // Auto-start recording on first movement
    if (!hasStartedMoving && recordingState === 'idle') {
      setHasStartedMoving(true);
      startRecordingRef.current();
    }
  }, [
    mousePosition,
    isFollowing,
    targetPosition,
    recordingState,
    hasStartedMoving
  ]);

  return {
    actualTargetPosition,
    hasStartedMoving
  };
}
