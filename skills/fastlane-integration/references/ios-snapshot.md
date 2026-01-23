# iOS/macOS Snapshot Guide

Complete guide for automated screenshot generation using fastlane snapshot for native iOS and macOS applications.

## Overview

Fastlane snapshot uses XCUITest to drive your app and automatically capture screenshots across multiple devices and languages.

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
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone SE (3rd generation)",
  "iPad Pro (12.9-inch) (6th generation)"
])

# Supported languages
languages([
  "en-US",
  "zh-Hans",
  "ja"
])

# Scheme name (must be your UI Test scheme)
scheme("YourAppUITests")

# Output directory
output_directory("./screenshots")

# Clear previous screenshots
clear_previous_screenshots(true)

# Stop after first error
stop_after_first_error(false)

# Reinstall app for each language
reinstall_app(true)

# Erase simulator before running
erase_simulator(true)
```

## Writing UI Tests

### Basic Structure

In your UI test file (e.g., `YourAppUITests.swift`):

```swift
import XCTest

class YourAppUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false

        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()
    }

    func testTakeScreenshots() throws {
        let app = XCUIApplication()

        // Screenshot 1: Main screen
        snapshot("01_MainScreen")

        // Screenshot 2: Navigate and capture
        app.buttons["Features"].tap()
        snapshot("02_Features")

        // Screenshot 3: Open a modal
        app.buttons["Settings"].tap()
        snapshot("03_Settings")

        // Screenshot 4: Fill a form
        let textField = app.textFields["Search"]
        textField.tap()
        textField.typeText("Example")
        snapshot("04_Search")
    }
}
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

### Generate All Screenshots

```bash
fastlane snapshot
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

### "Build failed" Error

Ensure your UI Test target builds successfully:

```bash
xcodebuild -scheme YourAppUITests -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build-for-testing
```

### Simulator Not Found

List available simulators:

```bash
xcrun simctl list devices
```

Update Snapfile with exact device names from the list.

### Screenshots Incomplete

Add waits before snapshots:

```swift
sleep(2)  // Simple wait
snapshot("screen")

// Or better: wait for specific element
app.buttons["Ready"].waitForExistence(timeout: 5)
snapshot("screen")
```

### Permission Dialogs Blocking

Handle interruptions explicitly:

```swift
addUIInterruptionMonitor(withDescription: "Location Dialog") { alert in
    alert.buttons["Allow While Using App"].tap()
    return true
}

// Trigger the monitor
app.tap()
```

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
