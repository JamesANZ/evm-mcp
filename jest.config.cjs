module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@modelcontextprotocol|ethers|zod)/)",
  ],
};
