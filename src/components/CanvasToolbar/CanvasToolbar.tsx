/**
 * CanvasToolbar component
 * Desktop-only toolbar with sensitivity control
 */

import { Sliders } from 'lucide-react';
import { MOUSE_SENSITIVITY_CONFIG } from '../../constants/config';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export default function CanvasToolbar({ sensitivity, onSensitivityChange }: CanvasToolbarProps) {
  return (
    <div className="canvas-toolbar">
      <div className="canvas-toolbar-header">
        <Sliders size={18} />
        <span>Drawing Controls</span>
      </div>

      <div className="canvas-toolbar-section">
        <label htmlFor="sensitivity-slider" className="toolbar-label">
          Mouse Sensitivity
          <span className="toolbar-value">
            {sensitivity.toFixed(1)}x
          </span>
        </label>
        <input
          id="sensitivity-slider"
          type="range"
          min={MOUSE_SENSITIVITY_CONFIG.min}
          max={MOUSE_SENSITIVITY_CONFIG.max}
          step="0.1"
          value={sensitivity}
          onChange={(e) => onSensitivityChange(Number(e.target.value))}
          className="toolbar-slider"
        />
      </div>
    </div>
  );
}
