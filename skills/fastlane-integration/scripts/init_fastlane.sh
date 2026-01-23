#!/bin/bash

# Fastlane Initialization Script
# Detects project type and sets up appropriate fastlane configuration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Fastlane Initialization ===${NC}\n"

# Detect project type
PROJECT_TYPE=""

if [ -f "package.json" ]; then
  if grep -q "electron" package.json; then
    PROJECT_TYPE="electron"
  else
    PROJECT_TYPE="web"
  fi
elif [ -f "*.xcodeproj" ] || [ -f "*.xcworkspace" ]; then
  PROJECT_TYPE="ios"
elif [ -f "android/app/build.gradle" ]; then
  PROJECT_TYPE="android"
else
  echo -e "${YELLOW}Could not auto-detect project type.${NC}"
  echo "Please select your project type:"
  echo "1) iOS/macOS native"
  echo "2) Electron"
  echo "3) Android"
  echo "4) Web/Other"
  read -p "Enter choice [1-4]: " choice

  case $choice in
    1) PROJECT_TYPE="ios" ;;
    2) PROJECT_TYPE="electron" ;;
    3) PROJECT_TYPE="android" ;;
    4) PROJECT_TYPE="web" ;;
    *) echo "Invalid choice. Exiting."; exit 1 ;;
  esac
fi

echo -e "${GREEN}✓${NC} Detected project type: ${PROJECT_TYPE}\n"

# Create fastlane directory structure
echo "Creating fastlane directory structure..."

mkdir -p fastlane/metadata/review_information
mkdir -p fastlane/screenshots

# Get supported languages
echo -e "\n${BLUE}Language Configuration${NC}"
echo "Enter supported languages (comma-separated, e.g., en-US,zh-Hans,ja):"
read -p "Languages: " LANGUAGES

IFS=',' read -ra LANG_ARRAY <<< "$LANGUAGES"

# Create metadata directories for each language
for lang in "${LANG_ARRAY[@]}"; do
  lang=$(echo "$lang" | xargs)  # Trim whitespace
  mkdir -p "fastlane/metadata/${lang}"
  mkdir -p "fastlane/screenshots/${lang}"
  echo -e "${GREEN}✓${NC} Created directories for ${lang}"
done

# Create default fallback directory
mkdir -p fastlane/metadata/default

# Get app information
echo -e "\n${BLUE}App Information${NC}"
read -p "App Bundle ID (e.g., com.company.app): " BUNDLE_ID
read -p "Apple ID email: " APPLE_ID

# Create Appfile
cat > fastlane/Appfile <<EOF
# Fastlane Appfile
# For more information: https://docs.fastlane.tools/advanced/Appfile/

app_identifier("${BUNDLE_ID}")
apple_id("${APPLE_ID}")

# Uncomment if you have multiple apps
# For specific platforms:
# for_platform :ios do
#   app_identifier("${BUNDLE_ID}")
# end
#
# for_platform :mac do
#   app_identifier("${BUNDLE_ID}")
# end
EOF

echo -e "${GREEN}✓${NC} Created Appfile"

# Get skill templates directory
SKILL_DIR=".claude/skills/fastlane-integration"
if [ ! -d "$SKILL_DIR" ]; then
  # Try alternate locations
  if [ -d "$HOME/.claude/skills/fastlane-integration" ]; then
    SKILL_DIR="$HOME/.claude/skills/fastlane-integration"
  else
    echo -e "${YELLOW}Warning: Could not find fastlane-integration skill templates${NC}"
    SKILL_DIR=""
  fi
fi

# Copy appropriate Fastfile template
if [ -n "$SKILL_DIR" ] && [ -d "$SKILL_DIR/assets/templates" ]; then
  if [ "$PROJECT_TYPE" = "electron" ] || [ "$PROJECT_TYPE" = "web" ]; then
    cp "$SKILL_DIR/assets/templates/Fastfile.electron" fastlane/Fastfile
  else
    cp "$SKILL_DIR/assets/templates/Fastfile.ios" fastlane/Fastfile
  fi
  echo -e "${GREEN}✓${NC} Created Fastfile"

  # Copy other templates
  if [ -f "$SKILL_DIR/assets/templates/Framefile.json" ]; then
    cp "$SKILL_DIR/assets/templates/Framefile.json" fastlane/
    echo -e "${GREEN}✓${NC} Created Framefile.json"
  fi

  if [ "$PROJECT_TYPE" = "ios" ] && [ -f "$SKILL_DIR/assets/templates/Snapfile" ]; then
    cp "$SKILL_DIR/assets/templates/Snapfile" fastlane/
    echo -e "${GREEN}✓${NC} Created Snapfile"
  fi
else
  # Create basic Fastfile if templates not found
  cat > fastlane/Fastfile <<EOF
# Fastlane Configuration
# For more information: https://docs.fastlane.tools

default_platform(:mac)

platform :mac do
  desc "Generate screenshots"
  lane :screenshots do
    # Add your screenshot generation here
  end

  desc "Frame screenshots with frameit"
  lane :frame do
    frameit(path: "./screenshots")
  end

  desc "Upload metadata and screenshots"
  lane :upload do
    deliver(
      skip_binary_upload: true,
      force: true
    )
  end

  desc "Full release workflow"
  lane :release do
    screenshots
    frame
    upload
  end
end
EOF
  echo -e "${GREEN}✓${NC} Created basic Fastfile"
fi

# Create basic metadata files
echo -e "\n${BLUE}Creating metadata template files...${NC}"

# Non-localized metadata
cat > fastlane/metadata/copyright.txt <<EOF
$(date +%Y) Your Company Name
EOF

cat > fastlane/metadata/primary_category.txt <<EOF
PRODUCTIVITY
EOF

# Review information
cat > fastlane/metadata/review_information/first_name.txt <<EOF
Your
EOF

cat > fastlane/metadata/review_information/last_name.txt <<EOF
Name
EOF

cat > fastlane/metadata/review_information/email_address.txt <<EOF
${APPLE_ID}
EOF

# Create template files for each language
for lang in "${LANG_ARRAY[@]}"; do
  lang=$(echo "$lang" | xargs)

  cat > "fastlane/metadata/${lang}/name.txt" <<EOF
Your App Name
EOF

  cat > "fastlane/metadata/${lang}/description.txt" <<EOF
Enter your app description here.

Features:
- Feature 1
- Feature 2
- Feature 3
EOF

  cat > "fastlane/metadata/${lang}/keywords.txt" <<EOF
productivity,utility,tool
EOF

  cat > "fastlane/metadata/${lang}/release_notes.txt" <<EOF
- Bug fixes and performance improvements
EOF

  cat > "fastlane/metadata/${lang}/promotional_text.txt" <<EOF
Your promotional text (170 characters max)
EOF

  echo -e "${GREEN}✓${NC} Created metadata templates for ${lang}"
done

# Create backgrounds directory for frameit
mkdir -p fastlane/backgrounds
mkdir -p fastlane/fonts

echo -e "\n${GREEN}=== Setup Complete ===${NC}\n"
echo "Next steps:"
echo "1. Edit fastlane/Appfile with your app details"
echo "2. Fill in metadata files in fastlane/metadata/"
echo "3. Generate screenshots"
if [ "$PROJECT_TYPE" = "electron" ]; then
  echo "   - For Electron: Use Playwright script (see skill documentation)"
else
  echo "   - For native apps: Configure snapshot and run 'fastlane snapshot'"
fi
echo "4. (Optional) Add custom backgrounds to fastlane/backgrounds/"
echo "5. Configure fastlane/Framefile.json for screenshot beautification"
echo "6. Run 'fastlane upload' to deploy"

echo -e "\n${BLUE}Project structure:${NC}"
tree -L 3 fastlane/ 2>/dev/null || find fastlane -type f | head -20
