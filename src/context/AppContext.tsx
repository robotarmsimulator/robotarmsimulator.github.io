/**
 * Global application context for state management
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState,
  RecordingState,
  UserSession,
  MotionTrajectory,
  Vector2D,
  RobotArmConfig
} from '../types';
import { getRandomizedPromptOrder } from '../constants/prompts';
import { generateSessionId } from '../utils/dataExport';
import { ROBOT_CONFIG, getActivePosePreset } from '../constants/config';

interface AppContextType {
  // Application state
  appState: AppState;
  setAppState: (state: AppState) => void;

  // User session
  userSession: UserSession | null;
  initializeSession: (userId: string, promptSet: 'laban' | 'metaphor') => void;

  // Recording state
  recordingState: RecordingState;
  setRecordingState: (state: RecordingState) => void;

  // Current motion
  currentTrajectory: MotionTrajectory | null;
  setCurrentTrajectory: (trajectory: MotionTrajectory | null) => void;

  // Robot configuration
  robotConfig: RobotArmConfig;
  setRobotConfig: (config: RobotArmConfig | ((prev: RobotArmConfig) => RobotArmConfig)) => void;

  // Target position
  targetPosition: Vector2D | null;
  setTargetPosition: (position: Vector2D) => void;

  // Playback position (frame index to start from, or current frame during playback)
  playbackFrame: number;
  setPlaybackFrame: (frame: number) => void;

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  startPlayback: (fromFrame?: number) => void;
  stopPlayback: () => void;
  resetCurrentMotion: () => void;
  completeCurrentMotion: () => void;
  nextPrompt: () => void;

  // Undo/Redo
  undoHistory: MotionTrajectory[];
  redoHistory: MotionTrajectory[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Redraw from point
  redrawFromFrame: (frameIndex: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>('splash');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [currentTrajectory, setCurrentTrajectory] = useState<MotionTrajectory | null>(null);
  const [targetPosition, setTargetPosition] = useState<Vector2D | null>(null);
  const [undoHistory, setUndoHistory] = useState<MotionTrajectory[]>([]);
  const [redoHistory, setRedoHistory] = useState<MotionTrajectory[]>([]);
  const [playbackFrame, setPlaybackFrame] = useState(0);

  const [robotConfig, setRobotConfig] = useState<RobotArmConfig>(() => {
    const activePose = getActivePosePreset();
    return {
      shoulderPosition: activePose.shoulderPosition,
      upperArmLength: ROBOT_CONFIG.upperArmLength,
      lowerArmLength: ROBOT_CONFIG.lowerArmLength,
      shoulderAngle: activePose.initialShoulderAngle,
      elbowAngle: activePose.initialElbowAngle
    };
  });

  const initializeSession = (userId: string, promptSet: 'laban' | 'metaphor') => {
    const sessionId = generateSessionId();
    const promptOrder = getRandomizedPromptOrder();
    const activePose = getActivePosePreset();

    setUserSession({
      userId,
      sessionId,
      promptSet,
      promptOrder,
      completedMotions: [],
      currentPromptIndex: 0,
      startTime: Date.now(),
      activePosePreset: activePose.name
    });

    // Set initial target position from preset
    setTargetPosition(activePose.targetPosition);
  };

  const startRecording = () => {
    setRecordingState('recording');
    setRedoHistory([]); // Clear redo history when starting new recording
  };

  const stopRecording = () => {
    setRecordingState('idle');
  };

  const startPlayback = (fromFrame?: number) => {
    if (fromFrame !== undefined) {
      setPlaybackFrame(fromFrame);
    }
    setRecordingState('playing');
  };

  const stopPlayback = () => {
    // Set to 'paused' instead of 'idle' to prevent dragging during paused playback
    setRecordingState('paused');
  };

  const resetRobotPosition = () => {
    const activePose = getActivePosePreset();
    setRobotConfig({
      shoulderPosition: activePose.shoulderPosition,
      upperArmLength: ROBOT_CONFIG.upperArmLength,
      lowerArmLength: ROBOT_CONFIG.lowerArmLength,
      shoulderAngle: activePose.initialShoulderAngle,
      elbowAngle: activePose.initialElbowAngle
    });
  };

  const resetCurrentMotion = () => {
    if (currentTrajectory) {
      // Save to undo history before resetting
      setUndoHistory(prev => [...prev, currentTrajectory]);
      setCurrentTrajectory(null);
      setRecordingState('idle');
      resetRobotPosition();
    }
  };

  const completeCurrentMotion = () => {
    if (!userSession || !currentTrajectory || !currentTrajectory.completed) {
      return;
    }

    // Add to completed motions
    setUserSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        completedMotions: [...prev.completedMotions, currentTrajectory]
      };
    });

    // Clear current trajectory and reset robot to initial position
    setCurrentTrajectory(null);
    setUndoHistory([]);
    setRedoHistory([]);
    setRecordingState('idle');
    resetRobotPosition();

    // Move to next prompt or completion
    nextPrompt();
  };

  const nextPrompt = () => {
    if (!userSession) return;

    const nextIndex = userSession.currentPromptIndex + 1;

    if (nextIndex >= userSession.promptOrder.length) {
      // All prompts completed
      setAppState('completed');
    } else {
      // Move to next prompt
      setUserSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPromptIndex: nextIndex
        };
      });
    }
  };

  const undo = () => {
    if (undoHistory.length === 0) return;

    const previous = undoHistory[undoHistory.length - 1];
    const newHistory = undoHistory.slice(0, -1);

    if (currentTrajectory) {
      setRedoHistory(prev => [...prev, currentTrajectory]);
    }

    setCurrentTrajectory(previous);
    setUndoHistory(newHistory);
  };

  const redo = () => {
    if (redoHistory.length === 0) return;

    const next = redoHistory[redoHistory.length - 1];
    const newHistory = redoHistory.slice(0, -1);

    if (currentTrajectory) {
      setUndoHistory(prev => [...prev, currentTrajectory]);
    }

    setCurrentTrajectory(next);
    setRedoHistory(newHistory);
  };

  const redrawFromFrame = (frameIndex: number) => {
    if (!currentTrajectory || frameIndex < 0 || frameIndex >= currentTrajectory.frames.length) return;

    // Save current trajectory to undo history
    setUndoHistory(prev => [...prev, currentTrajectory]);

    // Truncate trajectory to the selected frame
    const truncatedTrajectory: MotionTrajectory = {
      ...currentTrajectory,
      frames: currentTrajectory.frames.slice(0, frameIndex + 1),
      completed: false, // No longer completed since we're redrawing
      totalTimeMs: currentTrajectory.frames[frameIndex].timestamp
    };

    setCurrentTrajectory(truncatedTrajectory);
    setRecordingState('idle'); // Allow user to start recording from this point
    setRedoHistory([]); // Clear redo history when making a new change
  };

  const value: AppContextType = {
    appState,
    setAppState,
    userSession,
    initializeSession,
    recordingState,
    setRecordingState,
    currentTrajectory,
    setCurrentTrajectory,
    robotConfig,
    setRobotConfig,
    targetPosition,
    setTargetPosition,
    startRecording,
    stopRecording,
    startPlayback,
    stopPlayback,
    playbackFrame,
    setPlaybackFrame,
    resetCurrentMotion,
    completeCurrentMotion,
    nextPrompt,
    undoHistory,
    redoHistory,
    undo,
    redo,
    canUndo: undoHistory.length > 0,
    canRedo: redoHistory.length > 0,
    redrawFromFrame
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
