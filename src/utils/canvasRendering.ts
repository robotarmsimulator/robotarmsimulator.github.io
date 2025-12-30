/**
 * Canvas rendering utilities
 * All drawing functions for the robot arm visualization
 */

import type { Vector2D, MotionFrame } from '../types';
import { distance } from './kinematics';
import {
  CANVAS_CONFIG,
  ROBOT_CONFIG,
  COLORS,
  TARGET_CONFIG
} from '../constants/config';

export function drawWorkspace(ctx: CanvasRenderingContext2D, shoulderPosition: Vector2D) {
  // Draw dashed workspace boundary (range circle centered on robot base)
  const maxReach = ROBOT_CONFIG.upperArmLength + ROBOT_CONFIG.lowerArmLength;

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(shoulderPosition.x, shoulderPosition.y, maxReach, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawRobotArmEnhanced(
  ctx: CanvasRenderingContext2D,
  shoulder: Vector2D,
  elbow: Vector2D,
  endEffector: Vector2D
) {
  // Lighter shadow for better performance
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Upper arm segment (metallic look)
  drawRoboticArmSegment(ctx, shoulder, elbow, '#94a3b8', 16);

  // Lower arm segment (lighter metallic)
  drawRoboticArmSegment(ctx, elbow, endEffector, '#cbd5e1', 14);

  ctx.restore();

  // Shoulder base (fixed mount with actuator)
  drawShoulderBase(ctx, shoulder);

  // Elbow joint (servo motor)
  drawElbowJoint(ctx, elbow);

  // End effector (gripper/hand)
  drawRoboticGripper(ctx, endEffector, elbow);
}


export function drawTarget(ctx: CanvasRenderingContext2D, target: Vector2D) {
  // Lighter glow for better performance
  ctx.save();
  ctx.shadowColor = COLORS.target;
  ctx.shadowBlur = 10;

  // Target circle
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_CONFIG.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Single inner circle for depth (reduced from 2 circles)
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y, TARGET_CONFIG.radius * 0.5, 0, Math.PI * 2);
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
  // Use CSS variable for background color to support dark mode
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg-color').trim() || COLORS.background;
  ctx.fillStyle = bgColor;
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

// Cache for gradients to avoid recreating them every frame
const gradientCache = new Map<string, CanvasGradient>();

// New robotic arm segment with mechanical details
function drawRoboticArmSegment(
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

  // Use cached gradient or create new one
  const gradientKey = `${color}-${thickness}`;
  let gradient = gradientCache.get(gradientKey);

  if (!gradient) {
    gradient = ctx.createLinearGradient(0, -thickness/2, 0, thickness/2);
    gradient.addColorStop(0, adjustBrightness(color, 1.4));
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, adjustBrightness(color, 0.8));
    gradient.addColorStop(1, adjustBrightness(color, 0.6));
    gradientCache.set(gradientKey, gradient);
  }

  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, -thickness/2, length, thickness, 4);
  ctx.fill();
  ctx.stroke();

  // Simplified mechanical details - reduce number of lines drawn
  ctx.strokeStyle = adjustBrightness(color, 0.7);
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Horizontal center line only (removed vertical lines for performance)
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(length - 10, 0);
  ctx.stroke();

  // Reduced rivets/bolts (only 2 instead of 4)
  ctx.fillStyle = '#475569';
  const rivetPositions = [length * 0.25, length * 0.75];
  for (const x of rivetPositions) {
    if (x > 0 && x < length) {
      ctx.beginPath();
      ctx.arc(x, -thickness/3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, thickness/3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Shoulder base with actuator housing
function drawShoulderBase(ctx: CanvasRenderingContext2D, position: Vector2D) {
  // Base plate (floor mount)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(position.x - 25, position.y - 8, 50, 16);
  ctx.fill();
  ctx.stroke();

  // Actuator housing
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner ring detail
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 14, 0, Math.PI * 2);
  ctx.stroke();

  // Center hub
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Mounting bolts
  ctx.fillStyle = '#0f172a';
  const boltAngles = [0, Math.PI/2, Math.PI, Math.PI * 1.5];
  boltAngles.forEach(angle => {
    const bx = position.x + Math.cos(angle) * 16;
    const by = position.y + Math.sin(angle) * 16;
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Elbow joint servo motor
function drawElbowJoint(ctx: CanvasRenderingContext2D, position: Vector2D) {
  // Servo body
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Servo horn (the rotating part)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Center screw
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(position.x, position.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Servo mounting points
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  [0, Math.PI * 0.66, Math.PI * 1.33].forEach(angle => {
    const px = position.x + Math.cos(angle) * 12;
    const py = position.y + Math.sin(angle) * 12;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

// Robotic gripper
function drawRoboticGripper(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  elbow: Vector2D
) {
  const angle = Math.atan2(position.y - elbow.y, position.x - elbow.x);

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Gripper base
  ctx.fillStyle = '#3b82f6';
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gripper fingers (basic two parallel jaws)
  ctx.fillStyle = '#60a5fa';
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1.5;

  // Upper finger
  ctx.beginPath();
  ctx.roundRect(8, -8, 12, 5, 2);
  ctx.fill();
  ctx.stroke();

  // Lower finger
  ctx.beginPath();
  ctx.roundRect(8, 3, 12, 5, 2);
  ctx.fill();
  ctx.stroke();

  // Finger details (grip pads)
  ctx.fillStyle = '#1e40af';
  for (let i = 10; i < 18; i += 3) {
    ctx.fillRect(i, -7, 1, 3);
    ctx.fillRect(i, 4, 1, 3);
  }

  // Center indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
