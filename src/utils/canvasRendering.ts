/**
 * Canvas rendering utilities
 * All drawing functions for the robot arm visualization
 */

import type { Vector2D, MotionFrame } from '../types';
import { distance } from './kinematics';
import {
  CANVAS_CONFIG,
  ROBOT_CONFIG,
  SHOULDER_POSITION,
  COLORS,
  TARGET_CONFIG
} from '../constants/config';

export function drawWorkspace(ctx: CanvasRenderingContext2D) {
  // Draw subtle workspace boundary
  const maxReach = ROBOT_CONFIG.upperArmLength + ROBOT_CONFIG.lowerArmLength;

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(SHOULDER_POSITION.x, SHOULDER_POSITION.y, maxReach, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawRobotArmEnhanced(
  ctx: CanvasRenderingContext2D,
  shoulder: Vector2D,
  elbow: Vector2D,
  endEffector: Vector2D
) {
  // Shadow/depth effect
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Upper arm segment
  drawArmSegment(ctx, shoulder, elbow, '#5b21b6', 14);

  // Lower arm segment
  drawArmSegment(ctx, elbow, endEffector, '#7c3aed', 12);

  ctx.restore();

  // Shoulder base (fixed mount)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner detail
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Elbow joint
  ctx.fillStyle = '#6b21a8';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner detail
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, 7, 0, Math.PI * 2);
  ctx.fill();

  // End effector (gripper/hand)
  drawGripper(ctx, endEffector);
}

function drawArmSegment(
  ctx: CanvasRenderingContext2D,
  start: Vector2D,
  end: Vector2D,
  color: string,
  thickness: number
) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = distance(start, end);

  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(angle);

  // Create gradient for 3D effect
  const gradient = ctx.createLinearGradient(0, -thickness/2, 0, thickness/2);
  gradient.addColorStop(0, adjustBrightness(color, 1.3));
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, adjustBrightness(color, 0.7));

  // Draw segment
  ctx.fillStyle = gradient;
  ctx.strokeStyle = adjustBrightness(color, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, -thickness/2, length, thickness, thickness/2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawGripper(ctx: CanvasRenderingContext2D, position: Vector2D) {
  // Main gripper body
  ctx.fillStyle = '#2563eb';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner circle
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 9, 0, Math.PI * 2);
  ctx.fill();

  // Center dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, target: Vector2D) {
  // Outer glow
  ctx.save();
  ctx.shadowColor = COLORS.target;
  ctx.shadowBlur = 20;

  // Target circle
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_CONFIG.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Inner circles for depth
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_CONFIG.radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_CONFIG.radius * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1.0;

  // Center dot
  ctx.fillStyle = COLORS.target;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCursorIndicator(ctx: CanvasRenderingContext2D, position: Vector2D) {
  // Draw crosshair
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Horizontal line
  ctx.moveTo(position.x - 12, position.y);
  ctx.lineTo(position.x + 12, position.y);
  // Vertical line
  ctx.moveTo(position.x, position.y - 12);
  ctx.lineTo(position.x, position.y + 12);
  ctx.stroke();

  // Draw center dot to mark exact target position
  ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRecordingIndicator(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(30, 30, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.font = '14px sans-serif';
  ctx.fillText('REC', 45, 36);
}

export function drawTrajectoryPath(ctx: CanvasRenderingContext2D, frames: MotionFrame[]) {
  if (frames.length < 2) return;

  // Use a smooth curve with reduced point density for better rendering
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw using quadratic curves for smoother path
  ctx.beginPath();
  ctx.moveTo(frames[0].endEffectorPosition.x, frames[0].endEffectorPosition.y);

  // Sample every 3rd frame to reduce noise and create smoother lines
  const sampleRate = 3;

  for (let i = sampleRate; i < frames.length; i += sampleRate) {
    const prevFrame = frames[i - sampleRate];
    const currentFrame = frames[i];

    // Calculate control point (midpoint for smooth curve)
    const controlX = (prevFrame.endEffectorPosition.x + currentFrame.endEffectorPosition.x) / 2;
    const controlY = (prevFrame.endEffectorPosition.y + currentFrame.endEffectorPosition.y) / 2;

    ctx.quadraticCurveTo(
      prevFrame.endEffectorPosition.x,
      prevFrame.endEffectorPosition.y,
      controlX,
      controlY
    );
  }

  // Draw to the last frame
  const lastFrame = frames[frames.length - 1];
  ctx.lineTo(lastFrame.endEffectorPosition.x, lastFrame.endEffectorPosition.y);

  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
}

// Utility to adjust color brightness
function adjustBrightness(color: string, factor: number): string {
  // Simple brightness adjustment for hex colors
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) * factor));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) * factor));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) * factor));
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}
