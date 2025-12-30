/**
 * Core type definitions for the Robot Arm Simulator
 */

/**
 * 2D Vector for positions and velocities
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Robot arm configuration
 * A two-limbed robot arm with shoulder and elbow joints
 */
export interface RobotArmConfig {
  shoulderPosition: Vector2D;  // Fixed base position
  upperArmLength: number;       // Length of first segment
  lowerArmLength: number;       // Length of second segment
  shoulderAngle: number;        // Angle of upper arm (radians)
  elbowAngle: number;           // Angle of elbow joint (radians)
}

/**
 * Single frame of motion data
 */
export interface MotionFrame {
  timestamp: number;            // Time in milliseconds
  shoulderAngle: number;        // Shoulder joint angle (radians)
  elbowAngle: number;           // Elbow joint angle (radians)
  endEffectorPosition: Vector2D; // Position of end of arm
  elbowPosition: Vector2D;      // Position of elbow joint
}

/**
 * Complete motion trajectory
 */
export interface MotionTrajectory {
  frames: MotionFrame[];
  startPosition: Vector2D;
  targetPosition: Vector2D;
  promptType: PromptType;
  promptText: string;
  completed: boolean;
  attemptCount: number;
  totalTimeMs: number;
}

/**
 * Motion prompt types
 */
export type PromptType =
  | 'Bound'
  | 'Free'
  | 'Sudden'
  | 'Sustained'
  | 'Strong'
  | 'Light'
  | 'Direct'
  | 'Indirect';

/**
 * Prompt set configuration
 */
export interface PromptSet {
  type: 'laban' | 'metaphor';
  prompts: PromptConfig[];
}

/**
 * Individual prompt configuration
 */
export interface PromptConfig {
  type: PromptType;
  labanText: string;
  metaphorText: string;
}

/**
 * Pose preset configuration
 * Defines robot starting position and target position
 */
export interface PosePreset {
  name: string;
  shoulderPosition: Vector2D;
  initialShoulderAngle: number;  // radians
  initialElbowAngle: number;     // radians
  targetPosition: Vector2D;
}

/**
 * User session data
 */
export interface UserSession {
  userId: string;               // Prolific ID or auto-generated user ID
  sessionId: string;            // Unique session identifier
  promptSet: 'laban' | 'metaphor';
  promptOrder: PromptType[];    // Randomized order
  completedMotions: MotionTrajectory[];
  currentPromptIndex: number;
  startTime: number;            // Session start timestamp
  activePosePreset: string;     // Name of the active pose preset
}

/**
 * Application state
 */
export type AppState =
  | 'splash'
  | 'tutorial'
  | 'recording'
  | 'completed';

/**
 * Recording state
 */
export type RecordingState =
  | 'idle'
  | 'recording'
  | 'playing'
  | 'paused';

/**
 * Target zone configuration
 */
export interface TargetZone {
  position: Vector2D;
  radius: number;
  color: string;
}

/**
 * CSV export data structure
 */
export interface TrajectoryCSVData {
  participantId: string;
  sessionId: string;
  promptType: PromptType;
  promptText: string;
  frameIndex: number;
  timestamp: number;
  shoulderAngle: number;
  elbowAngle: number;
  endEffectorX: number;
  endEffectorY: number;
  elbowX: number;
  elbowY: number;
}

export interface SessionCSVData {
  participantId: string;
  sessionId: string;
  promptSet: 'laban' | 'metaphor';
  promptType: PromptType;
  promptText: string;
  attemptCount: number;
  totalTimeMs: number;
  frameCount: number;
  completed: boolean;
}
