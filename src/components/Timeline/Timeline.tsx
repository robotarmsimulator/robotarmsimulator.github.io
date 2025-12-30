/**
 * Timeline component
 * Displays motion timeline with scrubbing capability
 */

import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Timeline.css';

export default function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { currentTrajectory, setRobotConfig, robotConfig, redrawFromFrame } = useAppContext();

  const totalFrames = currentTrajectory?.frames.length || 0;

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTrajectory) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // ctx.scale(dpr, dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (totalFrames === 0) return;

    const barHeight = 6;
    const barY = (height - barHeight) / 2;
    const scrubberRadius = 8;

    // Get theme colors
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim();
    const textLightColor = getComputedStyle(document.documentElement).getPropertyValue('--text-light-color').trim();

    // Draw background bar (theme-aware)
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.roundRect(0, barY, width, barHeight, 3);
    ctx.fill();

    // Draw progress bar (primary color)
    const progressWidth = (currentFrame / totalFrames) * width;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(0, barY, progressWidth, barHeight, 3);
    ctx.fill();

    // Draw scrubber circle
    const scrubberX = (currentFrame / totalFrames) * width;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(scrubberX, height / 2, scrubberRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw white inner circle for scrubber
    ctx.fillStyle = surfaceColor;
    ctx.beginPath();
    ctx.arc(scrubberX, height / 2, scrubberRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw frame counter below with better rendering
    ctx.fillStyle = textLightColor;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillText(`Frame ${currentFrame} / ${totalFrames}`, width / 2, height - 5);
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
    const frameIndex = Math.floor((x / rect.width) * totalFrames);

    setCurrentFrame(Math.max(0, Math.min(totalFrames - 1, frameIndex)));
  };

  const handleRedrawFromHere = () => {
    if (window.confirm('Redraw from this point? Everything after this frame will be deleted.')) {
      redrawFromFrame(currentFrame);
    }
  };

  // Reset to last frame when trajectory changes
  useEffect(() => {
    if (totalFrames > 0) {
      setCurrentFrame(totalFrames - 1);
    }
  }, [totalFrames]);

  if (!currentTrajectory || totalFrames === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">
          Click on the blue end effector to start recording
        </div>
      </div>
    );
  }

  const canRedraw = currentFrame > 0 && currentFrame < totalFrames - 1;

  return (
    <div className="timeline-container">
      <canvas
        ref={canvasRef}
        // width={600}
        // height={60}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="timeline-canvas"
      />
      <button
        className="redraw-button"
        onClick={handleRedrawFromHere}
        disabled={!canRedraw}
        title={canRedraw ? "Delete everything after this frame and redraw from here" : "Scrub to a frame in the middle to redraw"}
      >
        Redraw from Here
      </button>
    </div>
  );
}
