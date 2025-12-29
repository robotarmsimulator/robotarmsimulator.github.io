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

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.arc(centerX, centerY, radius - 15, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Draw text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${completedCount}/${totalCount}`, centerX, centerY);
  }, [completedCount, progress]);

  return (
    <div className="progress-indicator">
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="progress-canvas"
      />
      <div className="progress-label">Motions Completed</div>
    </div>
  );
}
