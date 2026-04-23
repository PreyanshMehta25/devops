module.exports = {
    testEnvironment: "jsdom",
    extensionsToTreatAsEsm: [".ts", ".tsx"],
    transform: {
        "^.+\\.(t|j)sx?$": ["babel-jest", { configFile: "./babel.config.cjs" }],
    },
    moduleNameMapper: {
        "\\.(css|less|scss)$": "identity-obj-proxy",
        "^@clerk/clerk-react$": "<rootDir>/__mocks__/clerk-react.tsx",
        ".*/ContributionDialog$": "<rootDir>/__mocks__/ContributionDialog.tsx",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
};
