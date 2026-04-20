/**
 * useMouseTracking hook
 * Manages pointer position, following state, and pointer event handlers.
 * Uses the Pointer Events API to handle mouse, touch, and stylus uniformly.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2D, RobotArmConfig, RecordingState } from '../types';
import { forwardKinematics, distance } from '../utils/kinematics';
import { CANVAS_CONFIG } from '../constants/config';

interface UseMouseTrackingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  robotConfig: RobotArmConfig;
  recordingState: RecordingState;
}

interface UseMouseTrackingReturn {
  mousePosition: Vector2D | null;
  isFollowing: boolean;
  setIsFollowing: (following: boolean) => void;
  handlePointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handlePointerLeave: () => void;
}

export function useMouseTracking({
  canvasRef,
  robotConfig,
  recordingState
}: UseMouseTrackingProps): UseMouseTrackingReturn {
  const [mousePosition, setMousePosition] = useState<Vector2D | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const robotConfigRef = useRef(robotConfig);
  const recordingStateRef = useRef(recordingState);

  useEffect(() => { robotConfigRef.current = robotConfig; }, [robotConfig]);
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);

  const getCanvasPos = useCallback((clientX: number, clientY: number): Vector2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CANVAS_CONFIG.width / rect.width),
      y: (clientY - rect.top) * (CANVAS_CONFIG.height / rect.height)
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Block interaction during playback or paused state
    if (recordingStateRef.current === 'playing' || recordingStateRef.current === 'paused') return;

    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos) return;

    const { endEffectorPosition } = forwardKinematics(robotConfigRef.current);
    if (distance(pos, endEffectorPosition) <= 20) {
      setMousePosition(pos);
      setIsFollowing(true);
      // Capture pointer so move events keep coming even outside the canvas
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  }, [getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (pos) setMousePosition(pos);
  }, [getCanvasPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsFollowing(false);
    try {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      // pointerId may already be gone on some browsers
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    // Clear the cursor crosshair indicator when pointer leaves the canvas
    setMousePosition(null);
  }, []);

  return {
    mousePosition,
    isFollowing,
    setIsFollowing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave
  };
}
