const base = { preset: 'ts-jest', testEnvironment: 'node', rootDir: '.', transform: { '^.+\\.ts$': ['ts-jest', { diagnostics: false }] } };
module.exports = {
  testTimeout: 30000,
  projects: [
    { ...base, displayName: 'unit', testMatch: ['<rootDir>/src/**/*.spec.ts'] },
    { ...base, displayName: 'integration', testMatch: ['<rootDir>/test/**/*.int-spec.ts'] },
  ],
};
