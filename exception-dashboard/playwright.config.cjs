const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  "testDir": "./tests/browser",
  "timeout": 30000,
  "fullyParallel": true,
  "reporter": [
    [
      "list"
    ],
    [
      "html",
      {
        "open": "never"
      }
    ]
  ],
  "use": {
    "baseURL": "http://127.0.0.1:4177",
    "trace": "retain-on-failure",
    "screenshot": "only-on-failure"
  },
  "projects": [
    {
      "name": "desktop",
      "use": {
        "browserName": "chromium",
        "viewport": {
          "width": 1440,
          "height": 1000
        }
      }
    },
    {
      "name": "mobile",
      "use": {
        "browserName": "chromium",
        "viewport": {
          "width": 390,
          "height": 844
        },
        "isMobile": true,
        "hasTouch": true
      }
    }
  ],
  "webServer": {
    "command": "npx vite preview --config demo/vite.config.mjs --host 127.0.0.1 --port 4177 --strictPort",
    "url": "http://127.0.0.1:4177",
    "reuseExistingServer": false
  }
});
