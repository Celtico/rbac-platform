import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://album.serverscel.com",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
