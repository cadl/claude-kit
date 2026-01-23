# Fastlane Integration Skill

This skill provides comprehensive guidance for integrating fastlane into iOS/macOS/Electron projects.

## Contents

- SKILL.md - Main guide with workflow decision trees and quick start
- scripts/ - Automation scripts
  - init_fastlane.sh - Initialize fastlane directory structure
  - screenshot_electron.js - Playwright-based screenshot generation for Electron apps
- references/ - Detailed reference documentation
  - ios-snapshot.md - iOS/macOS native app screenshot guide
  - metadata-structure.md - Complete App Store metadata reference
  - frameit-config.md - Screenshot beautification configuration
- assets/templates/ - Template files for Fastfile, Appfile, Framefile.json, etc.

## Usage

When working on a project that needs fastlane integration, this skill will automatically trigger.

Or invoke manually:
1. Read SKILL.md for workflow guidance
2. Run scripts/init_fastlane.sh to set up the project
3. Refer to references/ for detailed configuration options

## Dependencies

- Ruby (for fastlane): gem install fastlane
- ImageMagick (for frameit): brew install imagemagick
- Playwright (for Electron screenshots): npm install -D playwright
