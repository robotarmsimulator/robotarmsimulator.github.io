/**
 * Timeline component
 * Displays motion timeline with scrubbing capability
 */

import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TIMELINE_CONFIG, COLORS } from '../../constants/config';
import './Timeline.css';

export default function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { currentTrajectory, setRobotConfig, robotConfig } = useAppContext();

  const totalFrames = currentTrajectory?.frames.length || 0;

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTrajectory) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = TIMELINE_CONFIG.height;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    if (totalFrames === 0) return;

    // Draw timeline background
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 20, width, 40);

    // Draw frame ticks
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;

    for (let i = 0; i < totalFrames; i += TIMELINE_CONFIG.tickInterval) {
      const x = (i / totalFrames) * width;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 60);
      ctx.stroke();
    }

    // Draw progress bar
    const progressWidth = (currentFrame / totalFrames) * width;
    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, 20, progressWidth, 40);

    // Draw scrubber
    const scrubberX = (currentFrame / totalFrames) * width;
    ctx.fillStyle = COLORS.secondary;
    ctx.fillRect(
      scrubberX - TIMELINE_CONFIG.scrubberWidth / 2,
      10,
      TIMELINE_CONFIG.scrubberWidth,
      60
    );

    // Draw frame number
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Frame ${currentFrame} / ${totalFrames}`, width / 2, height - 10);
  }, [currentFrame, totalFrames, currentTrajectory]);

  // Update robot config when scrubbing
  useEffect(() => {
    if (!currentTrajectory || totalFrames === 0) return;

    const frame = currentTrajectory.frames[currentFrame];
    if (frame) {
      setRobotConfig({
        ...robotConfig,
        shoulderAngle: frame.shoulderAngle,
        elbowAngle: frame.elbowAngle
      });
    }
  }, [currentFrame]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleScrub(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleScrub(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScrub = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTrajectory) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frameIndex = Math.floor((x / canvas.width) * totalFrames);

    setCurrentFrame(Math.max(0, Math.min(totalFrames - 1, frameIndex)));
  };

  if (!currentTrajectory || totalFrames === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">
          Click on the blue end effector to start recording
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={TIMELINE_CONFIG.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="timeline-canvas"
      />
    </div>
  );
}
