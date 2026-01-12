/**
 * Data export utilities for generating CSV files
 */

import JSZip from 'jszip';
import type { MotionTrajectory, TrajectoryCSVData, SessionCSVData } from '../types';

/**
 * Convert motion trajectory to CSV data rows
 */
function trajectoryToCSVData(
  trajectory: MotionTrajectory,
  participantId: string,
  sessionId: string
): TrajectoryCSVData[] {
  return trajectory.frames.map((frame, index) => ({
    participantId,
    sessionId,
    promptType: trajectory.promptType,
    promptText: trajectory.promptText,
    frameIndex: index,
    timestamp: frame.timestamp,
    shoulderAngle: frame.shoulderAngle,
    elbowAngle: frame.elbowAngle,
    endEffectorX: frame.endEffectorPosition.x,
    endEffectorY: frame.endEffectorPosition.y,
    elbowX: frame.elbowPosition.x,
    elbowY: frame.elbowPosition.y
  }));
}

/**
 * Convert array of objects to CSV string
 */
function objectArrayToCSV(data: Array<Record<string, string | number | boolean>>): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  // Convert each object to a row
  const rows = data.map(obj =>
    headers.map(header => {
      const value = obj[header];
      // Escape values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

/**
 * Export trajectory data as CSV file
 */
export function exportTrajectoryCSV(
  trajectory: MotionTrajectory,
  participantId: string,
  sessionId: string,
  promptSet?: 'laban' | 'metaphor'
): void {
  const csvData = trajectoryToCSVData(trajectory, participantId, sessionId);
  const csvString = objectArrayToCSV(csvData as unknown as Array<Record<string, string | number | boolean>>);

  // Create filename with participant ID, M/L indicator, and prompt type
  const setIndicator = promptSet === 'metaphor' ? 'M' : promptSet === 'laban' ? 'L' : '';
  const filename = `trajectory_${participantId}_${setIndicator}_${trajectory.promptType}_${Date.now()}.csv`;

  downloadCSV(csvString, filename);
}

/**
 * Export session summary data as CSV file
 */
export function exportSessionCSV(
  trajectories: MotionTrajectory[],
  participantId: string,
  sessionId: string,
  promptSet: 'laban' | 'metaphor'
): void {
  const csvData: SessionCSVData[] = trajectories.map(traj => ({
    participantId,
    sessionId,
    promptSet,
    promptType: traj.promptType,
    promptText: traj.promptText,
    attemptCount: traj.attemptCount,
    totalTimeMs: traj.totalTimeMs,
    frameCount: traj.frames.length,
    completed: traj.completed
  }));

  const csvString = objectArrayToCSV(csvData as unknown as Array<Record<string, string | number | boolean>>);

  // Add M/L indicator to session filename
  const setIndicator = promptSet === 'metaphor' ? 'M' : 'L';
  const filename = `session_${participantId}_${setIndicator}_${sessionId}_${Date.now()}.csv`;

  downloadCSV(csvString, filename);
}

/**
 * Export all trajectories as individual CSV files
 */
export function exportAllTrajectories(
  trajectories: MotionTrajectory[],
  participantId: string,
  sessionId: string,
  promptSet?: 'laban' | 'metaphor'
): void {
  trajectories.forEach(trajectory => {
    exportTrajectoryCSV(trajectory, participantId, sessionId, promptSet);
  });
}

/**
 * Download CSV string as a file
 */
function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file to trajectory data
 */
export async function importTrajectoryCSV(file: File): Promise<MotionTrajectory | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve(null);
        return;
      }

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          resolve(null);
          return;
        }

        // Parse header
        const headers = lines[0].split(',');

        // Parse data rows
        const frames = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            const row: Record<string, string> = {};
            headers.forEach((header, i) => {
              row[header] = values[i];
            });
            return row;
          });

        if (frames.length === 0) {
          resolve(null);
          return;
        }

        // Extract trajectory metadata from first frame
        const firstFrame = frames[0];
        const promptType = firstFrame.promptType as any;
        const promptText = firstFrame.promptText;

        // Convert to motion frames
        const motionFrames = frames.map(frame => ({
          timestamp: parseFloat(frame.timestamp),
          shoulderAngle: parseFloat(frame.shoulderAngle),
          elbowAngle: parseFloat(frame.elbowAngle),
          endEffectorPosition: {
            x: parseFloat(frame.endEffectorX),
            y: parseFloat(frame.endEffectorY)
          },
          elbowPosition: {
            x: parseFloat(frame.elbowX),
            y: parseFloat(frame.elbowY)
          }
        }));

        const trajectory: MotionTrajectory = {
          frames: motionFrames,
          startPosition: motionFrames[0].endEffectorPosition,
          targetPosition: motionFrames[motionFrames.length - 1].endEffectorPosition,
          promptType,
          promptText,
          completed: true,
          attemptCount: 1,
          totalTimeMs: motionFrames[motionFrames.length - 1].timestamp
        };

        resolve(trajectory);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        resolve(null);
      }
    };

    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate random participant ID (for users who don't provide one)
 */
export function generateRandomParticipantId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `user_${timestamp}_${randomPart}`;
}

/**
 * Export all data as a ZIP file containing session CSV and all trajectory CSVs
 */
export async function exportAllDataAsZip(
  trajectories: MotionTrajectory[],
  participantId: string,
  sessionId: string,
  promptSet: 'laban' | 'metaphor'
): Promise<void> {
  const zip = new JSZip();
  const setIndicator = promptSet === 'metaphor' ? 'M' : 'L';

  // Add session summary CSV
  const sessionCsvData: SessionCSVData[] = trajectories.map(traj => ({
    participantId,
    sessionId,
    promptSet,
    promptType: traj.promptType,
    promptText: traj.promptText,
    attemptCount: traj.attemptCount,
    totalTimeMs: traj.totalTimeMs,
    frameCount: traj.frames.length,
    completed: traj.completed
  }));
  const sessionCsvString = objectArrayToCSV(sessionCsvData as unknown as Array<Record<string, string | number | boolean>>);
  const sessionFilename = `session_${participantId}_${setIndicator}_${sessionId}.csv`;
  zip.file(sessionFilename, sessionCsvString);

  // Add individual trajectory CSVs
  trajectories.forEach((trajectory) => {
    const csvData = trajectoryToCSVData(trajectory, participantId, sessionId);
    const csvString = objectArrayToCSV(csvData as unknown as Array<Record<string, string | number | boolean>>);
    const filename = `trajectory_${participantId}_${setIndicator}_${trajectory.promptType}.csv`;
    zip.file(filename, csvString);
  });

  // Generate and download ZIP file
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const zipFilename = `robot_arm_data_${participantId}_${setIndicator}_${Date.now()}.zip`;
    link.setAttribute('href', url);
    link.setAttribute('download', zipFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
}
