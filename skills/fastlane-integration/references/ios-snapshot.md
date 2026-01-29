# iOS/macOS Snapshot Guide

Complete guide for automated screenshot generation using fastlane snapshot for native iOS and macOS applications.

## Overview

Fastlane snapshot uses XCUITest to drive your app and automatically capture screenshots across multiple devices and languages.

**For complete iOS setup**, see `ios-native.md` for full workflow including API Key configuration, metadata management, and upload procedures.

## Setup

### 1. Create UI Test Target

In Xcode:
1. File → New → Target
2. Select "UI Testing Bundle"
3. Name it (e.g., "YourAppUITests")

### 2. Initialize Snapshot

```bash
cd fastlane
fastlane snapshot init
```

This creates a `Snapfile` with default configuration.

### 3. Configure Snapfile

Edit `fastlane/Snapfile`:

```ruby
# Supported devices
devices([
  "iPhone 17 Pro Max",      # 6.9" display (App Store required)
  "iPhone 17 Pro",          # 6.1" display
  "iPad Pro 13-inch (M4)"   # 13" iPad display (App Store required)
])

# Disable concurrent simulators (prevents multiple windows)
concurrent_simulators(false)

# Supported languages
languages([
  "en-US",
  "zh-Hans",
  "ja"
])

# Scheme name (IMPORTANT: use main app scheme, NOT UITests target)
scheme("YourApp")  # Use main app scheme, not "YourAppUITests"

# Only run screenshot tests (skip performance tests)
only_testing([
  "YourAppUITests/YourAppUITests/testTakeScreenshots"
])

# Output directory
output_directory("./screenshots")

# Clear previous screenshots
clear_previous_screenshots(true)

# Override status bar (9:41, full battery, full signal)
override_status_bar(true)

# Stop after first error
stop_after_first_error(false)

# Reinstall app for each language
reinstall_app(true)

# Launch arguments for screenshot mode
launch_arguments(["-UITesting", "-ScreenshotMode"])

# Disable parallel testing (prevents simulator clones)
xcargs("-parallel-testing-enabled NO")
```

### Configuration Tips

**Device Selection**:
- Use latest iOS simulators for best compatibility
- Include both iPhone and iPad for App Store requirements
- Update device names when new iOS versions release

**Scheme Name**:
⚠️ **Critical**: Use your **main app scheme** (e.g., `YourApp`), **NOT** the UITests target name (e.g., `YourAppUITests`). This is a common mistake!

**Preventing Simulator Issues**:
- `concurrent_simulators(false)`: Prevents multiple simulator windows
- `xcargs("-parallel-testing-enabled NO")`: Avoids creating simulator clones

**Selective Test Running**:
Use `only_testing` to run specific tests:
```ruby
only_testing([
  "YourAppUITests/YourAppUITests/testTakeScreenshots"
])
```
Format: `[Target]/[Class]/[Method]`

**Launch Arguments**:
Pass flags to detect screenshot mode in your app:
```ruby
launch_arguments(["-UITesting", "-ScreenshotMode"])
```

In your app code:
```swift
if CommandLine.arguments.contains("-UITesting") {
    // Skip onboarding, disable analytics, etc.
}
```

## Writing UI Tests

### Basic Structure

In your UI test file (e.g., `YourAppUITests.swift`):

```swift
import XCTest

final class YourAppUITests: XCTestCase {

    var app: XCUIApplication!

    @MainActor
    override func setUpWithError() throws {
        continueAfterFailure = false

        // Explicitly specify bundle identifier (avoids launching wrong app)
        app = XCUIApplication(bundleIdentifier: "com.yourcompany.yourapp")
        setupSnapshot(app)
        app.launch()

        // Wait for app to fully load
        Thread.sleep(forTimeInterval: 2)
    }

    override func tearDownWithError() throws {
        app = nil
    }

    @MainActor
    func testTakeScreenshots() throws {
        // Screenshot 1: Main screen
        let startButton = app.buttons["start_button"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 5))

        Thread.sleep(forTimeInterval: 1)  // Wait for animations
        snapshot("01_MainScreen")

        // Screenshot 2: Navigate and capture
        app.buttons["features_button"].tap()
        Thread.sleep(forTimeInterval: 1)
        snapshot("02_Features")

        // Screenshot 3: Settings screen
        app.buttons["settings_button"].tap()
        Thread.sleep(forTimeInterval: 1)
        snapshot("03_Settings")
    }
}
```

### Modern Best Practices (Swift 6+)

**Use `@MainActor`**: Required for UI operations in Swift 6+
```swift
@MainActor
override func setUpWithError() throws { ... }

@MainActor
func testTakeScreenshots() throws { ... }
```

**Specify Bundle Identifier**: Prevents launching wrong app
```swift
app = XCUIApplication(bundleIdentifier: "com.yourcompany.yourapp")
```

**Use Instance Variable**: Store app reference
```swift
var app: XCUIApplication!
```

### Key Functions

- `setupSnapshot(app)` - Initialize snapshot helper
- `snapshot("name")` - Capture a screenshot with given name

### Best Practices

1. **Naming Convention**: Use numeric prefixes for ordering (01_, 02_, etc.)
2. **Wait for Elements**: Ensure UI is ready before capturing
3. **Dismiss Dialogs**: Handle system permissions/alerts
4. **Consistent State**: Reset app state between screenshots

### Waiting for Elements

```swift
// Wait for element to exist
let element = app.buttons["MyButton"]
XCTAssertTrue(element.waitForExistence(timeout: 5))
snapshot("screen")

// Wait for element to be hittable
let button = app.buttons["Next"]
let exists = NSPredicate(format: "exists == true && isHittable == true")
expectation(for: exists, evaluatedWith: button, handler: nil)
waitForExpectations(timeout: 5, handler: nil)
snapshot("ready")
```

### Handling System Dialogs

```swift
override func setUpWithError() throws {
    continueAfterFailure = false

    let app = XCUIApplication()
    setupSnapshot(app)

    // Auto-accept system alerts
    addUIInterruptionMonitor(withDescription: "System Dialog") { alert in
        if alert.buttons["Allow"].exists {
            alert.buttons["Allow"].tap()
            return true
        }
        return false
    }

    app.launch()
}
```

## Multi-Language Support

Snapshot automatically runs your test for each language in the `Snapfile`.

### Using Localized Strings

Instead of hardcoded text:

```swift
// ❌ Bad: Hardcoded text
app.buttons["Settings"].tap()

// ✅ Good: Use accessibility identifiers
app.buttons["settings_button"].tap()
```

Set accessibility identifiers in your app:

```swift
// In your SwiftUI view
Button("Settings") {
    // ...
}
.accessibilityIdentifier("settings_button")

// In UIKit
button.accessibilityIdentifier = "settings_button"
```

## Running Snapshot

### Before Running

**Shutdown all simulators to prevent clone issues**:
```bash
xcrun simctl shutdown all
```

Or configure in Fastfile:
```ruby
lane :screenshots do
  sh("xcrun simctl shutdown all")
  snapshot
end
```

### Generate All Screenshots

```bash
fastlane snapshot
# or
fastlane ios screenshots
```

### Generate for Specific Device

```bash
fastlane snapshot --devices "iPhone 15 Pro"
```

### Generate for Specific Language

```bash
fastlane snapshot --languages "en-US"
```

## macOS Specific Notes

### Snapfile for macOS

```ruby
# No devices needed for macOS
devices([])

languages([
  "en-US",
  "zh-Hans"
])

scheme("YourMacAppUITests")

# macOS specific: Use destination instead
# In Fastfile:
lane :screenshots do
  snapshot(
    devices: [],
    languages: ["en-US", "zh-Hans"],
    scheme: "YourMacAppUITests",
    destination: "platform=macOS"
  )
end
```

### macOS Screenshot Requirements

- Aspect ratio: 16:10
- Accepted sizes:
  - 1280 x 800
  - 1440 x 900
  - 2880 x 1800
  - 2560 x 1600

Ensure your app window is sized appropriately before taking screenshots.

## Troubleshooting

**For complete troubleshooting guide, see `troubleshooting-ios.md`.**

### Common Quick Fixes

**Scheme not found**
```ruby
# Use main app scheme, not UITests target
scheme("YourApp")  # ✅ Correct
# scheme("YourAppUITests")  # ❌ Wrong
```

**Simulator clones being created**
```ruby
concurrent_simulators(false)
xcargs("-parallel-testing-enabled NO")
```

**Shutdown all simulators before running**
```bash
xcrun simctl shutdown all
fastlane ios screenshots
```

**SnapshotHelper.swift missing**

Add `SnapshotHelper.swift` to your UITests target in Xcode manually.

**Build failed**

Ensure UITest target builds:
```bash
xcodebuild -scheme YourApp -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' build-for-testing
```

**Simulator not found**

List available simulators:
```bash
xcrun simctl list devices
```

Update Snapfile with exact device names.

**Screenshots incomplete**

Add waits before snapshots:
```swift
app.buttons["Ready"].waitForExistence(timeout: 5)
Thread.sleep(forTimeInterval: 1)
snapshot("screen")
```

**Permission dialogs blocking**

Handle interruptions:
```swift
addUIInterruptionMonitor(withDescription: "System Dialog") { alert in
    if alert.buttons["Allow"].exists {
        alert.buttons["Allow"].tap()
        return true
    }
    return false
}
app.launch()
app.tap()  // Trigger the monitor
```

**See `troubleshooting-ios.md` for complete solutions.**

## Integration with Frameit

After snapshot generates screenshots:

```bash
# Navigate to fastlane directory
cd fastlane

# Frame all screenshots
fastlane frameit

# Or specify path
frameit screenshots --path ./screenshots
```

See `frameit-config.md` for frameit configuration details.

## Full Workflow Example

```ruby
# In Fastfile
lane :screenshots do
  snapshot                           # Generate screenshots
  frameit(path: "./screenshots")    # Add device frames/backgrounds
end

lane :release do
  screenshots                        # Generate and frame
  deliver(                          # Upload to App Store Connect
    skip_binary_upload: true,
    force: true
  )
end
```

Run with:

```bash
fastlane screenshots   # Just screenshots
fastlane release       # Full workflow
```
