# iOS Fastlane Troubleshooting Guide

Common issues and solutions when using fastlane snapshot with iOS native apps.

---

## Issue 1: Missing SnapshotHelper.swift

### Symptoms
```
Your Snapshot Helper file is missing
Please add a Snapshot Helper file to your project
```

### Cause
SnapshotHelper.swift was downloaded but not added to the Xcode project.

### Solution

SnapshotHelper.swift is automatically downloaded to your UITests directory when you run `fastlane snapshot init` or `fastlane snapshot`.

**You must manually add it to your Xcode project:**

1. Open Xcode project
2. Right-click `YourAppUITests` folder in project navigator
3. Select **"Add Files to 'YourApp'..."**
4. Navigate to and select `YourAppUITests/SnapshotHelper.swift`
5. Ensure `YourAppUITests` target is checked
6. Click **"Add"**

**Verify it worked**:
- Build your UITests target (⌘+U)
- If `setupSnapshot(app)` compiles without errors, it's working

**Alternative: Command line verification**
```bash
# Check if file exists
ls -la YourAppUITests/SnapshotHelper.swift

# Clean and rebuild
xcodebuild clean -project YourApp.xcodeproj -scheme YourApp
```

---

## Issue 2: Scheme Name Error

### Symptoms
```
Couldn't find specified scheme 'YourAppUITests'
Available schemes: YourApp
```

### Cause
The `scheme` parameter in Snapfile should be your **main app's scheme**, not the UITests target name.

### Solution

Edit `fastlane/Snapfile`:

```ruby
# ❌ Wrong - UITests target name
scheme("YourAppUITests")

# ✅ Correct - Main app scheme
scheme("YourApp")
```

**Find your scheme name**:
```bash
xcodebuild -list -project YourApp.xcodeproj
```

Output will show:
```
Schemes:
    YourApp           ← Use this
    YourAppTests
    YourAppUITests
```

---

## Issue 3: Simulator Clones Being Created

### Symptoms
```
Multiple simulator windows opening
Simulator names with "clone" suffix appearing
```

### Cause
Xcode's parallel testing feature creates simulator clones.

### Solution

Add these to `fastlane/Snapfile`:

```ruby
# Disable concurrent simulators
concurrent_simulators(false)

# Disable parallel testing
xcargs("-parallel-testing-enabled NO")
```

**Also run before snapshot**:
```ruby
# In Fastfile, before calling snapshot:
lane :screenshots do
  sh("xcrun simctl shutdown all")
  snapshot
end
```

---

## Issue 4: iOS Version Mismatch Warning

### Symptoms
```
Using device named 'iPhone 16 Pro Max' with version '18.5'
because no match was found for version '26.2'
```

### Cause
Project deployment target version is higher than simulator iOS version.

### Solution

This is a **warning, not an error**. Snapshot will automatically use the highest available iOS version.

**To fix the warning**:
1. Open project in Xcode
2. Select project → Target → General
3. Set "Minimum Deployments" to actual iOS version (e.g., `17.0`)

**Check available simulators**:
```bash
xcrun simctl list devices
```

---

## Issue 5: Cannot Find setupSnapshot Function

### Symptoms
```
Cannot find 'setupSnapshot' in scope
```

### Cause
SnapshotHelper.swift not added to UITest target in Xcode.

### Solution

Follow steps in **Issue 1** to add SnapshotHelper.swift to your project.

**Verify import**:
```swift
import XCTest
// No import needed for SnapshotHelper - it's in the same target
```

---

## Issue 6: Simulator Launch Failed

### Symptoms
```
Unable to launch simulator
Error Domain=NSPOSIXErrorDomain Code=60
```

### Solutions

**1. Check if simulator exists**
```bash
xcrun simctl list devices
```

**2. Reset all simulators**
```bash
xcrun simctl erase all
```

**3. Restart simulator service**
```bash
killall Simulator
open -a Simulator
```

**4. Shutdown all simulators before running**
```bash
xcrun simctl shutdown all
fastlane ios screenshots
```

**5. Clean Xcode cache**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

---

## Issue 7: Screenshots Not Generated

### Symptoms
Screenshot files not appearing in `screenshots/` directory.

### Solutions

**1. Check output directory in Snapfile**
```ruby
output_directory("./screenshots")
```

**2. Check test actually runs**
```bash
# View detailed logs
fastlane ios screenshots --verbose
```

**3. Verify test method name**
```swift
// Must start with "test" prefix
func testTakeScreenshots() throws {
    // ...
}
```

**4. Check only_testing filter**
```ruby
# In Snapfile
only_testing([
  "YourAppUITests/YourAppUITests/testTakeScreenshots"
])
```

Format: `[Target]/[Class]/[Method]`

---

## Issue 8: UI Element Not Found

### Symptoms
```
Failed to find element with identifier "start_game_button"
Test assertion failed: XCTAssertTrue failed
```

### Causes
- Missing `accessibilityIdentifier` in app code
- Typo in identifier
- Element not loaded yet

### Solutions

**1. Add accessibility identifier in app**

SwiftUI:
```swift
Button("Start Game") {
    startGame()
}
.accessibilityIdentifier("start_game_button")
```

UIKit:
```swift
button.accessibilityIdentifier = "start_game_button"
```

**2. Debug - Print all elements**
```swift
// In UITest
print(app.buttons.allElementsBoundByIndex.map { $0.identifier })
```

**3. Wait for element to exist**
```swift
let button = app.buttons["start_game_button"]
XCTAssertTrue(button.waitForExistence(timeout: 5))
button.tap()
```

**4. Check element type**
```swift
// If it's a Text, use staticTexts instead
app.staticTexts["Welcome"]

// If it's an Image
app.images["logo"]
```

---

## Issue 9: Screenshots Show Wrong Content

### Symptoms
Screenshots capture incorrect screens or UI states.

### Solutions

**1. Add waits for UI to settle**
```swift
snapshot("01_HomeScreen")
Thread.sleep(forTimeInterval: 1)  // Wait for animations
```

**2. Wait for specific elements**
```swift
let button = app.buttons["start_button"]
XCTAssertTrue(button.waitForExistence(timeout: 5))
snapshot("screen")
```

**3. Debug by running test in Xcode**
- Product → Test (⌘+U)
- Watch simulator to see what's happening
- Add breakpoints to debug navigation flow

**4. Check launch arguments**
In your app, detect screenshot mode:
```swift
// In app code
if CommandLine.arguments.contains("-UITesting") {
    // Skip onboarding, etc.
}
```

---

## Issue 10: Tests Run Too Slowly

### Symptoms
Screenshot generation takes more than 30 minutes.

### Causes
- Too many devices/languages
- Long wait times
- Inefficient test code

### Solutions

**1. Reduce devices for testing**
```ruby
# In Snapfile - test with one device first
devices([
  "iPhone 17 Pro Max"  # Just one device
])
```

**2. Reduce languages**
```ruby
languages(["en-US"])  # Just one language
```

**3. Optimize wait times**
```swift
// ❌ Bad - fixed wait
sleep(3)

// ✅ Good - wait only as long as needed
XCTAssertTrue(button.waitForExistence(timeout: 5))
```

**4. Run specific test only**
```ruby
# In Snapfile
only_testing([
  "YourAppUITests/YourAppUITests/testTakeScreenshots"
])
```

---

## Issue 11: Permission Dialogs Blocking Tests

### Symptoms
System permission dialogs (Location, Notifications, etc.) interfering with tests.

### Solution

**1. Handle interruptions**
```swift
override func setUpWithError() throws {
    continueAfterFailure = false

    let app = XCUIApplication(bundleIdentifier: "com.yourcompany.yourapp")
    setupSnapshot(app)

    // Auto-handle system alerts
    addUIInterruptionMonitor(withDescription: "System Dialog") { alert in
        if alert.buttons["Allow"].exists {
            alert.buttons["Allow"].tap()
            return true
        }
        if alert.buttons["Allow While Using App"].exists {
            alert.buttons["Allow While Using App"].tap()
            return true
        }
        return false
    }

    app.launch()
}
```

**2. Trigger the monitor**
After the dialog appears, tap somewhere to trigger the handler:
```swift
app.tap()  // Triggers interrupt monitors
```

**3. Pre-configure permissions**
Use launch arguments to skip permission dialogs:
```ruby
# In Snapfile
launch_arguments(["-UITesting -SkipPermissions"])
```

Then in your app:
```swift
if CommandLine.arguments.contains("-SkipPermissions") {
    // Don't request permissions
}
```

---

## Issue 12: Build Failed Error

### Symptoms
```
xcodebuild failed with exit code 65
Build failed
```

### Solutions

**1. Ensure UITests build successfully**
```bash
xcodebuild -scheme YourApp \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  build-for-testing
```

**2. Check for compile errors in UITests**
Open Xcode and build UITests target manually.

**3. Clean build folder**
```bash
xcodebuild clean -project YourApp.xcodeproj -scheme YourApp
```

**4. Reset simulator**
```bash
xcrun simctl erase all
```

---

## Issue 13: Authentication Failed

### Symptoms
```
Could not authenticate with App Store Connect
Invalid credentials
```

### Solutions

See `api-key-setup.md` for complete authentication troubleshooting.

**Quick checks**:
1. Verify `.env` file exists and contains correct values
2. Check API Key file exists: `ls fastlane/AuthKey_*.p8`
3. Verify API Key has correct permissions (App Manager or Admin)

---

## Issue 14: "No data" Error When Uploading

### Symptoms
```
Deliver encountered an error: No data
```

### Cause
This is a false error - metadata was actually uploaded successfully.

### Solution

Add error handling in Fastfile:
```ruby
lane :upload_metadata do
  api_key = app_store_connect_api_key(
    key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
    issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
    key_filepath: ENV["APP_STORE_CONNECT_API_KEY_PATH"]
  )

  begin
    deliver(
      api_key: api_key,
      skip_binary_upload: true,
      force: true
    )
  rescue => e
    if e.message.include?("No data")
      UI.important("Ignoring 'No data' error - metadata was uploaded successfully")
    else
      raise e
    end
  end
end
```

---

## Issue 15: iPad Screenshots Wrong Size

### Symptoms
```
Screenshot size is incorrect
Expected 2048x2732 but got 1024x1366
```

### Cause
Wrong simulator or simulator scale setting.

### Solutions

**1. Use correct iPad simulator**
```ruby
# In Snapfile
devices([
  "iPad Pro 13-inch (M4)",
  "iPad Pro 11-inch (M4)"
])
```

**2. Check simulator scale**
In Simulator app: Window → Physical Size (or ⌘+1)

**3. Verify screenshot size**
```bash
sips -g pixelWidth -g pixelHeight screenshots/en-US/*.png
```

**Required iPad sizes**:
- 12.9" iPad Pro: 2048 x 2732
- 11" iPad Pro: 1668 x 2388

---

## Issue 16: Duplicate Screenshots / 2x-4x Longer Runs

### Symptoms
- Snapshot runs take 2x–4x longer than expected
- Logs show the same files being copied multiple times per language
- Output shows repeated `FASTLANE_LANGUAGE=en-US` cycles before moving to next language
- Example: With 2 languages, you see 4 xcodebuild cycles instead of 2

### Root Cause

The `launch_arguments` parameter uses **array of argument sets** semantics, not array of arguments. Each element in the array is treated as a separate configuration. Snapshot generates screenshots for:

**Argument sets × Devices × Languages**

### Example of the Problem

```ruby
# ❌ Wrong: Creates 2 argument sets
launch_arguments(["-MOCK_HEALTHKIT", "true"])

# With 2 devices and 2 languages:
# 2 arg sets × 2 devices × 2 languages = 8 total runs
# But the 2nd set (just "true") overwrites the first!
```

You'll see in logs:
```
Copying 'iPhone 16 Pro Max-01_Overview.png'...  # First run (arg set 1)
Copying 'iPhone 16 Pro Max-01_Overview.png'...  # Second run (arg set 2) - overwriting!
```

### Solution

Combine all arguments into a **single string**:

```ruby
# ✅ Correct: 1 argument set
launch_arguments(["-MOCK_HEALTHKIT true"])

# With 2 devices and 2 languages:
# 1 arg set × 2 devices × 2 languages = 4 runs ✅
```

### Intentional Multi-Set Usage (A/B Testing)

Multiple elements are only useful for comparing different configurations:

```ruby
# Correct use case: Generate screenshots with different feature states
launch_arguments([
  "-FeatureXEnabled YES",
  "-FeatureXEnabled NO"
])
# This intentionally generates 2 complete sets for comparison
```

### How to Diagnose

**Count xcodebuild invocations** in the log:

```bash
# After running snapshot, check the log
grep "Running snapshot on:" ~/Library/Logs/snapshot/*.log | wc -l

# Expected: number_of_languages
# If you see 2x or 4x that number, check launch_arguments
```

**Check for duplicate "Copying" messages**:

```bash
grep "Copying.*\.png" ~/Library/Logs/snapshot/*.log | sort | uniq -c | sort -rn | head -20
```

If you see counts > 1, screenshots are being overwritten.

### Related

See `references/ios-snapshot.md` for detailed explanation of `launch_arguments` array semantics.

---

## Common Debugging Commands

```bash
# List available devices
xcrun simctl list devices

# List project schemes
xcodebuild -list -project YourApp.xcodeproj

# Clean build
xcodebuild clean -project YourApp.xcodeproj -scheme YourApp

# Manual UITest run
xcodebuild test \
  -project YourApp.xcodeproj \
  -scheme YourApp \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max'

# Check fastlane version
fastlane --version

# Update fastlane
fastlane update_fastlane

# Verbose output
fastlane ios screenshots --verbose

# Shutdown all simulators
xcrun simctl shutdown all

# Erase all simulators
xcrun simctl erase all
```

---

## Getting Help

1. Check `ios-native.md` for complete setup guide
2. Check `api-key-setup.md` for authentication issues
3. Fastlane Snapshot docs: https://docs.fastlane.tools/actions/snapshot/
4. Fastlane GitHub: https://github.com/fastlane/fastlane/issues
5. Run with `--verbose` flag for detailed logs

---

## Still Having Issues?

If none of these solutions work:

1. **Enable verbose logging**:
   ```bash
   fastlane ios screenshots --verbose
   ```

2. **Check fastlane logs**:
   ```bash
   tail -f ~/Library/Logs/snapshot/*.log
   ```

3. **Isolate the problem**:
   - Does UITest work in Xcode? (⌘+U)
   - Does build succeed? (`xcodebuild build-for-testing`)
   - Can you launch simulator manually?

4. **Create minimal reproduction**:
   - Test with single device
   - Test with single language
   - Simplify UITest to just one screenshot

5. **Report issue**:
   - Include full error message
   - Include Snapfile and Fastfile
   - Include fastlane version
   - Include Xcode version
