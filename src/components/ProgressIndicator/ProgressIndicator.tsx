import { useAppContext } from '../../context/AppContext';
import { TOTAL_MOTIONS, COLORS } from '../../constants/config';
import './ProgressIndicator.css';

export default function ProgressIndicator() {
  const { userSession } = useAppContext();

  const completedCount = userSession?.completedMotions.length || 0;
  const totalCount = TOTAL_MOTIONS;
  const progress = completedCount / totalCount;

  const size = 55;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="progress-indicator">
      <svg width={size} height={size} className="progress-canvas">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.success}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Label */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-color)"
          fontSize="13"
          fontWeight="bold"
          fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        >
          {completedCount}/{totalCount}
        </text>
      </svg>
      <div className="progress-label">Motions Completed</div>
    </div>
  );
}