---
name: fastlane-integration
description: Guide for integrating fastlane into iOS/macOS/Electron projects. Use when (1) Setting up fastlane for App Store/Play Store releases, (2) Automating screenshots with snapshot (native) or Playwright (Electron), (3) Beautifying screenshots with frameit (backgrounds + captions), (4) Managing app metadata and uploading to stores.
---

# Fastlane Integration

Comprehensive guide for integrating fastlane into your project to automate app store releases, screenshot generation, and metadata management.

## Workflow Decision Tree

**What type of project are you working with?**

**Native iOS app** → Use fastlane snapshot + deliver for complete App Store workflow
- **See references/ios-native.md for complete integration guide** ⭐
- Includes: API Key setup, screenshots, metadata, TestFlight
- Uses XCUITest for automated screenshots
- See references/ios-snapshot.md for snapshot-specific details
- See references/api-key-setup.md for authentication setup
- See references/troubleshooting-ios.md for common issues

**Native macOS app** → Use fastlane snapshot for screenshots + deliver for uploads
- See references/ios-snapshot.md for snapshot setup (macOS section)
- Fastlane natively supports XCUITest-based screenshots

**Electron macOS app** → Use Playwright + custom frameit for screenshots + deliver for uploads
- See references/macos-electron.md for complete guide
- Supports native window capture (titlebar + traffic lights)
- Interactive or automated screenshot modes
- Custom frameit integration with drop shadows
- Use scripts/screenshot_macos.js as template

**Electron/Web app (other platforms)** → Use Playwright for screenshots + deliver for uploads
- Use scripts/screenshot_electron.js as starting point
- Manually capture screenshots or adapt the Playwright script

**Android app** → Use fastlane screengrab + supply
- Create UI tests in Espresso
- Use screengrab for automated screenshots

## Quick Start for iOS Native Apps

**For complete iOS setup, see `references/ios-native.md`.**

### 1. Install fastlane
```bash
gem install fastlane
```

### 2. Initialize fastlane in your project
```bash
cd YourProject
fastlane init
```

### 3. Set up App Store Connect API Key
Create API Key in App Store Connect, then create `fastlane/.env`:
```bash
APP_STORE_CONNECT_KEY_ID=YOUR_KEY_ID
APP_STORE_CONNECT_ISSUER_ID=YOUR_ISSUER_ID
APP_STORE_CONNECT_TEAM_ID=YOUR_TEAM_ID
APP_STORE_CONNECT_API_KEY_PATH=./fastlane/AuthKey_YOUR_KEY_ID.p8
```

See `references/api-key-setup.md` for detailed setup.

### 4. Configure Snapfile for screenshots
```bash
cd fastlane
fastlane snapshot init
```

Edit `Snapfile` with your devices and languages. See example configuration in `references/ios-native.md`.

**⚠️ `launch_arguments` pitfall**: Each element in the array is a separate "argument set". Snapshot runs the full device × language matrix for **each set**. Use a single string for all arguments: `launch_arguments(["-flag1 -flag2 value"])`. Multiple elements are only for A/B testing different configurations. See `references/ios-snapshot.md` for details.

### 5. Create UI Tests for screenshots
Add accessibility identifiers to your views, write UITests. See `references/ios-native.md` for complete example.

### 6. Generate screenshots
```bash
fastlane ios screenshots
```

### 7. Upload to App Store Connect
```bash
# Upload screenshots
fastlane ios upload_screenshots

# Upload metadata
fastlane ios upload_metadata

# Upload both
fastlane ios upload
```

---

## Quick Start for Other Platforms

### 1. Install Dependencies

```bash
# Install fastlane
gem install fastlane

# Install ImageMagick (required for frameit)
brew install imagemagick

# For Electron projects, install Playwright
npm install -D playwright
```

### 2. Initialize Fastlane

Run the initialization script to set up your project:

```bash
bash .claude/skills/fastlane-integration/scripts/init_fastlane.sh
```

This will:
- Create the `fastlane/` directory structure
- Copy appropriate templates based on your project type
- Set up metadata folders for your supported languages

### 3. Configure Your App Information

Edit `fastlane/Appfile`:

```ruby
app_identifier("com.yourcompany.yourapp")  # Bundle identifier
apple_id("your@email.com")                  # Apple ID email

# For Mac App Store
app_identifier("com.yourcompany.yourapp")
```

## Screenshot Generation

### Native iOS/macOS Apps

Use fastlane snapshot with XCUITest. See references/ios-snapshot.md for complete setup guide.

Quick example:

```bash
# Generate screenshots
fastlane snapshot

# Frame with backgrounds/titles
fastlane frameit
```

### macOS Electron Apps (Recommended Approach)

For macOS Electron apps, use the advanced Playwright + native window capture approach. This captures authentic macOS screenshots with titlebar and traffic lights.

**See references/macos-electron.md for complete guide.**

#### Quick Start

1. **Copy helper scripts:**

```bash
# Copy Swift window ID helper
cp .claude/skills/fastlane-integration/scripts/macos-window-id.swift scripts/

# Copy screenshot script template
cp .claude/skills/fastlane-integration/scripts/screenshot_macos.js scripts/screenshot.js

# Make scripts executable
chmod +x scripts/macos-window-id.swift scripts/screenshot.js
```

2. **Customize config in scripts/screenshot.js:**

```javascript
const config = {
  appPath: path.resolve(__dirname, '..', 'out', 'main', 'index.js'),
  outputDir: path.resolve(__dirname, '..', 'fastlane', 'screenshots'),
  languages: ['en-US', 'zh-Hans'],
  // ... customize screenshot definitions ...
};
```

3. **Add screenshot hooks to your app:**

In your renderer process (when ?screenshot=1 query param is present):

```javascript
window.__piconvScreenshot = {
  reset: () => { /* Reset app to initial state */ },
  setLanguage: async (locale) => { await i18n.changeLanguage(locale); },
  // ... other hooks as needed ...
};
```

4. **Run screenshot capture:**

```bash
# Interactive mode (recommended for complex UI)
PICONV_SCREENSHOT_CAPTURE_MODE=window fastlane mac screenshots

# Automated mode (requires setup functions)
PICONV_SCREENSHOT_MODE=auto \
PICONV_SCREENSHOT_CAPTURE_MODE=window \
node scripts/screenshot.js
```

#### Screenshot Modes

**Window Mode** (Recommended for macOS)
- Captures entire native window including titlebar and traffic lights
- Requires Screen Recording permission
- Best for App Store screenshots

```bash
PICONV_SCREENSHOT_CAPTURE_MODE=window fastlane mac screenshots
```

**Content Mode** (Faster, cross-platform)
- Captures only web contents
- No special permissions required
- Doesn't show macOS chrome

```bash
PICONV_SCREENSHOT_CAPTURE_MODE=content node scripts/screenshot.js
```

#### Interactive Commands

In interactive mode, manually operate your UI and type commands to capture:

| Command | Language | Screenshot |
|---------|----------|------------|
| `a1`-`a3` | en-US | Screenshots 1-3 |
| `b1`-`b3` | zh-Hans | Screenshots 1-3 |
| `help` | - | Show help |
| `q` | - | Quit |

### Electron Apps (Generic)

Use the generic Playwright script template at scripts/screenshot_electron.js for non-macOS or simpler setups.

1. Copy and customize the script for your app
2. Run it to generate screenshots:

```bash
node scripts/screenshot.js
```

3. Frame the screenshots:

```bash
cd fastlane && fastlane frameit
```

## Screenshot Beautification with Frameit

Frameit adds backgrounds and captions to your screenshots. Unlike iOS device frames, macOS requires custom background images.

### Basic Setup

Create `fastlane/Framefile.json`:

```json
{
  "default": {
    "background": "./backgrounds/your_background.png",
    "title": {
      "font": "./fonts/YourFont.ttf",
      "color": "#FFFFFF",
      "fontSize": 48
    },
    "padding": 50,
    "title_below_image": false
  },
  "data": [
    {
      "filter": "1_*",
      "title": { "text": "Your Caption Here" }
    }
  ]
}
```

For detailed configuration options, see references/frameit-config.md.

### macOS Electron: Custom Editor with Drop Shadow

For macOS Electron apps, use the custom frameit editor approach (from piconv project) to:
- Scale any screenshot size onto 16:10 background
- Add drop shadows for depth
- Protect raw screenshots with staging directory

**See references/frameit-config.md for complete code examples.**

Quick usage:

```bash
# Frame with default shadow
fastlane mac frame

# Custom shadow settings
PICONV_FRAME_SHADOW_OPACITY=50 \
PICONV_FRAME_SHADOW_SIGMA=24 \
PICONV_FRAME_SHADOW_OFFSET_Y=32 \
fastlane mac frame

# No shadow
PICONV_FRAME_SHADOW=0 fastlane mac frame
```

**Key environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PICONV_FRAME_OUTPUT_SIZE` | `2880x1800` | Target output size (16:10) |
| `PICONV_FRAME_SHADOW` | `1` | Enable drop shadow |
| `PICONV_FRAME_SHADOW_OPACITY` | `35` | Shadow opacity (0-100) |
| `PICONV_FRAME_SHADOW_SIGMA` | `18` | Shadow blur radius |
| `PICONV_FRAME_SHADOW_OFFSET_Y` | `24` | Shadow vertical offset |

### Multi-Language Captions

Create `.strings` files for each language in your screenshots folder:

```
screenshots/
├── en-US/
│   ├── title.strings
│   ├── keyword.strings
│   └── 1_welcome.png
└── zh-Hans/
    ├── title.strings
    ├── keyword.strings
    └── 1_welcome.png
```

In `title.strings`:

```
"1_*" = "Welcome to the App";
"2_*" = "Powerful Features";
```

In `keyword.strings`:

```
"1_*" = "GET STARTED";
"2_*" = "FEATURES";
```

## Metadata Management

Metadata lives in `fastlane/metadata/` with this structure:

```
metadata/
├── copyright.txt
├── primary_category.txt
├── review_information/
│   ├── first_name.txt
│   ├── last_name.txt
│   └── email_address.txt
├── default/                    # Fallback for all languages
│   ├── description.txt
│   └── keywords.txt
├── en-US/
│   ├── name.txt
│   ├── description.txt
│   ├── keywords.txt
│   ├── release_notes.txt
│   └── promotional_text.txt
└── zh-Hans/
    ├── name.txt
    ├── description.txt
    └── ...
```

For complete field descriptions, see references/metadata-structure.md.

### Key Files

- **name.txt**: App name (30 chars max)
- **description.txt**: Full app description (4000 chars max)
- **keywords.txt**: Comma-separated keywords (100 chars max)
- **release_notes.txt**: What's new in this version (4000 chars max)
- **promotional_text.txt**: Marketing text (170 chars max)

## Upload to App Store Connect

### Setup Authentication

**Option 1: API Key** (Recommended)

```ruby
# In Fastfile
lane :upload do
  api_key = app_store_connect_api_key(
    key_id: "YOUR_KEY_ID",
    issuer_id: "YOUR_ISSUER_ID",
    key_filepath: "./AuthKey_XXXXX.p8"
  )

  deliver(
    api_key: api_key,
    skip_binary_upload: true
  )
end
```

**Option 2: Apple ID**

Fastlane will prompt for your Apple ID credentials.

### Upload Metadata and Screenshots

```bash
# Upload everything (metadata + screenshots)
fastlane upload

# Or manually
cd fastlane
fastlane deliver --skip_binary_upload
```

### Upload Options

- `skip_binary_upload: true` - Don't upload the app binary (metadata/screenshots only)
- `skip_metadata: true` - Don't upload metadata
- `skip_screenshots: true` - Don't upload screenshots
- `force: true` - Skip verification prompts

## Common Workflows

### Full Release Workflow

```ruby
# In Fastfile
lane :release do
  screenshots    # Generate screenshots
  frame          # Add backgrounds/captions
  upload         # Upload to App Store Connect
end
```

Run with:

```bash
fastlane release
```

### Update Screenshots Only

```bash
fastlane screenshots
fastlane frame
fastlane deliver --skip_metadata --skip_binary_upload
```

### Update Metadata Only

Edit files in `metadata/`, then:

```bash
fastlane deliver --skip_screenshots --skip_binary_upload
```

## Platform-Specific Notes

### macOS App Store

- Ensure you have a valid Mac App Store provisioning profile
- Screenshots must be 1280x800, 1440x900, or 2880x1800 (16:10 aspect ratio)
- Use `mas` build in your electron-builder or Xcode configuration

### iOS App Store

- Multiple device sizes required (iPhone, iPad)
- Use snapshot to generate all sizes automatically
- Screenshot sizes: https://help.apple.com/app-store-connect/#/devd274dd925

### Android Play Store

- Use `screengrab` instead of `snapshot`
- Use `supply` instead of `deliver`
- See fastlane Android documentation

## Troubleshooting

### Frameit: "ImageMagick not found"

Install ImageMagick:

```bash
brew install imagemagick
```

### Deliver: Authentication failed

Generate an App Store Connect API key:
1. Go to App Store Connect → Users and Access → Keys
2. Create a new API key with Developer role
3. Download the .p8 file and note the Key ID and Issuer ID

### Screenshots wrong size

Check Apple's requirements:
- macOS: 1280x800, 1440x900, 2880x1800
- iOS: https://help.apple.com/app-store-connect/#/devd274dd925

Ensure your Playwright script captures at the correct resolution.

## Resources

### Reference Guides

**iOS Native Apps**:
- `references/ios-native.md` - Complete iOS integration guide (API Key, screenshots, metadata, TestFlight)
- `references/api-key-setup.md` - App Store Connect API Key configuration
- `references/ios-snapshot.md` - Snapshot-specific configuration and best practices
- `references/troubleshooting-ios.md` - Common iOS issues and solutions

**Other Platforms**:
- `references/macos-electron.md` - Electron macOS apps
- `references/frameit-config.md` - Screenshot beautification
- `references/metadata-structure.md` - App Store metadata reference

**Scripts & Templates**:
- `scripts/` - Automation scripts
- `assets/templates/` - Fastfile, Appfile templates

## Next Steps

1. Run `init_fastlane.sh` to set up your project
2. Configure `Appfile` with your app details
3. Generate screenshots (snapshot or Playwright)
4. Configure `Framefile.json` for beautification
5. Fill in metadata files
6. Run `fastlane upload` to deploy
