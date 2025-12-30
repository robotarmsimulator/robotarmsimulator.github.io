/**
 * ProgressIndicator component
 * Shows progress through the 8 motion prompts as a pie chart
 */

import { useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TOTAL_MOTIONS, COLORS } from '../../constants/config';
import './ProgressIndicator.css';

export default function ProgressIndicator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { userSession } = useAppContext();

  const completedCount = userSession?.completedMotions.length || 0;
  const totalCount = TOTAL_MOTIONS;
  const progress = completedCount / totalCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const size = 55;

    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const centerX = Math.floor(size / 2) + 0.5;
    const centerY = Math.floor(size / 2) + 0.5;
    const radius = 22;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.border;
    ctx.fill();

    // Draw progress arc
    if (progress > 0) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = COLORS.success;
      ctx.fill();
    }

    // Draw inner circle (to create donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Draw text with better rendering
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillText(`${completedCount}/${totalCount}`, centerX, centerY);
  }, [completedCount, progress]);

  return (
    <div className="progress-indicator">
      <canvas
        ref={canvasRef}
        // width={55}
        // height={55}
        className="progress-canvas"
      />
      <div className="progress-label">Motions Completed</div>
    </div>
  );
}
