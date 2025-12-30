/**
 * Motion prompt definitions
 * Laban Efforts and their metaphorical alternatives
 */

import type { PromptConfig, PromptType } from '../types';

/**
 * All available prompts with both Laban and metaphor descriptions
 */
export const PROMPTS: PromptConfig[] = [
  {
    type: 'Bound',
    labanText: 'Bound',
    metaphorText: 'Restrained, like moving through thick honey'
  },
  {
    type: 'Free',
    labanText: 'Free',
    metaphorText: 'Unrestricted, like a bird soaring through the sky'
  },
  {
    type: 'Sudden',
    labanText: 'Sudden',
    metaphorText: 'Quick and sharp, like a lightning strike'
  },
  {
    type: 'Sustained',
    labanText: 'Sustained',
    metaphorText: 'Smooth and continuous, like molasses flowing'
  },
  {
    type: 'Strong',
    labanText: 'Strong',
    metaphorText: 'Powerful and forceful, like pushing through a wall'
  },
  {
    type: 'Light',
    labanText: 'Light',
    metaphorText: 'Delicate and gentle, like a feather floating'
  },
  {
    type: 'Direct',
    labanText: 'Direct',
    metaphorText: 'Straight and focused, like an arrow to a target'
  },
  {
    type: 'Indirect',
    labanText: 'Indirect',
    metaphorText: 'Wandering and meandering, like a river finding its path'
  }
];

/**
 * Get all prompt types in a randomized order
 */
export function getRandomizedPromptOrder(): PromptType[] {
  const types: PromptType[] = PROMPTS.map(p => p.type);

  // Fisher-Yates shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  return types;
}

/**
 * Get prompt text based on type and set
 */
export function getPromptText(type: PromptType, set: 'laban' | 'metaphor'): string {
  const prompt = PROMPTS.find(p => p.type === type);
  if (!prompt) return type;

  return set === 'laban' ? prompt.labanText : prompt.metaphorText;
}
