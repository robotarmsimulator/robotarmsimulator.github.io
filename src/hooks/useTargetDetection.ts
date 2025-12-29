/**
 * useTargetDetection hook
 * Monitors when the robot reaches the target position
 */

import { useEffect } from 'react';
import type { RobotArmConfig, Vector2D, MotionTrajectory } from '../types';
import { forwardKinematics, isInTargetZone } from '../utils/kinematics';
import { TARGET_CONFIG } from '../constants/config';

interface UseTargetDetectionProps {
  robotConfig: RobotArmConfig;
  targetPosition: Vector2D | null;
  currentTrajectory: MotionTrajectory | null;
  setCurrentTrajectory: (trajectory: MotionTrajectory) => void;
}

export function useTargetDetection({
  robotConfig,
  targetPosition,
  currentTrajectory,
  setCurrentTrajectory
}: UseTargetDetectionProps) {
  useEffect(() => {
    if (!targetPosition || !currentTrajectory) return;

    const { endEffectorPosition } = forwardKinematics(robotConfig);

    if (isInTargetZone(endEffectorPosition, targetPosition, TARGET_CONFIG.radius)) {
      if (!currentTrajectory.completed) {
        setCurrentTrajectory({
          ...currentTrajectory,
          completed: true
        });
      }
    }
  }, [robotConfig, targetPosition, currentTrajectory, setCurrentTrajectory]);
}
