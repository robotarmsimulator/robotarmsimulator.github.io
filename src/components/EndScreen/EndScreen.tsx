/**
 * EndScreen component
 * Shown after completing all 8 motions
 */

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  exportAllDataAsZip
} from '../../utils/dataExport';
import './EndScreen.css';

export default function EndScreen() {
  const { userSession } = useAppContext();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!userSession) return null;

  const handleDownloadAll = async () => {
    const participantId = userSession.userId || 'anonymous';

    setIsDownloading(true);
    try {
      // Export all data as a single ZIP file
      await exportAllDataAsZip(
        userSession.completedMotions,
        participantId,
        userSession.sessionId,
        userSession.promptSet
      );
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('There was an error downloading the data. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const totalTime = Date.now() - userSession.startTime;
  const totalMinutes = Math.floor(totalTime / 60000);
  const totalSeconds = Math.floor((totalTime % 60000) / 1000);

  return (
    <div className="end-screen">
      <div className="end-content">
        <div className="end-icon">✓</div>
        <h1 className="end-title">Thank You!</h1>
        <p className="end-subtitle">
          You have completed all 8 motion recordings
        </p>

        <div className="end-stats">
          <div className="stat-item">
            <div className="stat-value">{userSession.completedMotions.length}</div>
            <div className="stat-label">Motions Created</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {totalMinutes}:{totalSeconds.toString().padStart(2, '0')}
            </div>
            <div className="stat-label">Total Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {userSession.promptSet === 'laban' ? 'Laban' : 'Metaphor'}
            </div>
            <div className="stat-label">Prompt Set</div>
          </div>
        </div>

        <div className="end-description">
          <p>
            Your data has been recorded successfully. Please download your data files
            using the button below.
          </p>
          {userSession.userId && (
            <p>
              <strong>Participant ID:</strong> {userSession.userId}
            </p>
          )}
          <p className="end-note">
            If you are a Prolific study participant, please follow the instructions
            provided to submit your completion code.
          </p>
        </div>

        <button
          className="download-button"
          onClick={handleDownloadAll}
          disabled={isDownloading}
        >
          {isDownloading ? 'Preparing Download...' : 'Download All Data (ZIP)'}
        </button>

        <div className="end-footer">
          <p>
            Thank you for your participation in this research study.
          </p>
        </div>
      </div>
    </div>
  );
}
