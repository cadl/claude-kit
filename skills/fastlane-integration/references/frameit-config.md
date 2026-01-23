# Frameit Configuration Guide

Complete guide for beautifying screenshots with backgrounds and captions using fastlane frameit.

## Overview

Frameit adds backgrounds, device frames, and text overlays to your screenshots. While iOS has built-in device frames, macOS and custom styling require manual configuration.

## Basic Setup

### Install ImageMagick

Frameit depends on ImageMagick:

```bash
brew install imagemagick
```

### Verify Installation

```bash
convert -version
```

## Configuration File: Framefile.json

Create `fastlane/Framefile.json` to configure how frameit processes screenshots.

### Minimal Configuration

```json
{
  "default": {
    "background": "./backgrounds/gradient.png"
  }
}
```

### Full Configuration Example

```json
{
  "device_frame_version": "latest",
  "default": {
    "background": "./backgrounds/gradient.png",
    "keyword": {
      "font": "./fonts/Helvetica-Bold.ttf",
      "fontSize": 36,
      "color": "#FFFFFF"
    },
    "title": {
      "font": "./fonts/Helvetica.ttf",
      "fontSize": 48,
      "color": "#FFFFFF"
    },
    "padding": 50,
    "show_complete_frame": false,
    "title_below_image": false,
    "stack_title": false,
    "title_min_height": 0
  },
  "data": [
    {
      "filter": "1_*",
      "keyword": {
        "text": "FEATURE 1"
      },
      "title": {
        "text": "Easy Image Conversion"
      }
    },
    {
      "filter": "2_*",
      "keyword": {
        "text": "FEATURE 2"
      },
      "title": {
        "text": "Multiple Format Support",
        "color": "#FF6B6B"
      }
    }
  ]
}
```

## Configuration Options

### Global Settings (in `default`)

#### background
- **Type**: String (path to image)
- **Required**: Recommended
- **Description**: Background image path (relative to Framefile.json)
- **Example**: `"./backgrounds/gradient.png"`

Without a background, titles won't be added.

#### keyword
Controls the small keyword/tag text above the title.

- **font**: Path to font file
- **fontSize**: Font size in points
- **color**: Hex color code
- **text**: Default keyword text (can be overridden per screenshot)

#### title
Controls the main caption text.

- **font**: Path to font file
- **fontSize**: Font size in points
- **color**: Hex color code
- **text**: Default title text (can be overridden per screenshot)

#### padding
- **Type**: Number
- **Description**: Padding around the screenshot in pixels
- **Default**: 50
- **Example**: `50`

#### title_below_image
- **Type**: Boolean
- **Description**: Place title below screenshot instead of on it
- **Default**: false

#### offset (macOS only)
For macOS screenshots, specify where to place the screenshot on the background.

```json
"offset": {
  "offset": "+50+100",
  "titleHeight": 200
}
```

- **offset**: ImageMagick geometry (`+X+Y` for positioning)
- **titleHeight**: Height reserved for title in pixels

#### show_complete_frame
- **Type**: Boolean
- **Description**: Show full device frame or just content
- **Default**: false

### Per-Screenshot Settings (in `data` array)

Each item in `data` can override default settings for matching screenshots.

```json
{
  "filter": "1_*",           // Matches filenames starting with "1_"
  "keyword": {
    "text": "NEW FEATURE",
    "color": "#FF0000"       // Override just color
  },
  "title": {
    "text": "Your Caption Here"
  },
  "background": "./backgrounds/custom_bg.png"  // Screenshot-specific background
}
```

#### filter
Glob pattern to match screenshot filenames:
- `"1_*"` - Matches `1_welcome.png`, `1_main.png`, etc.
- `"*_settings*"` - Matches any file containing "_settings"
- `"3_profile.png"` - Exact filename match

## Multi-Language Captions

Use `.strings` files for localized captions instead of hardcoding in Framefile.json.

### Structure

```
screenshots/
├── en-US/
│   ├── keyword.strings
│   ├── title.strings
│   ├── 1_welcome.png
│   └── 2_feature.png
└── zh-Hans/
    ├── keyword.strings
    ├── title.strings
    ├── 1_welcome.png
    └── 2_feature.png
```

### .strings File Format

**title.strings**:
```
"1_*" = "Welcome to the App";
"2_*" = "Powerful Features";
"3_*" = "Easy to Use";
```

**keyword.strings**:
```
"1_*" = "GET STARTED";
"2_*" = "FEATURES";
"3_*" = "SIMPLICITY";
```

Frameit matches filenames against patterns and applies the corresponding text.

### Priority

1. `.strings` file (if exists)
2. `data` array in Framefile.json (if matching filter found)
3. `default` in Framefile.json

## Creating Backgrounds

### For iOS (with Device Frames)

Frameit includes device frames for iPhones and iPads. You only need to create a background.

**Recommended size**: 2732 x 2732 (large enough for all devices)

```bash
# Create gradient background with ImageMagick
convert -size 2732x2732 \
  gradient:'#667eea-#764ba2' \
  backgrounds/gradient.png
```

### For macOS (No Built-in Frames)

You must create backgrounds that include the device frame yourself.

**Steps**:

1. Find or create a Mac device mockup (search "MacBook mockup PNG")
2. Size it appropriately (e.g., 3200 x 2000 for enough space)
3. Position your screenshot in the device screen area
4. Export as PNG

**Tools**:
- **Figma/Sketch**: Design custom layouts
- **Photoshop**: Layer mockup + screenshot
- **Online tools**: Smartmockups, Mockuuups Studio

**Example background structure for macOS**:
```
[----------------3200px-----------------]
[                                        ]
[         Mac device mockup              ] 2000px
[    [screenshot goes here with offset]  ]
[                                        ]
[    Title text area (200px height)     ]
```

Then in Framefile.json:

```json
{
  "default": {
    "background": "./backgrounds/mac_mockup.png",
    "offset": {
      "offset": "+400+250",
      "titleHeight": 200
    }
  }
}
```

Adjust `offset` values until screenshot aligns with mockup screen area.

### Solid Color Backgrounds

```bash
# Solid color
convert -size 2732x2732 xc:'#667eea' backgrounds/blue.png

# Gradient
convert -size 2732x2732 gradient:'#ff6b6b-#feca57' backgrounds/warm_gradient.png

# Radial gradient
convert -size 2732x2732 radial-gradient:'#764ba2-#667eea' backgrounds/radial.png
```

## Fonts

### System Fonts

macOS system fonts (available without copying):
- `/System/Library/Fonts/Helvetica.ttc`
- `/System/Library/Fonts/HelveticaNeue.ttc`
- `/Library/Fonts/Arial.ttf`

### Custom Fonts

1. Download or purchase font files (.ttf or .otf)
2. Place in `fastlane/fonts/`
3. Reference in Framefile.json:

```json
{
  "default": {
    "title": {
      "font": "./fonts/Montserrat-Bold.ttf"
    },
    "keyword": {
      "font": "./fonts/Montserrat-Regular.ttf"
    }
  }
}
```

**Popular free fonts**:
- **Montserrat**: Modern, clean
- **Roboto**: Material design
- **SF Pro**: Apple's San Francisco (extract from macOS)
- **Inter**: Great for UI

## Running Frameit

### Basic Usage

```bash
cd fastlane
fastlane frameit
```

Frameit automatically finds screenshots in `./screenshots/` and processes them.

### Specify Path

```bash
fastlane frameit screenshots --path ./path/to/screenshots
```

### Specific Screenshot

```bash
fastlane frameit screenshots/en-US/1_welcome.png
```

### With Color (iOS Only)

For iOS device frames, you can specify frame color:

```bash
fastlane frameit silver  # or: rose_gold, gold, space_gray, white
```

## Advanced Techniques

### macOS Custom Editor with Drop Shadow

For macOS Electron apps, the default frameit behavior doesn't work well because:
1. macOS screenshots don't have device frames
2. You want arbitrary screenshot sizes (not just Mac display sizes)
3. You want to add drop shadows for depth

**Solution:** Create a custom Editor class that extends `Frameit::Editor`.

#### Example: No-Frame macOS Editor with Drop Shadow

This implementation (from the piconv project):
- Scales any screenshot size onto a 16:10 background
- Adds ImageMagick drop shadow
- Uses staging directory to protect raw screenshots

```ruby
# In Fastfile
lane :frame do
  require "frameit"
  require "fileutils"

  # Custom Editor class
  class PiconvNoFrameMacEditor < Frameit::Editor
    def shadow_enabled?
      ENV.fetch("PICONV_FRAME_SHADOW", "1") != "0"
    end

    def shadow_opacity
      Integer(ENV.fetch("PICONV_FRAME_SHADOW_OPACITY", "35"))
    end

    def shadow_sigma
      Integer(ENV.fetch("PICONV_FRAME_SHADOW_SIGMA", "18"))
    end

    def shadow_offset_x
      Integer(ENV.fetch("PICONV_FRAME_SHADOW_OFFSET_X", "0"))
    end

    def shadow_offset_y
      Integer(ENV.fetch("PICONV_FRAME_SHADOW_OFFSET_Y", "24"))
    end

    def shadow_padding_x
      shadow_sigma * 4 + shadow_offset_x.abs
    end

    def shadow_padding_y
      shadow_sigma * 4 + shadow_offset_y.abs
    end

    def add_drop_shadow(img)
      require "tempfile"

      out = Tempfile.new(["piconv-shadow", ".png"])
      out.close

      MiniMagick::Tool::Convert.new do |c|
        c << img.path
        c << "("
        c << "+clone"
        c << "-background" << "black"
        c << "-shadow" << "#{shadow_opacity}x#{shadow_sigma}+#{shadow_offset_x}+#{shadow_offset_y}"
        c << ")"
        c << "+swap"
        c << "-background" << "none"
        c << "-layers" << "merge"
        c << "+repage"
        c << out.path
      end

      MiniMagick::Image.open(out.path)
    end

    def frame!
      prepare_image
      return unless is_complex_framing_mode?
      @image = complex_framing
      store_result
    end

    def generate_background
      background = MiniMagick::Image.open(@config["background"])
      target = ENV["PICONV_FRAME_OUTPUT_SIZE"].to_s
      return background if target.empty?
      return background unless target.match?(/^\d+x\d+$/)

      width, height = target.split("x").map(&:to_i)
      return background if width <= 0 || height <= 0

      if background.width != width || background.height != height
        background.resize("#{width}x#{height}^")
        background.merge!(["-gravity", "center", "-crop", "#{width}x#{height}+0+0"])
      end
      background
    end

    def complex_framing
      background = generate_background

      self.space_to_device = vertical_frame_padding
      background = put_title_into_background(background, @config["stack_title"]) if @config["title"]

      frame_width = background.width - horizontal_frame_padding * 2
      frame_height = background.height - effective_text_height - vertical_frame_padding
      available_width = frame_width
      available_height = frame_height
      if shadow_enabled?
        available_width = [1, available_width - shadow_padding_x].max
        available_height = [1, available_height - shadow_padding_y].max
      end

      if @config["show_complete_frame"]
        image_aspect_ratio = @image.width.to_f / @image.height.to_f
        image_width = [available_width, @image.width].min
        image_height = [available_height, image_width / image_aspect_ratio].min
        image_width = image_height * image_aspect_ratio
        @image.resize("#{image_width}x#{image_height}") if image_width < @image.width || image_height < @image.height
      else
        @image.resize("#{available_width}x") if available_width < @image.width
      end

      @image = add_drop_shadow(@image) if shadow_enabled?
      @image = put_device_into_background(background)
      image
    end
  end

  # Monkey-patch Screenshot class to recognize MacBook in filename
  Frameit::Screenshot.class_eval do
    def mac?
      device_name.to_s.include?("MacBook")
    end
  end

  # Monkey-patch Runner to use custom editor for macOS
  Frameit::Runner.class_eval do
    unless method_defined?(:_piconv_original_editor)
      alias_method :_piconv_original_editor, :editor
    end

    def editor(screenshot, config)
      return PiconvNoFrameMacEditor.new(screenshot, config, Frameit.config[:debug_mode]) if screenshot.mac?
      _piconv_original_editor(screenshot, config)
    end
  end

  # Set default output size
  ENV["PICONV_FRAME_OUTPUT_SIZE"] = ENV.fetch("PICONV_FRAME_OUTPUT_SIZE", "2880x1800")

  # Process screenshots using staging directory
  languages = %w[en-US zh-Hans]
  project_root = File.expand_path("..", __dir__)

  languages.each do |lang|
    screenshots_dir = File.join(project_root, "fastlane", "screenshots", lang)
    staging_root = File.join(project_root, "fastlane", "screenshots", ".frameit-staging", lang)
    framed_dir = File.join(project_root, "fastlane", "screenshots_framed", lang)

    # Clean and create staging directory
    FileUtils.rm_rf(staging_root)
    FileUtils.mkdir_p(staging_root)
    FileUtils.mkdir_p(framed_dir)

    # Copy screenshots to staging (preserves originals)
    Dir[File.join(screenshots_dir, "*.png")].each do |src|
      FileUtils.cp(src, staging_root)
    end

    # Run frameit on staging
    frameit(
      path: staging_root,
      force_device_type: "mac"
    )

    # Move framed results to output directory
    Dir[File.join(staging_root, "*_framed.png")].each do |framed|
      FileUtils.mv(framed, framed_dir)
    end

    # Clean up staging unless debugging
    FileUtils.rm_rf(staging_root) unless ENV["PICONV_FRAME_KEEP_STAGING"] == "1"
  end
end
```

#### Environment Variables for Shadow

| Variable | Default | Description |
|----------|---------|-------------|
| `PICONV_FRAME_SHADOW` | `1` | Enable (`1`) or disable (`0`) drop shadow |
| `PICONV_FRAME_SHADOW_OPACITY` | `35` | Shadow opacity (0-100) |
| `PICONV_FRAME_SHADOW_SIGMA` | `18` | Blur radius in pixels |
| `PICONV_FRAME_SHADOW_OFFSET_X` | `0` | Horizontal offset (negative = left) |
| `PICONV_FRAME_SHADOW_OFFSET_Y` | `24` | Vertical offset (positive = down) |

**Usage:**

```bash
# Default shadow
fastlane mac frame

# Heavier shadow
PICONV_FRAME_SHADOW_OPACITY=50 \
PICONV_FRAME_SHADOW_SIGMA=24 \
PICONV_FRAME_SHADOW_OFFSET_Y=32 \
fastlane mac frame

# No shadow
PICONV_FRAME_SHADOW=0 fastlane mac frame
```

#### Staging Directory Pattern

**Why use staging?**
- Protects original screenshots from being overwritten
- Allows regenerating framed versions anytime
- Keeps clean separation between raw and framed

**Directory structure:**

```
screenshots/
├── .frameit-staging/           # Temporary (gitignored)
│   ├── en-US/
│   │   ├── 1_main.png
│   │   ├── 1_main_framed.png
│   │   └── Framefile.json     # Copied with adjusted paths
│   └── zh-Hans/
└── en-US/                      # Raw screenshots (committed to git)
    ├── 1_main.png
    └── title.strings

screenshots_framed/              # Framed output (gitignored or committed)
├── en-US/
│   ├── 1_main_framed.png
│   └── 2_conversion_framed.png
└── zh-Hans/
    └── ...
```

### Custom ImageMagick Commands

For full control, use ImageMagick directly:

```bash
convert screenshot.png \
  -background '#667eea' \
  -gravity center \
  -extent 2732x2732 \
  framed_screenshot.png
```

### Overlay Text Manually

```bash
convert screenshot.png \
  -gravity north \
  -pointsize 72 \
  -fill white \
  -annotate +0+100 'Your Caption' \
  output.png
```

### Composite Screenshot on Background

```bash
# Place screenshot at specific position on background
convert background.png screenshot.png \
  -geometry +400+300 \
  -composite \
  result.png
```

### Add Drop Shadow via ImageMagick

```bash
# Create drop shadow effect
convert screenshot.png \
  \( +clone -background black -shadow 35x18+0+24 \) \
  +swap -background none -layers merge +repage \
  screenshot_with_shadow.png
```

**Parameters:**
- `35` = opacity percentage
- `18` = blur sigma (radius)
- `+0+24` = horizontal and vertical offset

## Integration with Fastlane

### In Fastfile

```ruby
lane :screenshots do
  # Generate screenshots (Playwright for Electron, snapshot for iOS)
  sh "node ../scripts/screenshot.js"  # or: snapshot
end

lane :frame do
  frameit(
    path: "./screenshots",
    white: false
  )
end

lane :upload do
  deliver(
    skip_binary_upload: true,
    force: true
  )
end

lane :release do
  screenshots
  frame
  upload
end
```

### Options for frameit Action

```ruby
frameit(
  path: "./screenshots",              # Screenshot directory
  white: false,                       # Use white device frame (iOS only)
  silver: false,                      # Use silver device frame (iOS only)
  rose_gold: false,                   # Use rose gold frame (iOS only)
  force_device_type: "iPhone 15 Pro", # Override device detection
  use_legacy_iphonex: false,          # Use old iPhone X frame
  force_orientation: "portrait"       # portrait or landscape
)
```

## Troubleshooting

### "ImageMagick not found"

Install ImageMagick:
```bash
brew install imagemagick
```

### Titles not showing

Ensure you have a background specified:
```json
{
  "default": {
    "background": "./backgrounds/your_bg.png"
  }
}
```

### Font not found

Use absolute path or ensure relative path is correct from Framefile.json location:
```json
{
  "default": {
    "title": {
      "font": "/System/Library/Fonts/Helvetica.ttc"
    }
  }
}
```

### Screenshot positioned incorrectly (macOS)

Adjust the `offset` values:
```json
{
  "default": {
    "offset": {
      "offset": "+X+Y",  // Increase X to move right, Y to move down
      "titleHeight": 200
    }
  }
}
```

Test with small adjustments until it looks right.

### Text too large/small

Adjust `fontSize`:
```json
{
  "default": {
    "title": {
      "fontSize": 48  // Increase or decrease as needed
    }
  }
}
```

## Examples

### Example 1: Simple Gradient Background

**Framefile.json**:
```json
{
  "default": {
    "background": "./backgrounds/gradient.png",
    "title": {
      "font": "/System/Library/Fonts/Helvetica.ttc",
      "fontSize": 56,
      "color": "#FFFFFF"
    },
    "padding": 60
  }
}
```

### Example 2: Multi-Language with Keywords

**Framefile.json**:
```json
{
  "default": {
    "background": "./backgrounds/brand_bg.png",
    "keyword": {
      "font": "./fonts/Montserrat-Bold.ttf",
      "fontSize": 32,
      "color": "#FFD93D"
    },
    "title": {
      "font": "./fonts/Montserrat-Regular.ttf",
      "fontSize": 52,
      "color": "#FFFFFF"
    }
  }
}
```

**title.strings** (en-US):
```
"1_*" = "Convert Images Easily";
"2_*" = "Multiple Formats Supported";
```

**keyword.strings** (en-US):
```
"1_*" = "SIMPLE";
"2_*" = "POWERFUL";
```

### Example 3: macOS with Device Mockup

**Framefile.json**:
```json
{
  "default": {
    "background": "./backgrounds/macbook_mockup.png",
    "offset": {
      "offset": "+420+280",
      "titleHeight": 180
    },
    "title": {
      "font": "./fonts/SF-Pro-Display-Bold.otf",
      "fontSize": 64,
      "color": "#1a1a1a"
    },
    "padding": 0
  }
}
```

## Best Practices

1. **Keep it simple**: Don't overcrowd with text
2. **High contrast**: Ensure text is readable on background
3. **Consistent style**: Use same fonts/colors across all screenshots
4. **Brand colors**: Use your brand's color palette
5. **Test on device**: View on actual App Store pages
6. **Optimize images**: Compress backgrounds to reduce file size
7. **Version control**: Keep Framefile.json and backgrounds in git

## Resources

- **Mockup tools**: Figma, Sketch, Smartmockups, MockRocket
- **Free fonts**: Google Fonts, Font Squirrel
- **Color palettes**: Coolors.co, Adobe Color
- **ImageMagick docs**: https://imagemagick.org/
- **Frameit docs**: https://docs.fastlane.tools/actions/frameit/
