/**
 * PromptDisplay component
 * Shows the current motion prompt to the user
 */

import { useAppContext } from '../../context/AppContext';
import { getPromptText } from '../../constants/prompts';
import './PromptDisplay.css';

export default function PromptDisplay() {
  const { userSession } = useAppContext();

  if (!userSession) return null;

  const currentPromptType = userSession.promptOrder[userSession.currentPromptIndex];
  const promptText = getPromptText(currentPromptType, userSession.promptSet);

  return (
    <div className="prompt-display">
      <div className="prompt-label">Current Prompt:</div>
      <div className="prompt-text">{promptText}</div>
      <div className="prompt-subtitle">
        Create a motion that expresses this quality
      </div>
    </div>
  );
}
