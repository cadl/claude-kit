#!/usr/bin/env node

/**
 * Electron Screenshot Generator using Playwright
 *
 * This script automates screenshot capture for Electron applications
 * across multiple languages and scenarios.
 *
 * Usage:
 *   node screenshot_electron.js [options]
 *
 * Options:
 *   --lang <lang>    Generate screenshots for specific language (default: all)
 *   --output <dir>   Output directory (default: ./fastlane/screenshots)
 *   --config <file>  Config file path (default: ./screenshot.config.js)
 */

const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

// Default configuration
const defaultConfig = {
  // Path to your built Electron main process file
  appPath: './dist/main/index.js',

  // Alternative: Use packaged app
  // appPath: './dist/mac-arm64/YourApp.app/Contents/MacOS/YourApp',

  // Output directory for screenshots
  outputDir: './fastlane/screenshots',

  // Supported languages (must match fastlane metadata structure)
  languages: ['en-US', 'zh-Hans'],

  // Window size (for consistent screenshots)
  windowSize: { width: 1280, height: 800 },

  // Screenshots to capture
  // Each screenshot can have:
  //   - name: filename (without extension)
  //   - setup: async function to prepare the screenshot (optional)
  //   - waitFor: selector or time to wait before screenshot (optional)
  screenshots: [
    {
      name: '1_main',
      description: 'Main application window',
      setup: null,
      waitFor: 'domcontentloaded'
    },
    {
      name: '2_feature',
      description: 'Feature demonstration',
      setup: async (page) => {
        // Example: Click a button to show a feature
        // await page.click('#feature-button');
        // await page.waitForTimeout(500);
      },
      waitFor: 500
    }
  ],

  // Language switcher function (optional)
  // Implement this if your app supports runtime language switching
  switchLanguage: async (page, lang) => {
    // Example implementation:
    // await page.evaluate((locale) => {
    //   window.i18n.changeLanguage(locale);
    // }, lang);
    // await page.waitForTimeout(500);
  },

  // Pre-launch setup (optional)
  // Run before launching the app
  beforeLaunch: async () => {
    // Example: Clear app data, set environment variables, etc.
  },

  // Post-launch setup (optional)
  // Run after app launches but before screenshots
  afterLaunch: async (page) => {
    // Example: Skip onboarding, login, etc.
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    lang: null,
    output: null,
    config: './screenshot.config.js'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) {
      options.lang = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    } else if (args[i] === '--config' && args[i + 1]) {
      options.config = args[i + 1];
      i++;
    }
  }

  return options;
}

// Load configuration
function loadConfig(configPath) {
  if (fs.existsSync(configPath)) {
    console.log(`Loading config from ${configPath}`);
    const userConfig = require(path.resolve(configPath));
    return { ...defaultConfig, ...userConfig };
  }

  console.log('Using default configuration');
  return defaultConfig;
}

// Main screenshot capture function
async function captureScreenshots() {
  const cliOptions = parseArgs();
  const config = loadConfig(cliOptions.config);

  if (cliOptions.output) {
    config.outputDir = cliOptions.output;
  }

  const languages = cliOptions.lang
    ? [cliOptions.lang]
    : config.languages;

  console.log('\n=== Electron Screenshot Generator ===\n');
  console.log(`App: ${config.appPath}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`Languages: ${languages.join(', ')}`);
  console.log(`Screenshots: ${config.screenshots.length}\n`);

  // Ensure output directories exist
  for (const lang of languages) {
    const langDir = path.join(config.outputDir, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`Created directory: ${langDir}`);
    }
  }

  // Run before-launch setup
  if (config.beforeLaunch) {
    console.log('Running pre-launch setup...');
    await config.beforeLaunch();
  }

  // Launch Electron app
  console.log('\nLaunching Electron app...');
  const app = await electron.launch({
    args: [config.appPath],
    // Uncomment for debugging:
    // executablePath: '/path/to/Electron',
    // timeout: 30000
  });

  const page = await app.firstWindow();

  // Set window size
  if (config.windowSize) {
    await page.setViewportSize(config.windowSize);
    console.log(`Set viewport: ${config.windowSize.width}x${config.windowSize.height}`);
  }

  // Wait for initial load
  await page.waitForLoadState('domcontentloaded');
  console.log('✓ App loaded\n');

  // Run after-launch setup
  if (config.afterLaunch) {
    console.log('Running post-launch setup...');
    await config.afterLaunch(page);
  }

  // Capture screenshots for each language
  for (const lang of languages) {
    console.log(`\n--- Capturing ${lang} ---`);

    // Switch language if supported
    if (config.switchLanguage) {
      console.log(`Switching to ${lang}...`);
      await config.switchLanguage(page, lang);
    }

    // Capture each screenshot
    for (const shot of config.screenshots) {
      try {
        console.log(`Capturing: ${shot.name} (${shot.description || 'no description'})`);

        // Run setup function if provided
        if (shot.setup) {
          await shot.setup(page);
        }

        // Wait if specified
        if (shot.waitFor) {
          if (typeof shot.waitFor === 'string') {
            await page.waitForSelector(shot.waitFor);
          } else if (typeof shot.waitFor === 'number') {
            await page.waitForTimeout(shot.waitFor);
          }
        }

        // Capture screenshot
        const outputPath = path.join(config.outputDir, lang, `${shot.name}.png`);
        await page.screenshot({
          path: outputPath,
          fullPage: false
        });

        console.log(`  ✓ Saved to ${outputPath}`);
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
      }
    }
  }

  // Close app
  console.log('\nClosing app...');
  await app.close();

  console.log('\n=== Screenshot capture complete ===\n');
  console.log('Next steps:');
  console.log('1. Review screenshots in', config.outputDir);
  console.log('2. Run frameit to add backgrounds/captions:');
  console.log('   cd fastlane && fastlane frameit');
  console.log('3. Upload to App Store Connect:');
  console.log('   fastlane upload');
}

// Run if called directly
if (require.main === module) {
  captureScreenshots().catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { captureScreenshots, defaultConfig };
