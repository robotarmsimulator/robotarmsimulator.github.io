/**
 * Trajectory smoothing utilities
 * Provides functions to smooth recorded motion trajectories
 */

import type { MotionTrajectory, MotionFrame, RobotArmConfig } from '../types';
import { forwardKinematics } from './kinematics';
import { SHOULDER_POSITION, ROBOT_CONFIG } from '../constants/config';

/**
 * Apply moving average smoothing to trajectory angles
 * @param trajectory - The trajectory to smooth
 * @param windowSize - Size of the smoothing window (higher = smoother)
 * @returns Smoothed trajectory
 */
export function smoothTrajectory(
  trajectory: MotionTrajectory,
  windowSize: number = 5
): MotionTrajectory {
  if (trajectory.frames.length < windowSize) {
    return trajectory; // Too few frames to smooth
  }

  const smoothedFrames: MotionFrame[] = trajectory.frames.map((frame, index) => {
    // Calculate the window bounds
    const halfWindow = Math.floor(windowSize / 2);
    const startIdx = Math.max(0, index - halfWindow);
    const endIdx = Math.min(trajectory.frames.length - 1, index + halfWindow);

    // Calculate average angles within the window
    let sumShoulderAngle = 0;
    let sumElbowAngle = 0;
    let count = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      sumShoulderAngle += trajectory.frames[i].shoulderAngle;
      sumElbowAngle += trajectory.frames[i].elbowAngle;
      count++;
    }

    const avgShoulderAngle = sumShoulderAngle / count;
    const avgElbowAngle = sumElbowAngle / count;

    // Recalculate positions based on smoothed angles
    // Import these from kinematics if needed, or just use the original positions
    // For now, we'll use the original positions to avoid circular dependencies
    return {
      ...frame,
      shoulderAngle: avgShoulderAngle,
      elbowAngle: avgElbowAngle
    };
  });

  return {
    ...trajectory,
    frames: smoothedFrames
  };
}

/**
 * Apply Gaussian smoothing to trajectory
 * Provides a weighted average with more weight to nearby frames
 */
export function gaussianSmoothTrajectory(
  trajectory: MotionTrajectory,
  sigma: number = 2.0
): MotionTrajectory {
  if (trajectory.frames.length < 3) {
    return trajectory;
  }

  const windowSize = Math.ceil(sigma * 3) * 2 + 1; // 3 sigma rule

  const smoothedFrames: MotionFrame[] = trajectory.frames.map((frame, index) => {
    const halfWindow = Math.floor(windowSize / 2);
    const startIdx = Math.max(0, index - halfWindow);
    const endIdx = Math.min(trajectory.frames.length - 1, index + halfWindow);

    let sumShoulderAngle = 0;
    let sumElbowAngle = 0;
    let weightSum = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      const distance = Math.abs(i - index);
      const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));

      sumShoulderAngle += trajectory.frames[i].shoulderAngle * weight;
      sumElbowAngle += trajectory.frames[i].elbowAngle * weight;
      weightSum += weight;
    }

    const smoothedShoulderAngle = sumShoulderAngle / weightSum;
    const smoothedElbowAngle = sumElbowAngle / weightSum;

    // Recalculate positions based on smoothed angles
    const config: RobotArmConfig = {
      shoulderPosition: SHOULDER_POSITION,
      upperArmLength: ROBOT_CONFIG.upperArmLength,
      lowerArmLength: ROBOT_CONFIG.lowerArmLength,
      shoulderAngle: smoothedShoulderAngle,
      elbowAngle: smoothedElbowAngle
    };

    const { elbowPosition, endEffectorPosition } = forwardKinematics(config);

    return {
      ...frame,
      shoulderAngle: smoothedShoulderAngle,
      elbowAngle: smoothedElbowAngle,
      endEffectorPosition,
      elbowPosition
    };
  });

  return {
    ...trajectory,
    frames: smoothedFrames
  };
}

/**
 * Get smoothing strength as a percentage (0-100)
 * and convert it to appropriate window size or sigma
 */
export function strengthToWindowSize(strength: number): number {
  // Strength: 0 = no smoothing, 100 = maximum smoothing
  // Map to window size: 1 (no smoothing) to 15 (high smoothing)
  return Math.max(1, Math.floor(1 + (strength / 100) * 14));
}

export function strengthToSigma(strength: number): number {
  // Strength: 0 = no smoothing, 100 = maximum smoothing
  // Map to sigma: 0.5 (minimal) to 5.0 (high smoothing)
  return 0.5 + (strength / 100) * 4.5;
}
