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
    metaphorText: 'Unrestricted, like floating in outer space'
  },
  {
    type: 'Sudden',
    labanText: 'Sudden',
    metaphorText: 'Running late to a high-stakes event'
  },
  {
    type: 'Sustained',
    labanText: 'Sustained',
    metaphorText: 'Taking a leisurely walk'
  },
  {
    type: 'Strong',
    labanText: 'Strong',
    metaphorText: 'Moving against strong wind'
  },
  {
    type: 'Light',
    labanText: 'Light',
    metaphorText: 'A feather floating'
  },
  {
    type: 'Direct',
    labanText: 'Direct',
    metaphorText: 'Singularly focused on the target'
  },
  {
    type: 'Indirect',
    labanText: 'Indirect',
    metaphorText: 'Ignoring the target'
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
