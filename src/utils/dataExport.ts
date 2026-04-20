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

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(obj =>
    headers.map(header => {
      const value = obj[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

/**
 * Normalize a participant name into a display name and a safe filename segment
 */
type NameToFileOpts = {
  replaceApostropheForFile?: string;
  removeSpaces?: boolean;
};

function nameToSafeFilename(input: string, opts: NameToFileOpts = {}): { displayName: string; filename: string } {
  if (!input) return { displayName: 'Anonymous', filename: 'anonymous' };

  const {
    replaceApostropheForFile = '_',
    removeSpaces = true,
  } = opts;

  let s = input.trim().replace(/\s+/g, ' ');
  s = s.replace(/[^A-Za-z0-9À-ÖØ-öø-ÿ' \-]/g, '');

  s = s.split(' ').map(word =>
    word.split(/(-|')/).map(part =>
      (part === '-' || part === "'") ? part :
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join('')
  ).join(removeSpaces ? '' : ' ');

  let filename = s;
  filename = filename.replace(/\s+/g, removeSpaces ? '' : '_');
  filename = filename.replace(/'/g, replaceApostropheForFile);
  filename = filename.replace(/[^A-Za-z0-9\-\_\.]/g, '');
  const MAX = 200;
  if (filename.length > MAX) filename = filename.slice(0, MAX);

  return { displayName: s, filename };
}

/**
 * Export all data as a ZIP file containing session CSV and all trajectory CSVs
 */
export async function exportAllDataAsZip(
  trajectories: MotionTrajectory[],
  participantId: string,
  sessionId: string,
  promptSet: 'laban' | 'metaphor',
  tutorialCompleted: boolean = false
): Promise<void> {
  const zip = new JSZip();
  const { filename: safeId } = nameToSafeFilename(participantId);
  const setIndicator = promptSet === 'metaphor' ? 'M' : 'L';

  // Add session summary CSV
  const sessionCsvData: SessionCSVData[] = trajectories.map(traj => ({
    participantId,
    sessionId,
    promptSet,
    tutorialCompleted,
    promptType: traj.promptType,
    promptText: traj.promptText,
    attemptCount: traj.attemptCount,
    replayCount: traj.replayCount ?? 0,
    eventLog: (traj.eventLog ?? []).join('; '),
    totalTimeMs: traj.totalTimeMs,
    frameCount: traj.frames.length,
    completed: traj.completed
  }));
  const sessionCsvString = objectArrayToCSV(sessionCsvData as unknown as Array<Record<string, string | number | boolean>>);
  zip.file(`metadata_${safeId}_${setIndicator}_${sessionId}.csv`, sessionCsvString);

  // Add individual trajectory CSVs
  trajectories.forEach((trajectory) => {
    const csvData = trajectoryToCSVData(trajectory, participantId, sessionId);
    const csvString = objectArrayToCSV(csvData as unknown as Array<Record<string, string | number | boolean>>);
    zip.file(`trajectory_${safeId}_${setIndicator}_${trajectory.promptType}.csv`, csvString);
  });

  // Generate ZIP and upload to Box via Cloudflare Worker
  const zipFilename = `UCLAD182${safeId}.zip`;
  let blob: Blob;

  try {
    blob = await zip.generateAsync({ type: 'blob' });
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }

  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined;

  if (workerUrl) {
    // Convert blob to base64 for JSON transport
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const zipBase64 = btoa(binary);

    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipBase64, filename: zipFilename }),
      });

      const result = await response.json() as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? 'Upload failed');
      return; // Success — no download needed
    } catch (uploadError) {
      // Worker upload failed — fall back to local download so data is not lost
      console.error('Worker upload failed, falling back to download:', uploadError);
    }
  }

  // Fallback: trigger a local download (also used when VITE_WORKER_URL is not set)
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', zipFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      if (!text) { resolve(null); return; }

      try {
        const lines = text.split('\n');
        if (lines.length < 2) { resolve(null); return; }

        const headers = lines[0].split(',');
        const frames = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            const row: Record<string, string> = {};
            headers.forEach((header, i) => { row[header] = values[i]; });
            return row;
          });

        if (frames.length === 0) { resolve(null); return; }

        const firstFrame = frames[0];
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

        resolve({
          frames: motionFrames,
          startPosition: motionFrames[0].endEffectorPosition,
          targetPosition: motionFrames[motionFrames.length - 1].endEffectorPosition,
          promptType: firstFrame.promptType as any,
          promptText: firstFrame.promptText,
          completed: true,
          attemptCount: 1,
          replayCount: 0,
          eventLog: [],
          totalTimeMs: motionFrames[motionFrames.length - 1].timestamp
        });
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
 * Generate random participant ID for users who don't provide one
 */
export function generateRandomParticipantId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `user_${timestamp}_${randomPart}`;
}