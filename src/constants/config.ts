/**
 * application configuration constants
 */

import type { Vector2D, PosePreset } from '../types';

/**
 * colors just to have
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
 * robot arm physical configuration
 */
export const ROBOT_CONFIG = {
  upperArmLength: 150,            // pixels (increased from 150)
  lowerArmLength: 130,            // pixels (increased from 120)
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
  width: 900,   // Increased to show full robot arm range (280px reach * 2 + margins)
  height: 600,  // Increased to show full vertical range
  backgroundColor: COLORS.background
} as const;

/**
 * Shoulder position
 */
export const SHOULDER_POSITION: Vector2D = {
  x: 450,  // Centered in 900px canvas
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
 * Mouse sensitivity configuration
 * Controls how responsive the robot arm is to mouse movements
 */
export const MOUSE_SENSITIVITY_CONFIG = {
  default: 1.0,             // Default sensitivity (1.0 = normal)
  min: 0.3,                 // Minimum sensitivity (less responsive)
  max: 2.0                  // Maximum sensitivity (more responsive)
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
  x: SHOULDER_POSITION.x + 270,  // 270 pixels to the right (within max reach of 310)
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

/**
 * Pose Presets
 * Configure different starting and target positions for the robot arm
 * Each preset can have a different shoulder/base position
 * Switch between presets by changing ACTIVE_POSE_PRESET below
 */
export const POSE_PRESETS: Record<string, PosePreset> = {
  'default': {
    name: 'default',
    shoulderPosition: { x: 450, y: 300 },  // Center of canvas
    initialShoulderAngle: -(80 * Math.PI / 180),  // -80 degrees (upward)
    initialElbowAngle: (160 * Math.PI / 180),     // 160 degrees
    targetPosition: { x: 720, y: 300 }  // To the right
  },
  'low-start': {
    name: 'low-start',
    shoulderPosition: { x: 450, y: 450 },  // Low
    initialShoulderAngle: -(80 * Math.PI / 180),  // -80 degrees (upward)
    initialElbowAngle: (160 * Math.PI / 180),      // 120 degrees
    targetPosition: { x: 700, y: 300 }  // Upper right from base
  },
  'vertical-reach': {
    name: 'vertical-reach',
    shoulderPosition: { x: 600, y: 400 },  // Right side, mid-low
    initialShoulderAngle: (0 * Math.PI / 180),    // 0 degrees (horizontal right)
    initialElbowAngle: (90 * Math.PI / 180),      // 90 degrees
    targetPosition: { x: 600, y: 150 }  // Directly above
  }
} as const;

/**
 * Active pose preset
 * Change this value to switch between different pose configurations:
 * - 'default': Horizontal reach from upper position
 * - 'low-start': Upward reach from lower position
 * - 'vertical-reach': Vertical reach from horizontal position
 */
export const ACTIVE_POSE_PRESET: keyof typeof POSE_PRESETS = 'default';

/**
 * Get the active pose preset configuration
 */
export function getActivePosePreset(): PosePreset {
  return POSE_PRESETS[ACTIVE_POSE_PRESET];
}
