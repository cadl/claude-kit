#!/usr/bin/env node

/**
 * macOS Electron Screenshot Generator
 *
 * Generates screenshots for App Store using Playwright with macOS-specific features:
 * - Native window capture (includes titlebar and traffic lights)
 * - Content-only capture (web contents only)
 * - Interactive mode (manual UI operation + commands to save)
 * - Automated mode (scripted screenshot generation)
 * - Multi-language support with automatic switching
 *
 * Based on the piconv project implementation.
 *
 * Usage:
 *   node screenshot.js                                    # Interactive mode with window capture
 *   PICONV_SCREENSHOT_MODE=auto node screenshot.js       # Automated mode
 *   PICONV_SCREENSHOT_CAPTURE_MODE=content node screenshot.js  # Content-only capture
 */

const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const readline = require('readline');

function isMacOS() {
  return process.platform === 'darwin';
}

function runOrNull(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return result;
}

function parseSize(size, fallback) {
  if (!size) return fallback;
  const match = String(size).match(/^(\d+)x(\d+)$/);
  if (!match) return fallback;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function getImageSize(filePath) {
  const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const widthMatch = result.stdout.match(/pixelWidth:\s*(\d+)/);
  const heightMatch = result.stdout.match(/pixelHeight:\s*(\d+)/);
  if (!widthMatch || !heightMatch) return null;
  return { width: Number(widthMatch[1]), height: Number(heightMatch[1]) };
}

function resizeImageIfNeeded(filePath, targetSize) {
  if (!targetSize) return;
  const current = getImageSize(filePath);
  if (current && current.width === targetSize.width && current.height === targetSize.height) return;

  const resize = spawnSync(
    'sips',
    ['-z', String(targetSize.height), String(targetSize.width), filePath, '--out', filePath],
    { encoding: 'utf8' }
  );
  if (resize.status !== 0) {
    console.warn(`    WARN: Failed to resize via sips: ${resize.stderr || resize.stdout || ''}`.trim());
  }
}

function getMacOSWindowIdByPid(pid) {
  const swiftScript = path.join(__dirname, 'macos-window-id.swift');
  const result = spawnSync('swift', [swiftScript, String(pid)], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Failed to get macOS window id: ${result.stderr || result.stdout || ''}`.trim());
  }
  const value = Number(String(result.stdout).trim());
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid macOS window id returned: ${result.stdout}`);
  }
  return value;
}

function captureMacOSWindowToFile(windowId, outputPath) {
  const result = spawnSync(
    'screencapture',
    ['-x', '-o', '-t', 'png', '-l', String(windowId), outputPath],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(`screencapture failed: ${result.stderr || result.stdout || ''}`.trim());
  }
}

function activateMacOSProcess(pid) {
  // Best-effort. If this fails, the capture still works but traffic lights may be gray.
  const script = `tell application "System Events" to set frontmost of (first process whose unix id is ${pid}) to true`;
  const result = runOrNull('osascript', ['-e', script]);
  if (!result) return false;
  return true;
}

async function bringElectronWindowToFront(app, bounds) {
  await app.evaluate(({ app, BrowserWindow }, windowBounds) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;

    if (windowBounds) {
      win.setBounds({ x: 100, y: 100, width: windowBounds.width, height: windowBounds.height });
    }

    win.show();
    win.moveTop();
    win.focus();

    // Best-effort: ask the app itself to focus (helps macOS show colored traffic lights).
    try {
      app.focus({ steal: true });
    } catch {
      // ignore
    }
  }, bounds || null);
}

const config = {
  // ============================================================================
  // CONFIGURATION - Customize these values for your project
  // ============================================================================

  // Path to built Electron main process (use absolute path so fastlane can run from `fastlane/`).
  appPath: path.resolve(__dirname, '..', 'out', 'main', 'index.js'),

  // Output directory
  outputDir: path.resolve(__dirname, '..', 'fastlane', 'screenshots'),

  // Languages (must match fastlane metadata structure)
  languages: ['en-US', 'zh-Hans'],

  // Screenshot window size (CSS pixels). Default is the app's dev window size.
  // You can override via env:
  //   PICONV_SCREENSHOT_WINDOW_SIZE=1440x900
  // For App Store 2880x1800 screenshots, a good combo is:
  //   PICONV_SCREENSHOT_WINDOW_SIZE=1440x900
  //   PICONV_SCREENSHOT_DEVICE_SCALE_FACTOR=2
  //   PICONV_SCREENSHOT_OUTPUT_SIZE=2880x1800
  windowSize: parseSize(process.env.PICONV_SCREENSHOT_WINDOW_SIZE, { width: 900, height: 670 }),

  // Force a consistent device scale factor for deterministic output.
  // Default 2 matches typical Retina behavior.
  deviceScaleFactor: Number(process.env.PICONV_SCREENSHOT_DEVICE_SCALE_FACTOR || 2),

  // Screenshot capture mode:
  // - "content": capture only the web contents (default, fast)
  // - "window": capture the native window (includes macOS titlebar/traffic lights; requires Screen Recording permission)
  captureMode: process.env.PICONV_SCREENSHOT_CAPTURE_MODE || 'window',

  // Screenshot flow mode:
  // - "auto": run scripted steps (default)
  // - "interactive": you manually operate the UI, then type commands like "a1" to save screenshots
  mode: (process.env.PICONV_SCREENSHOT_MODE || (process.stdin.isTTY ? 'interactive' : 'auto')).toLowerCase(),

  // In interactive mode, try to auto switch language before capturing.
  interactiveAutoSwitch: process.env.PICONV_SCREENSHOT_INTERACTIVE_AUTOSWITCH !== '0',

  // In "window" capture mode, we try to activate the app via AppleScript so traffic lights are colored.
  // Set to "0" to disable (useful if you don't want to grant Accessibility permission).
  activateOnMacOS: process.env.PICONV_SCREENSHOT_ACTIVATE !== '0',

  // Optional post-resize of the screenshot file (pixels). Leave unset to keep native size.
  outputSize: parseSize(process.env.PICONV_SCREENSHOT_OUTPUT_SIZE, null),

  // ============================================================================
  // SCREENSHOTS - Define your app's screenshots here
  // ============================================================================

  screenshots: [
    {
      name: '1_main',
      description: 'Main window with dropzone',
      setup: async (page) => {
        // TODO: Customize this setup function for your app
        // Example: Reset app to initial state
        await callScreenshotHook(page, 'reset');
      },
      waitFor: 1000
    },
    {
      name: '2_conversion',
      description: 'Image conversion interface',
      setup: async (page) => {
        // TODO: Customize this setup function for your app
        // Example: Load sample data and navigate to conversion screen
        await callScreenshotHook(page, 'reset');
        // await page.click('[data-testid="convert-button"]');
      },
      waitFor: 1000
    },
    {
      name: '3_history',
      description: 'Conversion history',
      setup: async (page) => {
        // TODO: Customize this setup function for your app
        // Example: Seed history data
        await callScreenshotHook(page, 'reset');
        // await callScreenshotHook(page, 'seedHistory', [...]);
      },
      waitFor: 500
    }
  ],

  // ============================================================================
  // LANGUAGE SWITCHER - Customize for your i18n implementation
  // ============================================================================

  switchLanguage: async (page, lang) => {
    // Map App Store language codes to your i18n locale codes
    const langMap = {
      'en-US': 'en',
      'zh-Hans': 'zh-CN'
      // Add more languages as needed
    };

    const i18nLang = langMap[lang] || 'en';

    try {
      // Option 1: Prefer stable UI selector (e.g., language dropdown)
      const languageSelect = page.locator('[data-testid="language-select"]');
      if (await languageSelect.count()) {
        await page.selectOption('[data-testid="language-select"]', i18nLang);
      } else {
        // Option 2: Fallback to screenshot-mode hook
        await page.evaluate(async (locale) => {
          const api = window.__piconvScreenshot;
          if (api && typeof api.setLanguage === 'function') {
            await api.setLanguage(locale);
          }
        }, i18nLang);
      }

      // Wait for UI to update
      await page.waitForTimeout(1000);
    } catch (error) {
      console.warn(`Failed to switch language to ${lang}:`, error.message);
    }
  }
};

async function callScreenshotHook(page, method, ...args) {
  return page.evaluate(
    ({ methodName, methodArgs }) => {
      const api = window.__piconvScreenshot;
      if (!api || typeof api[methodName] !== 'function') return false;
      return api[methodName](...methodArgs);
    },
    { methodName: method, methodArgs: args }
  );
}

async function captureScreenshots() {
  console.log('\n=== macOS Electron Screenshot Generator ===\n');
  console.log(`App: ${config.appPath}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`Languages: ${config.languages.join(', ')}`);
  console.log(`Window: ${config.windowSize.width}x${config.windowSize.height}`);
  console.log(`Device scale factor: ${config.deviceScaleFactor}`);
  console.log(`Capture mode: ${config.captureMode}`);
  console.log(`Mode: ${config.mode}`);
  if (config.outputSize) {
    console.log(`Output size: ${config.outputSize.width}x${config.outputSize.height}`);
  }
  console.log(`Screenshots: ${config.screenshots.length}\n`);

  // Ensure output directories exist
  for (const lang of config.languages) {
    const langDir = path.join(config.outputDir, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`Created directory: ${langDir}`);
    }
  }

  console.log('\nLaunching Electron app...');

  // Enable screenshot-mode hooks in the app (adds `?screenshot=1` to the renderer URL).
  process.env.PICONV_SCREENSHOT = process.env.PICONV_SCREENSHOT || '1';
  if (config.captureMode === 'window') {
    // Make the app use a native titlebar while screenshots are being generated.
    process.env.PICONV_SCREENSHOT_NATIVE_TITLEBAR = process.env.PICONV_SCREENSHOT_NATIVE_TITLEBAR || '1';
  }

  // Launch Electron app
  const app = await electron.launch({
    args: [`--force-device-scale-factor=${config.deviceScaleFactor}`, config.appPath],
    timeout: 30000
  });

  const page = await app.firstWindow();

  if (config.captureMode === 'window') {
    if (!isMacOS()) {
      throw new Error('PICONV_SCREENSHOT_CAPTURE_MODE=window is only supported on macOS');
    }
    // Match the app's normal BrowserWindow bounds (includes titlebar area).
    await bringElectronWindowToFront(app, config.windowSize);
    console.log(`✓ Window bounds set\n`);
  } else {
    // Content-only screenshots: use viewport size (CSS pixels).
    await page.setViewportSize(config.windowSize);
    console.log(`✓ Viewport size set\n`);
  }

  // Wait for app to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  console.log('✓ App loaded\n');

  let windowId = null;
  let didWarnActivate = false;
  if (config.captureMode === 'window') {
    const pid = app.process().pid;
    if (config.activateOnMacOS) {
      const ok = activateMacOSProcess(pid);
      if (!ok && !didWarnActivate) {
        didWarnActivate = true;
        console.warn(
          'WARN: Failed to activate window via AppleScript; traffic lights may appear gray. ' +
            'Grant Terminal/Node "Accessibility" permission or set PICONV_SCREENSHOT_ACTIVATE=0.'
        );
      }
    }
    windowId = getMacOSWindowIdByPid(pid);
    console.log(`✓ macOS window id: ${windowId}\n`);
  }

  if (config.mode === 'interactive') {
    const langKeyToLang = { a: 'en-US', b: 'zh-Hans' };

    const printHelp = () => {
      console.log('Interactive screenshot mode:');
      console.log('- Type `a1`..`a3` for en-US screenshots 1..3');
      console.log('- Type `b1`..`b3` for zh-Hans screenshots 1..3');
      console.log('- Type `help` to show this message, `q` to quit');
      console.log('');
      console.log('Notes:');
      console.log('- Manually operate the UI before each capture.');
      console.log(`- Auto language switch: ${config.interactiveAutoSwitch ? 'ON' : 'OFF'} (set PICONV_SCREENSHOT_INTERACTIVE_AUTOSWITCH=0 to disable)`);
      console.log('');
    };

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let pending = Promise.resolve();
    let isClosing = false;

    const close = async () => {
      if (isClosing) return;
      isClosing = true;
      try {
        await app.close();
      } finally {
        rl.close();
      }
    };

    process.on('SIGINT', () => {
      close().catch(() => process.exit(1));
    });

    printHelp();
    console.log('Ready. Enter a command (e.g. a1) and press Enter.\n');
    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', (line) => {
      pending = pending.then(async () => {
        const cmd = String(line || '').trim().toLowerCase();
        try {
          if (!cmd) return;
          if (cmd === 'help' || cmd === '?' || cmd === 'h') {
            printHelp();
            return;
          }
          if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') {
            await close();
            return;
          }

        const match = cmd.match(/^([ab])(\d+)$/);
        if (!match) {
          console.log(`Unknown command: ${cmd} (try "help")`);
          return;
        }

          const lang = langKeyToLang[match[1]];
          const shotIndex = Number(match[2]) - 1;
          const shot = config.screenshots[shotIndex];
          if (!shot) {
            console.log(`Unknown screenshot index: ${shotIndex + 1} (available 1..${config.screenshots.length})`);
            return;
          }

          console.log(`Capturing ${lang} → ${shot.name}...`);

          if (config.interactiveAutoSwitch && config.switchLanguage) {
            try {
              await Promise.race([
                config.switchLanguage(page, lang),
                page.waitForTimeout(4000).then(() => {
                  throw new Error('language switch timeout');
                })
              ]);
            } catch (e) {
              console.warn(`WARN: Language auto-switch failed (${e.message}); capture continues.`);
            }
          }

          const outputPath = path.join(config.outputDir, lang, `${shot.name}.png`);
          if (config.captureMode === 'window') {
            await bringElectronWindowToFront(app, config.windowSize);
            if (config.activateOnMacOS) {
              const ok = activateMacOSProcess(app.process().pid);
              if (!ok && !didWarnActivate) {
                didWarnActivate = true;
                console.warn(
                  'WARN: Failed to activate window via AppleScript; traffic lights may appear gray. ' +
                    'Grant Terminal/Node "Accessibility" permission or set PICONV_SCREENSHOT_ACTIVATE=0.'
                );
              }
            }
            await page.waitForTimeout(250);
            captureMacOSWindowToFile(windowId, outputPath);
          } else {
            await page.screenshot({ path: outputPath, fullPage: false });
          }

          resizeImageIfNeeded(outputPath, config.outputSize);
          console.log(`  ✓ Saved to ${outputPath}\n`);
        } finally {
          if (!isClosing) rl.prompt();
        }
      });
    });

    await new Promise((resolve) => rl.on('close', resolve));
    console.log('\n=== Screenshot capture complete ===\n');
    return;
  }

  // Capture screenshots for each language
  for (const lang of config.languages) {
    console.log(`--- Capturing ${lang} ---`);

    // Switch language
    if (config.switchLanguage) {
      console.log(`Switching to ${lang}...`);
      await config.switchLanguage(page, lang);
    }

    // Capture each screenshot
    for (const shot of config.screenshots) {
      try {
        console.log(`  Capturing: ${shot.name} (${shot.description})`);

        // Run setup if provided
        if (shot.setup) {
          await shot.setup(page);
        }

        // Wait if specified
        if (shot.waitFor) {
          if (typeof shot.waitFor === 'string') {
            await page.waitForSelector(shot.waitFor);
          } else {
            await page.waitForTimeout(shot.waitFor);
          }
        }

        // Capture screenshot
        const outputPath = path.join(config.outputDir, lang, `${shot.name}.png`);
        if (config.captureMode === 'window') {
          // Give the compositor a moment to paint after interactions.
          await bringElectronWindowToFront(app, config.windowSize);
          if (config.activateOnMacOS) {
            const ok = activateMacOSProcess(app.process().pid);
            if (!ok && !didWarnActivate) {
              didWarnActivate = true;
              console.warn(
                'WARN: Failed to activate window via AppleScript; traffic lights may appear gray. ' +
                  'Grant Terminal/Node "Accessibility" permission or set PICONV_SCREENSHOT_ACTIVATE=0.'
              );
            }
          }
          await page.waitForTimeout(350);
          captureMacOSWindowToFile(windowId, outputPath);
        } else {
          await page.screenshot({
            path: outputPath,
            fullPage: false
          });
        }

        // Optional post-resize (for App Store Connect / frameit expectations).
        resizeImageIfNeeded(outputPath, config.outputSize);

        console.log(`    ✓ Saved to ${outputPath}`);
      } catch (error) {
        console.error(`    ✗ Failed: ${error.message}`);
      }
    }

    console.log('');
  }

  // Close app
  console.log('Closing app...');
  await app.close();

  console.log('\n=== Screenshot capture complete ===\n');
  console.log('Next steps:');
  console.log('1. Review screenshots in', config.outputDir);
  console.log('2. Frame screenshots:');
  console.log('   fastlane mac frame');
  console.log('3. Upload to App Store Connect:');
  console.log('   fastlane mac upload');
  console.log('');
}

// Run
if (require.main === module) {
  captureScreenshots().catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { captureScreenshots };
