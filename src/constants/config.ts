/**
 * Application configuration constants
 */

import type { Vector2D } from '../types';

/**
 * Color scheme for the application
 */
export const COLORS = {
  primary: '#2563eb',      // Blue
  secondary: '#7c3aed',    // Purple
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  background: '#f8fafc',   // Light gray
  surface: '#ffffff',      // White
  text: '#1e293b',         // Dark gray
  textLight: '#64748b',    // Medium gray
  border: '#e2e8f0',       // Light border
  robotArm: '#4f46e5',     // Indigo
  target: '#10b981',       // Green
  grid: '#e5e7eb'          // Very light gray
} as const;

/**
 * Robot arm physical configuration
 */
export const ROBOT_CONFIG = {
  upperArmLength: 150,            // pixels
  lowerArmLength: 120,            // pixels
  jointRadius: 8,                 // pixels
  armThickness: 6,                // pixels
  endEffectorRadius: 10,          // pixels
  initialShoulderAngle: -(80 * Math.PI / 180),  // -80 degrees (upward) THIS IS BASE
  initialElbowAngle: (160 * Math.PI / 180)      // 25 degrees THIS IS ELBOW! between joints
} as const;

/**
 * Canvas configuration
 */
export const CANVAS_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: COLORS.background
} as const;

/**
 * Shoulder position (fixed point at center-left of canvas)
 */
export const SHOULDER_POSITION: Vector2D = {
  x: 200,
  y: CANVAS_CONFIG.height / 2
};

/**
 * Target zone configuration
 */
export const TARGET_CONFIG = {
  radius: 20,               // pixels
  color: COLORS.target,
  strokeWidth: 3
} as const;

/**
 * Recording configuration
 */
export const RECORDING_CONFIG = {
  frameRate: 60,            // frames per second
  frameInterval: 1000 / 60  // milliseconds per frame
} as const;

/**
 * Timeline configuration
 */
export const TIMELINE_CONFIG = {
  height: 80,               // pixels
  scrubberWidth: 3,         // pixels
  tickInterval: 10          // frames between ticks
} as const;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  playbackSpeed: 1.0,       // 1.0 = real-time
  interpolationSteps: 5     // frames to interpolate between keyframes
} as const;

/**
 * Total number of motions to complete
 */
export const TOTAL_MOTIONS = 8;

/**
 * Fixed target position for consistent positioning across all prompts
 * Target is positioned horizontally in line with the robot base
 */
export const FIXED_TARGET_POSITION: Vector2D = {
  x: SHOULDER_POSITION.x + 240,  // 240 pixels to the right (within max reach of 270)
  y: SHOULDER_POSITION.y         // Same height as shoulder, horizontally aligned
};

/**
 * Generate a random target position (legacy / kept for compatibility)
 * Target should be reachable by the robot arm
 */
export function generateRandomTarget(): Vector2D {
  // Return fixed position for consistent experience
  return FIXED_TARGET_POSITION;
}
