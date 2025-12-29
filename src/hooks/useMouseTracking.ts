/**
 * useMouseTracking hook
 * Manages mouse position, following state, and mouse event handlers
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Vector2D, RobotArmConfig } from '../types';
import { forwardKinematics, distance } from '../utils/kinematics';

interface UseMouseTrackingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  robotConfig: RobotArmConfig;
}

interface UseMouseTrackingReturn {
  mousePosition: Vector2D | null;
  isFollowing: boolean;
  setIsFollowing: (following: boolean) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseLeave: () => void;
}

export function useMouseTracking({
  canvasRef,
  robotConfig
}: UseMouseTrackingProps): UseMouseTrackingReturn {
  const [mousePosition, setMousePosition] = useState<Vector2D | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const robotConfigRef = useRef(robotConfig);

  // Keep ref in sync
  useEffect(() => {
    robotConfigRef.current = robotConfig;
  }, [robotConfig]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickPos: Vector2D = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const { endEffectorPosition } = forwardKinematics(robotConfigRef.current);

    // Check if click is within the end effector (radius 14px from drawGripper)
    const clickDistance = distance(clickPos, endEffectorPosition);
    if (clickDistance <= 20) { // Slightly larger hitbox for easier clicking
      // CRITICAL: Use actual click position, not end effector position
      // This ensures immediate response to where the user actually clicked
      // The IK solver will choose the configuration that minimizes joint movement
      setMousePosition(clickPos);
      setIsFollowing(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  return {
    mousePosition,
    isFollowing,
    setIsFollowing,
    handleMouseMove,
    handleMouseDown,
    handleMouseLeave
  };
}
