import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_AI_PROVIDER: 'mock',
      VITE_AI_MAX_TOKENS: '4000',
      VITE_AI_TEMPERATURE: '0.7',
    },
  },
};
