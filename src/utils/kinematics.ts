/**
 * Kinematics utilities for 2D two-link robot arm
 * Handles forward and inverse kinematics calculations
 */

import type { Vector2D, RobotArmConfig } from '../types';

/**
 * Calculate the position of a point given angle and length from origin
 */
export function polarToCartesian(origin: Vector2D, angle: number, length: number): Vector2D {
  return {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y + Math.sin(angle) * length
  };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle from point p1 to point p2
 */
export function angleTo(p1: Vector2D, p2: Vector2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Forward kinematics: calculate end effector position from joint angles
 *
 * @param config - Robot arm configuration
 * @returns Object containing elbow and end effector positions
 */
export function forwardKinematics(config: RobotArmConfig): {
  elbowPosition: Vector2D;
  endEffectorPosition: Vector2D;
} {
  // Calculate elbow position
  const elbowPosition = polarToCartesian(
    config.shoulderPosition,
    config.shoulderAngle,
    config.upperArmLength
  );

  // Calculate end effector position
  // The elbow angle is relative to the upper arm
  const absoluteElbowAngle = config.shoulderAngle + config.elbowAngle;
  const endEffectorPosition = polarToCartesian(
    elbowPosition,
    absoluteElbowAngle,
    config.lowerArmLength
  );

  return { elbowPosition, endEffectorPosition };
}

/**
 * Inverse kinematics: calculate joint angles to reach target position
 * Uses analytical solution for 2-link planar arm
 *
 * IMPORTANT: This function ALWAYS returns a solution by clamping unreachable targets
 * to the workspace boundary. The end effector will reach the clamped position.
 *
 * @param shoulderPosition - Fixed shoulder position
 * @param targetPosition - Desired end effector position (will be clamped if unreachable)
 * @param upperArmLength - Length of upper arm segment
 * @param lowerArmLength - Length of lower arm segment
 * @param elbowUp - Whether to prefer elbow-up configuration (true) or elbow-down (false)
 * @returns Joint angles and actual achieved position (clamped if necessary)
 */
export function inverseKinematics(
  shoulderPosition: Vector2D,
  targetPosition: Vector2D,
  upperArmLength: number,
  lowerArmLength: number,
  elbowUp: boolean = true
): { shoulderAngle: number; elbowAngle: number; clampedTarget: Vector2D } {
  // Calculate distance from shoulder to target
  let dist = distance(shoulderPosition, targetPosition);

  // Define reachability constraints
  const maxReach = upperArmLength + lowerArmLength;
  const minReach = Math.abs(upperArmLength - lowerArmLength);

  // Clamp target to reachable workspace
  let clampedTarget = targetPosition;

  if (dist > maxReach) {
    // Target too far: clamp to maximum reach boundary
    const angleToTarget = angleTo(shoulderPosition, targetPosition);
    clampedTarget = {
      x: shoulderPosition.x + Math.cos(angleToTarget) * maxReach,
      y: shoulderPosition.y + Math.sin(angleToTarget) * maxReach
    };
    dist = maxReach;
  } else if (dist < minReach) {
    // Target too close: clamp to minimum reach boundary
    const angleToTarget = angleTo(shoulderPosition, targetPosition);
    clampedTarget = {
      x: shoulderPosition.x + Math.cos(angleToTarget) * minReach,
      y: shoulderPosition.y + Math.sin(angleToTarget) * minReach
    };
    dist = minReach;
  }

  // Calculate angle from shoulder to clamped target
  const angleToTarget = angleTo(shoulderPosition, clampedTarget);

  // Use law of cosines to find elbow angle
  // c² = a² + b² - 2ab*cos(C)
  const cosElbowAngle = (upperArmLength * upperArmLength + lowerArmLength * lowerArmLength - dist * dist) /
    (2 * upperArmLength * lowerArmLength);

  // Clamp to valid range to handle floating point errors
  const clampedCos = Math.max(-1, Math.min(1, cosElbowAngle));
  const interiorAngle = Math.acos(clampedCos);

  // Convert interior angle to relative angle for forward kinematics compatibility
  // FK expects the rotation of lower arm relative to upper arm
  // Interior angle is the angle between the two segments
  // Relative angle = π - interior angle (elbow up) or -(π - interior angle) (elbow down)
  let elbowAngle = elbowUp ? (Math.PI - interiorAngle) : -(Math.PI - interiorAngle);

  // Calculate shoulder angle using law of cosines
  const cosShoulderOffset = (upperArmLength * upperArmLength + dist * dist - lowerArmLength * lowerArmLength) /
    (2 * upperArmLength * dist);

  const clampedCosOffset = Math.max(-1, Math.min(1, cosShoulderOffset));
  const shoulderOffset = Math.acos(clampedCosOffset);

  // Shoulder angle depends on elbow configuration
  // Note: The formula is swapped from typical convention to match FK expectations
  const shoulderAngle = elbowUp
    ? angleToTarget - shoulderOffset
    : angleToTarget + shoulderOffset;

  return { shoulderAngle, elbowAngle, clampedTarget };
}

/**
 * Check if end effector is within target zone
 */
export function isInTargetZone(endEffectorPos: Vector2D, targetPos: Vector2D, targetRadius: number): boolean {
  return distance(endEffectorPos, targetPos) <= targetRadius;
}

/**
 * Normalize angle to range [-π, π]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Linear interpolation between two angles (handles wraparound)
 */
export function lerpAngle(a: number, b: number, t: number): number {
  // Normalize angles
  a = normalizeAngle(a);
  b = normalizeAngle(b);

  // Find shortest path
  let diff = b - a;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;

  return a + diff * t;
}

/**
 * Linear interpolation between two vectors
 */
export function lerpVector(v1: Vector2D, v2: Vector2D, t: number): Vector2D {
  return {
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t
  };
}
