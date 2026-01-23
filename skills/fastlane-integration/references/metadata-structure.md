# App Store Metadata Structure

Complete reference for organizing app metadata for App Store Connect delivery.

## Directory Structure

```
fastlane/metadata/
├── app_icon.png                      # App icon (1024x1024)
├── copyright.txt                     # Copyright notice
├── primary_category.txt              # Primary app category
├── secondary_category.txt            # Secondary category (optional)
├── primary_first_sub_category.txt    # Subcategory (optional)
├── primary_second_sub_category.txt   # Subcategory (optional)
├── secondary_first_sub_category.txt  # Subcategory (optional)
├── secondary_second_sub_category.txt # Subcategory (optional)
│
├── review_information/               # Information for App Review team
│   ├── first_name.txt
│   ├── last_name.txt
│   ├── phone_number.txt
│   ├── email_address.txt
│   ├── demo_user.txt                # Demo account username (if needed)
│   ├── demo_password.txt            # Demo account password (if needed)
│   └── notes.txt                    # Additional notes for reviewers
│
├── default/                          # Default language (fallback)
│   ├── name.txt
│   ├── description.txt
│   ├── keywords.txt
│   ├── release_notes.txt
│   ├── promotional_text.txt
│   ├── marketing_url.txt
│   ├── privacy_url.txt
│   └── support_url.txt
│
├── en-US/                            # English (US)
│   ├── name.txt                     # App name (30 chars max)
│   ├── subtitle.txt                 # Subtitle (30 chars max, iOS 11+)
│   ├── description.txt              # Full description (4000 chars max)
│   ├── keywords.txt                 # Comma-separated keywords (100 chars max)
│   ├── release_notes.txt            # What's new (4000 chars max)
│   ├── promotional_text.txt         # Promotional text (170 chars max)
│   ├── marketing_url.txt            # Marketing website URL
│   ├── privacy_url.txt              # Privacy policy URL (required)
│   ├── support_url.txt              # Support website URL (required)
│   └── apple_tv_privacy_policy.txt  # Apple TV privacy policy (if applicable)
│
├── zh-Hans/                          # Chinese Simplified
│   └── [same files as en-US]
│
├── zh-Hant/                          # Chinese Traditional
│   └── [same files as en-US]
│
└── ja/                               # Japanese
    └── [same files as en-US]
```

## Language Codes

Fastlane uses App Store Connect language codes:

| Language | Code |
|----------|------|
| English (US) | en-US |
| English (UK) | en-GB |
| English (Australia) | en-AU |
| English (Canada) | en-CA |
| Chinese (Simplified) | zh-Hans |
| Chinese (Traditional) | zh-Hant |
| Japanese | ja |
| Korean | ko |
| French | fr-FR |
| German | de-DE |
| Spanish | es-ES |
| Spanish (Mexico) | es-MX |
| Italian | it |
| Portuguese | pt-BR |
| Portuguese (Portugal) | pt-PT |
| Russian | ru |
| Dutch | nl-NL |
| Arabic | ar-SA |
| Thai | th |
| Vietnamese | vi |
| Turkish | tr |
| Indonesian | id |
| Malay | ms |
| Polish | pl |
| Ukrainian | uk |
| Swedish | sv |
| Danish | da |
| Norwegian | no |
| Finnish | fi |
| Greek | el |
| Hebrew | he |
| Romanian | ro |
| Czech | cs |
| Slovak | sk |
| Croatian | hr |
| Catalan | ca |
| Hungarian | hu |

## Field Specifications

### name.txt
- **Max length**: 30 characters
- **Required**: Yes
- **Description**: App name displayed on the App Store

### subtitle.txt
- **Max length**: 30 characters
- **Required**: No
- **Description**: Short tagline (iOS 11+ only)

### description.txt
- **Max length**: 4000 characters
- **Required**: Yes
- **Description**: Full app description
- **Tips**:
  - Start with a compelling opening sentence
  - Use bullet points for features
  - Include use cases and benefits
  - End with a call to action

### keywords.txt
- **Max length**: 100 characters total
- **Required**: Yes
- **Format**: Comma-separated list
- **Tips**:
  - No spaces after commas (saves characters)
  - Avoid app name (already indexed)
  - Focus on functionality and alternatives
  - Use singular forms
- **Example**: `photo,editor,filter,collage,beauty,retouch`

### release_notes.txt
- **Max length**: 4000 characters
- **Required**: For new versions
- **Description**: What's new in this version
- **Tips**:
  - Be concise and user-friendly
  - Focus on user benefits, not technical details
  - Group related changes
- **Example**:
  ```
  What's New in Version 2.0:

  New Features:
  - Dark mode support
  - Batch processing for multiple files
  - Cloud sync with iCloud

  Improvements:
  - 2x faster conversion speed
  - Improved UI/UX design
  - Better error messages

  Bug Fixes:
  - Fixed crash on macOS Sonoma
  - Resolved memory leak issue
  ```

### promotional_text.txt
- **Max length**: 170 characters
- **Required**: No
- **Description**: Promotional text (can be updated without new version)
- **Tips**:
  - Highlight current promotions or features
  - Can be changed anytime without review
- **Example**: `Limited time offer: Get 50% off premium features! The easiest way to convert your images.`

### privacy_url.txt
- **Required**: Yes (as of 2021)
- **Format**: Full URL
- **Example**: `https://yourcompany.com/privacy`

### support_url.txt
- **Required**: Yes
- **Format**: Full URL
- **Example**: `https://yourcompany.com/support`

### marketing_url.txt
- **Required**: No
- **Format**: Full URL
- **Example**: `https://yourcompany.com/products/yourapp`

## App Categories

### primary_category.txt

Valid values:
- `BUSINESS`
- `DEVELOPER_TOOLS`
- `EDUCATION`
- `ENTERTAINMENT`
- `FINANCE`
- `FOOD_AND_DRINK`
- `GAMES`
- `GRAPHICS_AND_DESIGN`
- `HEALTH_AND_FITNESS`
- `LIFESTYLE`
- `MEDICAL`
- `MUSIC`
- `NEWS`
- `PHOTOGRAPHY`
- `PRODUCTIVITY`
- `REFERENCE`
- `SHOPPING`
- `SOCIAL_NETWORKING`
- `SPORTS`
- `TRAVEL`
- `UTILITIES`
- `WEATHER`

### Game Subcategories

If primary category is `GAMES`, use subcategories:
- `ACTION`
- `ADVENTURE`
- `ARCADE`
- `BOARD`
- `CARD`
- `CASINO`
- `DICE`
- `EDUCATIONAL`
- `FAMILY`
- `MUSIC`
- `PUZZLE`
- `RACING`
- `ROLE_PLAYING`
- `SIMULATION`
- `SPORTS`
- `STRATEGY`
- `TRIVIA`
- `WORD`

## Review Information

### review_information/first_name.txt & last_name.txt
Your contact name for the App Review team.

### review_information/phone_number.txt
Phone number in international format: `+1 555-123-4567`

### review_information/email_address.txt
Email address for App Review contact.

### review_information/demo_user.txt & demo_password.txt
**Only if your app requires login**: Provide test credentials for reviewers.

### review_information/notes.txt
Additional instructions for reviewers:
- How to test specific features
- Known issues that won't be fixed
- Explanation of complex workflows
- Regional restrictions

**Example**:
```
To test the conversion feature:
1. Drag and drop an image from the test_images folder (provided separately)
2. Select "PNG" as output format
3. Click "Convert"

Note: The batch conversion feature requires a premium license. Please use the provided test license key: TEST-1234-5678
```

## Default Fallback

The `default/` directory provides fallback values for languages you haven't localized yet.

**Example**: If you support 10 languages but only localize 3, the other 7 will use values from `default/`.

## Best Practices

1. **Start with default/**: Fill out default/ first, then copy to specific languages
2. **Consistent tone**: Maintain consistent tone across all languages
3. **Cultural adaptation**: Don't just translate; adapt for culture
4. **Character limits**: Different languages have different densities (e.g., Chinese uses fewer characters)
5. **Version control**: Keep metadata in git for change tracking
6. **Review before upload**: Always review on App Store Connect after delivery

## Creating Metadata Files

### Manually

```bash
cd fastlane/metadata

# Create language directory
mkdir -p en-US

# Create metadata files
echo "Your App Name" > en-US/name.txt
echo "Your keywords here" > en-US/keywords.txt
echo "Your full description..." > en-US/description.txt
# etc.
```

### Using init_fastlane.sh

The initialization script creates template files automatically:

```bash
bash .claude/skills/fastlane-integration/scripts/init_fastlane.sh
```

## Uploading Metadata

```bash
# Upload everything (metadata + screenshots)
fastlane deliver --skip_binary_upload

# Metadata only
fastlane deliver --skip_binary_upload --skip_screenshots

# Specific language only
fastlane deliver --skip_binary_upload --languages "en-US"

# Preview without uploading
fastlane deliver --skip_binary_upload --skip_upload
```

## Validation

Fastlane automatically validates:
- Character limits
- Required fields
- URL formats
- Language codes

Errors will be shown before upload.

## Common Issues

### "Description too long"
Check character count (not word count). Trim or split into paragraphs.

### "Missing privacy policy URL"
Required as of 2021. Add to `privacy_url.txt` in each language or default.

### "Keywords must be comma-separated"
Don't use spaces after commas: `word1,word2,word3` not `word1, word2, word3`

### "Language code not recognized"
Use exact codes from the table above (case-sensitive).

## macOS App Store Specifics

### Required Files for macOS

macOS apps have the same structure as iOS apps, but with some platform-specific requirements:

**Mandatory:**
- `privacy_url.txt` - Privacy policy (required as of 2021)
- `support_url.txt` - Support website
- `primary_category.txt` - App Store category
- At least one localized description

**Recommended:**
- `review_information/` directory with reviewer contact and test instructions
- `copyright.txt` - Copyright notice
- Multi-language support

### macOS Screenshot Requirements

**Sizes (16:10 aspect ratio):**
- 1280x800
- 1440x900
- 2560x1600
- 2880x1800 (recommended for best quality)

**Format:**
- PNG format
- RGB color space
- At least 1 screenshot per language
- Maximum 10 screenshots per language

### macOS Categories

For macOS apps, use these categories in `primary_category.txt`:

**Most Common:**
- `GRAPHICS_AND_DESIGN` - Photo editors, design tools
- `PRODUCTIVITY` - Utilities, productivity apps
- `UTILITIES` - System tools, converters
- `DEVELOPER_TOOLS` - IDEs, development utilities
- `BUSINESS` - Business applications
- `EDUCATION` - Educational software
- `ENTERTAINMENT` - Entertainment apps
- `FINANCE` - Financial tools
- `LIFESTYLE` - Lifestyle apps
- `MUSIC` - Music creation/editing
- `VIDEO` - Video editing/playback

### Example Metadata (from piconv project)

**Basic Info**

`fastlane/metadata/copyright.txt`:
```
2026 lollipush
```

`fastlane/metadata/primary_category.txt`:
```
GRAPHICS_AND_DESIGN
```

**English Localization**

`fastlane/metadata/en-US/name.txt`:
```
Piconv
```

`fastlane/metadata/en-US/subtitle.txt`:
```
Image Format Converter
```

`fastlane/metadata/en-US/description.txt`:
```
Piconv is a simple yet powerful image format converter for macOS.

FEATURES:
• Convert between JPEG, PNG, WebP, and HEIC formats
• Batch processing - convert multiple images at once
• Adjust quality and scale settings
• Preserve or compress image quality
• Track conversion history
• Simple drag-and-drop interface

SUPPORTED FORMATS:
• JPEG/JPG - Universal image format
• PNG - Lossless compression
• WebP - Modern efficient format
• HEIC - Apple's high-efficiency format

Perfect for photographers, designers, and anyone who needs to convert images quickly and easily.
```

`fastlane/metadata/en-US/keywords.txt`:
```
image,converter,photo,format,jpeg,png,webp,heic,batch,convert,resize,quality
```

`fastlane/metadata/en-US/promotional_text.txt`:
```
The easiest way to convert images on your Mac. Support for JPEG, PNG, WebP, and HEIC formats.
```

`fastlane/metadata/en-US/support_url.txt`:
```
https://github.com/yourusername/piconv
```

`fastlane/metadata/en-US/privacy_url.txt`:
```
https://github.com/yourusername/piconv/blob/main/PRIVACY.md
```

**Review Information**

`fastlane/metadata/review_information/first_name.txt`:
```
John
```

`fastlane/metadata/review_information/last_name.txt`:
```
Doe
```

`fastlane/metadata/review_information/email_address.txt`:
```
john.doe@example.com
```

`fastlane/metadata/review_information/phone_number.txt`:
```
+1 555-123-4567
```

`fastlane/metadata/review_information/notes.txt`:
```
To test the image conversion:
1. Launch the app
2. Drag and drop any image file (or click to select)
3. Choose output format (JPEG, PNG, or WebP)
4. Adjust quality/scale if desired
5. Click "Convert"

The app will convert the image and save to the selected output directory.

HEIC files are supported and will be converted using the macOS sips tool automatically.
```

### macOS-Specific Tips

1. **Privacy Policy**: Required for all macOS apps. Can be hosted on GitHub Pages, your website, or in the app repository.

2. **Screenshots**: Use the custom frameit approach (see references/frameit-config.md) to add backgrounds and shadows to your screenshots.

3. **Build Configuration**: Ensure your `electron-builder` config includes:
   ```json
   {
     "mac": {
       "target": ["mas"],
       "category": "public.app-category.graphics-design"
     }
   }
   ```

4. **Entitlements**: macOS apps need proper entitlements. Example `entitlements.mas.plist`:
   ```xml
   <key>com.apple.security.app-sandbox</key>
   <true/>
   <key>com.apple.security.files.user-selected.read-write</key>
   <true/>
   ```

5. **Version Numbers**: Use semantic versioning (e.g., `1.0.0`) for `CFBundleShortVersionString`. Use incrementing build numbers (managed by fastlane) for `CFBundleVersion`.

### Testing Before Upload

```bash
# Preview metadata without uploading
fastlane deliver --skip_binary_upload --skip_upload

# Validate metadata structure
ls -R fastlane/metadata/

# Check file encodings
file fastlane/metadata/en-US/*.txt

# Verify screenshot sizes
sips -g pixelWidth -g pixelHeight fastlane/screenshots_framed/en-US/*.png
```
