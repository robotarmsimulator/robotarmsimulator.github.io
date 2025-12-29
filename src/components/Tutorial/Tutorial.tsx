/**
 * Tutorial component
 * Interactive tutorial for new users
 */

import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Tutorial.css';

const tutorialSteps = [
  {
    title: 'Welcome to the Robot Arm Simulator',
    content: 'You will control a 2D robot arm to create expressive motions by moving your mouse. The arm will smoothly follow your cursor as you draw paths in the canvas.',
    image: null
  },
  {
    title: 'Your Goal',
    content: 'For each prompt, guide the robot arm from its starting position to the green target circle. The path you draw should express the quality described in the prompt.',
    image: null
  },
  {
    title: 'How to Control the Arm',
    content: 'Simply move your mouse over the canvas and the robot arm will follow your cursor. The arm moves smoothly like you are drawing or controlling a character in a game.',
    image: null
  },
  {
    title: 'Automatic Recording',
    content: 'Recording starts automatically as soon as you move your mouse over the canvas. Every movement is tracked, so you can focus on creating expressive motion.',
    image: null
  },
  {
    title: 'Timeline Playback',
    content: 'Use the timeline at the bottom to review your recorded motion. You can click anywhere on the timeline to see that moment in your motion.',
    image: null
  },
  {
    title: 'Undo and Reset',
    content: 'Made a mistake? Use the Undo button to step back. Need to start over? The Reset button clears your current motion so you can try again.',
    image: null
  },
  {
    title: 'Completing a Motion',
    content: 'When the arm reaches the green target, the Complete button will activate. Click it to save your motion and move on to the next prompt. You will create 8 motions in total.',
    image: null
  },
  {
    title: 'Ready to Begin!',
    content: 'Take your time with each motion. There are no wrong answers! Just move your mouse to express the prompt in whatever way feels right to you.',
    image: null
  }
];

export default function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const { setAppState } = useAppContext();

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start the actual recording session
      setAppState('recording');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setAppState('recording');
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="tutorial-screen">
      <div className="tutorial-content">
        <div className="tutorial-progress">
          Step {currentStep + 1} of {tutorialSteps.length}
        </div>

        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-text">{step.content}</p>

        <div className="tutorial-navigation">
          <button
            className="tutorial-button secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </button>

          <button
            className="tutorial-button secondary"
            onClick={handleSkip}
          >
            Skip Tutorial
          </button>

          <button
            className="tutorial-button primary"
            onClick={handleNext}
          >
            {isLastStep ? 'Start Recording' : 'Next'}
          </button>
        </div>

        <div className="tutorial-dots">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`tutorial-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
