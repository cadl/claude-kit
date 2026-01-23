# macOS Electron App Screenshot & Distribution Guide

Complete guide for integrating fastlane with macOS Electron applications, based on the piconv project implementation.

## Overview

This guide covers advanced screenshot automation and App Store Connect integration for Electron apps on macOS, including:
- Native window capture with titlebar and traffic lights
- Interactive and automated screenshot modes
- Multi-language screenshot generation
- Custom frameit integration with drop shadows
- Build number management

## Prerequisites

```bash
# Install dependencies
gem install fastlane
brew install imagemagick
npm install -D playwright

# Ensure your Electron app is built
npm run build
```

## Screenshot Capture Modes

Electron apps have two distinct screenshot capture approaches:

### Content-Only Mode (Default for Web Apps)

Captures only the web contents using Playwright's screenshot API.

**Pros:**
- Fast and reliable
- No special macOS permissions required
- Works cross-platform

**Cons:**
- Doesn't show macOS window chrome
- Missing native titlebar and traffic lights
- Less authentic for macOS App Store

**Usage:**
```bash
PICONV_SCREENSHOT_CAPTURE_MODE=content node scripts/screenshot.js
```

### Window Mode (Recommended for macOS)

Captures the entire native macOS window including titlebar, traffic lights, and shadows.

**Pros:**
- Shows authentic macOS window appearance
- Includes colored traffic lights (if window is active)
- More professional App Store screenshots

**Cons:**
- Requires Screen Recording permission
- macOS only
- Slightly more complex setup

**Usage:**
```bash
PICONV_SCREENSHOT_CAPTURE_MODE=window fastlane mac screenshots
```

**How it works:**
1. Get the Electron process PID
2. Use Swift script to find the window ID from PID
3. Use `screencapture -l <windowId>` to capture specific window
4. Optionally activate window via AppleScript for colored traffic lights

## Screenshot Script Architecture

### Project Structure

```
project/
├── scripts/
│   ├── screenshot.js              # Main Playwright screenshot script
│   └── macos-window-id.swift      # Helper to get window ID from PID
├── fastlane/
│   ├── Fastfile                   # Lane definitions
│   └── screenshots/
│       ├── en-US/
│       │   ├── 1_main.png
│       │   ├── 2_conversion.png
│       │   └── 3_history.png
│       └── zh-Hans/
│           └── (same files)
```

### Swift Window ID Helper

`scripts/macos-window-id.swift` finds the window ID for a given process:

```swift
#!/usr/bin/env swift
import Foundation
import CoreGraphics

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: macos-window-id.swift <pid>\n", stderr)
    exit(1)
}

let pid = Int(CommandLine.arguments[1]) ?? 0
let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

// Find windows for this PID, on layer 0, with positive alpha
var windows: [(id: Int, area: Int)] = []
for window in windowList {
    if let windowPID = window[kCGWindowLayer as String] as? Int,
       windowPID == 0,
       let ownerPID = window[kCGWindowOwnerPID as String] as? Int,
       ownerPID == pid,
       let alpha = window[kCGWindowAlpha as String] as? Double,
       alpha > 0,
       let bounds = window[kCGWindowBounds as String] as? [String: Int],
       let width = bounds["Width"], let height = bounds["Height"],
       let windowID = window[kCGWindowNumber as String] as? Int {
        windows.append((id: windowID, area: width * height))
    }
}

// Return largest window by area
if let largest = windows.max(by: { $0.area < $1.area }) {
    print(largest.id)
} else {
    fputs("No window found for PID \(pid)\n", stderr)
    exit(1)
}
```

## Interactive Screenshot Mode

Interactive mode is ideal for Electron apps where UI states are complex or require manual setup.

### How It Works

1. Launch your Electron app in a paused state
2. Manually operate the UI to reach desired state
3. Type a command (e.g., `a1`) to capture the screenshot
4. Repeat for each screenshot

### Command System

| Command | Language | Screenshot | Output File |
|---------|----------|------------|-------------|
| `a1` | en-US | Screenshot 1 | `en-US/1_main.png` |
| `a2` | en-US | Screenshot 2 | `en-US/2_conversion.png` |
| `a3` | en-US | Screenshot 3 | `en-US/3_history.png` |
| `b1` | zh-Hans | Screenshot 1 | `zh-Hans/1_main.png` |
| `b2` | zh-Hans | Screenshot 2 | `zh-Hans/2_conversion.png` |
| `b3` | zh-Hans | Screenshot 3 | `zh-Hans/3_history.png` |

**Example session:**

```
$ PICONV_SCREENSHOT_CAPTURE_MODE=window fastlane mac screenshots

Interactive screenshot mode:
- Type `a1`..`a3` for en-US screenshots 1..3
- Type `b1`..`b3` for zh-Hans screenshots 1..3
- Type `help` to show this message, `q` to quit

Ready. Enter a command (e.g. a1) and press Enter.

> a1
Capturing en-US → 1_main...
  ✓ Saved to /path/to/fastlane/screenshots/en-US/1_main.png

> [manually navigate to next UI state]
> a2
Capturing en-US → 2_conversion...
  ✓ Saved to /path/to/fastlane/screenshots/en-US/2_conversion.png

> q
```

### Automatic Language Switching

By default, interactive mode auto-switches the app language before each capture:
- `a*` commands → switches to `en`
- `b*` commands → switches to `zh-CN`

**How it works:**
1. Tries to use `data-testid="language-select"` dropdown if available
2. Falls back to `window.__piconvScreenshot.setLanguage()` hook
3. Waits 1 second for UI to update

**Disable auto-switching:**
```bash
PICONV_SCREENSHOT_INTERACTIVE_AUTOSWITCH=0 fastlane mac screenshots
```

## Automated Screenshot Mode

For repeatable screenshot workflows, use automated mode.

### Configuration

In `scripts/screenshot.js`:

```javascript
const config = {
  mode: 'auto',  // or read from env
  screenshots: [
    {
      name: '1_main',
      description: 'Main window with dropzone',
      setup: async (page) => {
        // Reset app state
        await callScreenshotHook(page, 'reset');
      },
      waitFor: 1000
    },
    {
      name: '2_conversion',
      description: 'Image conversion interface',
      setup: async (page) => {
        await callScreenshotHook(page, 'reset');
        await callScreenshotHook(page, 'setOutputDir', '/Users/cadl/Downloads');

        const sampleImage = path.resolve(__dirname, '..', 'resources', 'icon.png');
        await page.setInputFiles('[data-testid="dropzone-input"]', sampleImage);
        await page.locator('[data-testid="convert-button"]').waitFor({ timeout: 10_000 });
      },
      waitFor: 1000
    }
  ]
};
```

### App Screenshot Hooks

Expose hooks in your renderer to control app state:

```javascript
// In your renderer process (when ?screenshot=1 query param is present)
window.__piconvScreenshot = {
  reset: () => {
    // Reset app to initial state
  },
  setOutputDir: (dir) => {
    // Set output directory
  },
  setLanguage: async (locale) => {
    // Switch i18next language
    await i18n.changeLanguage(locale);
  },
  seedHistory: (items) => {
    // Add fake history items for screenshot
  }
};
```

## Environment Variables Reference

### Screenshot Generation

| Variable | Default | Description |
|----------|---------|-------------|
| `PICONV_SCREENSHOT` | `1` | Enable screenshot mode in the app |
| `PICONV_SCREENSHOT_MODE` | `interactive` | `interactive` or `auto` |
| `PICONV_SCREENSHOT_CAPTURE_MODE` | `window` | `window` or `content` |
| `PICONV_SCREENSHOT_WINDOW_SIZE` | `900x670` | Window size in CSS pixels |
| `PICONV_SCREENSHOT_DEVICE_SCALE_FACTOR` | `2` | Device pixel ratio |
| `PICONV_SCREENSHOT_OUTPUT_SIZE` | (none) | Post-resize screenshot file (e.g., `2880x1800`) |
| `PICONV_SCREENSHOT_NATIVE_TITLEBAR` | `1` | Force native titlebar in screenshot mode |
| `PICONV_SCREENSHOT_ACTIVATE` | `1` | Try to activate window for colored traffic lights |
| `PICONV_SCREENSHOT_INTERACTIVE_AUTOSWITCH` | `1` | Auto-switch language in interactive mode |

### Frameit (Frame Lane)

| Variable | Default | Description |
|----------|---------|-------------|
| `PICONV_FRAME_OUTPUT_SIZE` | `2880x1800` | Target output size (must be 16:10) |
| `PICONV_FRAME_FINAL_SIZE` | (none) | Optional resize after framing |
| `PICONV_FRAME_SHADOW` | `1` | Enable drop shadow |
| `PICONV_FRAME_SHADOW_OPACITY` | `35` | Shadow opacity (0-100) |
| `PICONV_FRAME_SHADOW_SIGMA` | `18` | Shadow blur radius |
| `PICONV_FRAME_SHADOW_OFFSET_X` | `0` | Shadow horizontal offset |
| `PICONV_FRAME_SHADOW_OFFSET_Y` | `24` | Shadow vertical offset |
| `PICONV_FRAME_KEEP_STAGING` | `0` | Keep staging directory for debugging |

### Build

| Variable | Default | Description |
|----------|---------|-------------|
| `PICONV_BUNDLE_VERSION_PREFIX` | `1.0` | CFBundleVersion prefix (e.g., `1.0.N`) |

## Window Size Strategy

**Challenge:** App Store Connect requires 16:10 aspect ratio screenshots (e.g., 2880x1800), but capturing the app at that size makes UI elements look tiny.

**Solution:** Capture at comfortable window size, then render onto 16:10 background during framing.

### Recommended Workflow

1. **Capture** at app's natural window size:
   ```bash
   # Default: 900x670 (matches your development window)
   PICONV_SCREENSHOT_WINDOW_SIZE=900x670 \
   PICONV_SCREENSHOT_DEVICE_SCALE_FACTOR=2 \
   node scripts/screenshot.js
   ```

2. **Frame** onto 16:10 background:
   ```bash
   # Renders onto 2880x1800 background with padding
   PICONV_FRAME_OUTPUT_SIZE=2880x1800 fastlane mac frame
   ```

3. **Optionally resize** to smaller accepted size:
   ```bash
   # Final output: 1440x900
   PICONV_FRAME_OUTPUT_SIZE=2880x1800 \
   PICONV_FRAME_FINAL_SIZE=1440x900 \
   fastlane mac frame
   ```

### Alternative: Capture at Target Size

For pixel-perfect control, capture directly at 16:10:

```bash
PICONV_SCREENSHOT_WINDOW_SIZE=1440x900 \
PICONV_SCREENSHOT_DEVICE_SCALE_FACTOR=2 \
PICONV_SCREENSHOT_OUTPUT_SIZE=2880x1800 \
node scripts/screenshot.js
```

**Trade-off:** UI elements will look smaller during capture.

## Traffic Light Colors

macOS shows colored traffic lights only when a window is frontmost and active.

### Automatic Activation

The screenshot script attempts to activate the window via AppleScript:

```bash
osascript -e 'tell application "System Events" to set frontmost of (first process whose unix id is <pid>) to true'
```

**Requirements:**
- Terminal (or Node.js) must have Accessibility permission
- System Preferences → Security & Privacy → Privacy → Accessibility

### Disable Activation

If you don't want to grant Accessibility permission (traffic lights will be gray):

```bash
PICONV_SCREENSHOT_ACTIVATE=0 node scripts/screenshot.js
```

## Language Configuration

### App Store Language Codes

In `fastlane/screenshots/`:
- `en-US/` - English (United States)
- `zh-Hans/` - Chinese Simplified

### i18next Locale Mapping

Map App Store codes to your i18n locale codes:

```javascript
const langMap = {
  'en-US': 'en',
  'zh-Hans': 'zh-CN'
};
```

## Common Workflows

### Generate Screenshots Interactively

```bash
# Window mode with interactive commands
PICONV_SCREENSHOT_CAPTURE_MODE=window fastlane mac screenshots

# Then follow prompts to capture each screenshot
```

### Generate Screenshots Automatically

```bash
# Auto mode (requires setup functions in screenshot.js)
PICONV_SCREENSHOT_MODE=auto \
PICONV_SCREENSHOT_CAPTURE_MODE=window \
node scripts/screenshot.js
```

### Frame with Drop Shadow

```bash
# Default shadow settings
fastlane mac frame

# Custom shadow
PICONV_FRAME_SHADOW_OPACITY=50 \
PICONV_FRAME_SHADOW_SIGMA=24 \
PICONV_FRAME_SHADOW_OFFSET_Y=32 \
fastlane mac frame
```

### Build and Upload

```bash
# Build app with auto-incrementing build number
fastlane mac build

# Upload metadata and screenshots (not binary)
fastlane mac upload
```

### Full Release Workflow

```bash
# Screenshots → Frame → Upload
fastlane mac release
```

## Troubleshooting

### "Screen Recording permission required"

Window capture mode requires macOS Screen Recording permission.

**Fix:**
1. System Preferences → Security & Privacy → Privacy → Screen Recording
2. Add Terminal (or your Node.js executable)
3. Restart terminal

### Traffic lights are gray

The window isn't active/frontmost.

**Fixes:**
- Ensure `PICONV_SCREENSHOT_ACTIVATE=1` (default)
- Grant Accessibility permission to Terminal/Node
- Manually click the app window before capture (interactive mode)

### "Failed to get macOS window id"

The Swift script couldn't find a window for the Electron process.

**Checks:**
- App is actually running and visible
- Window is on screen (not minimized)
- Process PID is correct

### Language doesn't switch

Auto-switching failed.

**Fixes:**
- Ensure `window.__piconvScreenshot.setLanguage()` is exposed
- Or add `data-testid="language-select"` dropdown to your UI
- Disable auto-switch and manually switch: `PICONV_SCREENSHOT_INTERACTIVE_AUTOSWITCH=0`

### Screenshot is wrong size

Check your size configuration:

```bash
# For frameit to work, raw screenshots can be any size
# Frameit will scale them to fit PICONV_FRAME_OUTPUT_SIZE

# If you want specific output size from screenshot.js:
PICONV_SCREENSHOT_OUTPUT_SIZE=2880x1800 node scripts/screenshot.js
```

## Advanced: Custom Screenshot States

### Add More Screenshots

In `scripts/screenshot.js`:

```javascript
config.screenshots = [
  // ... existing
  {
    name: '4_settings',
    description: 'Settings panel',
    setup: async (page) => {
      await page.click('[data-testid="settings-button"]');
      await page.waitForSelector('[data-testid="settings-panel"]');
    },
    waitFor: 500
  }
];
```

Then add captions in `fastlane/screenshots/en-US/title.strings`:

```
"4_*" = "Customizable Settings";
```

### Seed Realistic Data

For screenshots with content (not empty states):

```javascript
setup: async (page) => {
  await callScreenshotHook(page, 'seedHistory', [
    {
      filesCount: 5,
      outputDir: '/Users/user/Downloads',
      outputFiles: ['/path/to/sample1.png', '/path/to/sample2.png'],
      firstFileName: 'vacation.jpg'
    }
  ]);
}
```

## Best Practices

1. **Use window mode** for macOS App Store screenshots (shows native chrome)
2. **Capture at comfortable size**, render to 16:10 during framing
3. **Use interactive mode** for complex UI states
4. **Test both languages** before uploading
5. **Keep raw screenshots** in git, regenerate framed versions
6. **Document your commands** in FASTLANE_SETUP.md for teammates
7. **Use staging directory** to avoid overwriting raw screenshots

## Integration with Existing App

### Add Screenshot Mode Detection

In your main process:

```javascript
// Enable screenshot mode hooks
const isScreenshotMode = process.env.PICONV_SCREENSHOT === '1';

if (isScreenshotMode) {
  // Use native titlebar if requested
  const useNativeTitlebar = process.env.PICONV_SCREENSHOT_NATIVE_TITLEBAR === '1';

  mainWindow = new BrowserWindow({
    titleBarStyle: useNativeTitlebar ? 'default' : 'hiddenInset',
    // ... other options
  });

  // Append ?screenshot=1 to URL
  mainWindow.loadURL(`file://${htmlPath}?screenshot=1`);
}
```

### Add Screenshot Hooks in Renderer

```javascript
// Detect screenshot mode from URL
const urlParams = new URLSearchParams(window.location.search);
const isScreenshotMode = urlParams.get('screenshot') === '1';

if (isScreenshotMode) {
  window.__piconvScreenshot = {
    reset: () => { /* ... */ },
    setLanguage: async (locale) => { await i18n.changeLanguage(locale); },
    setOutputDir: (dir) => { /* ... */ },
    seedHistory: (items) => { /* ... */ }
  };
}
```

## Resources

- **Playwright Electron**: https://playwright.dev/docs/api/class-electron
- **screencapture man page**: `man screencapture`
- **App Store screenshot specs**: https://help.apple.com/app-store-connect/#/devd274dd925
- **Piconv example implementation**: `scripts/screenshot.js`, `fastlane/Fastfile`
