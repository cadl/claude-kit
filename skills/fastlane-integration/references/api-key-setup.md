# App Store Connect API Key Setup

Complete guide for configuring App Store Connect API Key for fastlane automation.

## Why Use API Key?

For team accounts and automation, API Key is the best choice:

- ✅ **No 2FA prompts**: Automation runs smoothly without manual intervention
- ✅ **More secure**: No need to store passwords or app-specific passwords
- ✅ **Fine-grained permissions**: Precise control over API Key access
- ✅ **Team-friendly**: Multiple members can use the same API Key
- ✅ **CI/CD friendly**: Perfect for continuous integration/deployment

## Step 1: Create API Key

### 1. Log in to App Store Connect

Visit [App Store Connect](https://appstoreconnect.apple.com/) and log in.

### 2. Navigate to API Keys

1. Click **Users and Access** in the top menu
2. Select **Integrations** tab
3. Find **App Store Connect API** section

### 3. Generate New API Key

1. Click **+** button or **Generate API Key**
2. Fill in the information:
   - **Name**: Enter a recognizable name, e.g., `Fastlane Upload`
   - **Access**: Select permission level

**Permission Levels**:

| Level | Capabilities |
|-------|-------------|
| **Admin** | Full access (recommended for personal accounts) |
| **App Manager** | Can manage apps, upload metadata and screenshots |
| **Developer** | Read-only access, cannot upload |

> 💡 **Recommended**: Choose **App Manager** or **Admin**

### 4. Download API Key File

1. Click **Generate** button
2. **Immediately click Download API Key** to download the `.p8` file

⚠️ **Critical Warning**:
- The API Key can only be downloaded **once**!
- If lost, you must revoke the old key and create a new one
- Save it securely after downloading

### 5. Record Key Information

In the API Keys list, you'll see:

- **Key ID**: 10 characters (e.g., `8XWFT9BX9U`)
- **Issuer ID**: UUID format (e.g., `8a4771f0-a094-40f8-94e5-712726e9a161`)

Record this information - you'll need it for configuration.

---

## Step 2: Place API Key File

Move the downloaded `.p8` file to your project's `fastlane/` directory:

```bash
# Assuming file is in Downloads
# Filename format: AuthKey_<KEY_ID>.p8
mv ~/Downloads/AuthKey_8XWFT9BX9U.p8 ./fastlane/
```

**Directory Structure**:

```
YourProject/
├── fastlane/
│   ├── Fastfile
│   ├── Appfile
│   ├── AuthKey_8XWFT9BX9U.p8  ← API Key file goes here
│   └── metadata/
```

---

## Step 3: Configure Environment Variables

### Method 1: Using .env File (Recommended)

Create `fastlane/.env` with your API key information:

```bash
APP_STORE_CONNECT_KEY_ID=YOUR_KEY_ID
APP_STORE_CONNECT_ISSUER_ID=YOUR_ISSUER_ID
APP_STORE_CONNECT_TEAM_ID=YOUR_TEAM_ID
APP_STORE_CONNECT_API_KEY_PATH=./fastlane/AuthKey_YOUR_KEY_ID.p8
```

**Example**:
```
APP_STORE_CONNECT_KEY_ID=8XWFT9BX9U
APP_STORE_CONNECT_ISSUER_ID=8a4771f0-a094-40f8-94e5-712726e9a161
APP_STORE_CONNECT_TEAM_ID=UWNR93L682
APP_STORE_CONNECT_API_KEY_PATH=./fastlane/AuthKey_8XWFT9BX9U.p8
```

**Important**: Add to `.gitignore`:
```gitignore
# Sensitive files
fastlane/.env
*.p8
fastlane/AuthKey_*.p8
```

### Method 2: Shell Environment Variables

#### Temporary (current session only)

```bash
export APP_STORE_CONNECT_KEY_ID="8XWFT9BX9U"
export APP_STORE_CONNECT_ISSUER_ID="8a4771f0-a094-40f8-94e5-712726e9a161"
export APP_STORE_CONNECT_TEAM_ID="UWNR93L682"
```

#### Permanent (add to shell config)

**For Zsh (macOS default)**:

```bash
echo 'export APP_STORE_CONNECT_KEY_ID="8XWFT9BX9U"' >> ~/.zshrc
echo 'export APP_STORE_CONNECT_ISSUER_ID="8a4771f0-a094-40f8-94e5-712726e9a161"' >> ~/.zshrc
echo 'export APP_STORE_CONNECT_TEAM_ID="UWNR93L682"' >> ~/.zshrc
source ~/.zshrc
```

**For Bash**:

```bash
echo 'export APP_STORE_CONNECT_KEY_ID="8XWFT9BX9U"' >> ~/.bash_profile
echo 'export APP_STORE_CONNECT_ISSUER_ID="8a4771f0-a094-40f8-94e5-712726e9a161"' >> ~/.bash_profile
echo 'export APP_STORE_CONNECT_TEAM_ID="UWNR93L682"' >> ~/.bash_profile
source ~/.bash_profile
```

### Method 3: Hardcode in Fastfile (Testing Only)

⚠️ **Not recommended for production** - only for local testing.

```ruby
app_store_connect_api_key(
  key_id: "8XWFT9BX9U",
  issuer_id: "8a4771f0-a094-40f8-94e5-712726e9a161",
  key_filepath: "./fastlane/AuthKey_8XWFT9BX9U.p8"
)
```

⚠️ **Warning**: Do NOT commit `Fastfile` with hardcoded keys to public repos!

---

## Step 4: Configure Fastfile

In your lanes, use the environment variables:

```ruby
# Example lane
lane :upload_metadata do
  # Get API Key from environment variables
  api_key = app_store_connect_api_key(
    key_id: ENV["APP_STORE_CONNECT_KEY_ID"],
    issuer_id: ENV["APP_STORE_CONNECT_ISSUER_ID"],
    key_filepath: ENV["APP_STORE_CONNECT_API_KEY_PATH"]
  )

  deliver(
    api_key: api_key,
    skip_binary_upload: true,
    skip_screenshots: true,
    force: true
  )
end
```

### Complete Fastfile Example

See `ios-native.md` for complete Fastfile with all lanes.

---

## Step 5: Verify Configuration

Run validation command to check configuration:

```bash
fastlane ios validate
```

If configured correctly, you should see:

```
[✔] Successfully authenticated with App Store Connect API
[✔] Metadata validated successfully
```

---

## Usage

After configuration, you can use these commands:

### Upload Metadata

```bash
fastlane ios upload_metadata
```

Uploads metadata from `fastlane/metadata/`:
- App name, subtitle
- App description
- Keywords
- Release notes
- etc.

### Upload Screenshots

```bash
fastlane ios upload_screenshots
```

Uploads screenshots from `screenshots/` directory.

### Upload Everything

```bash
fastlane ios upload
```

---

## Troubleshooting

### Q1: Authentication Failed "Could not authenticate"

**Possible Causes**:

1. **Incorrect Key ID or Issuer ID**
   - Check if correctly copied from App Store Connect
   - Watch for extra spaces

2. **Wrong File Path**
   - Confirm `.p8` file is in `fastlane/` directory
   - Check filename matches `key_filepath`

3. **Insufficient API Key Permissions**
   - Ensure API Key has **App Manager** or **Admin** access
   - Wait a few minutes - new API Keys may take time to activate

### Q2: .p8 File Not Found

**Error**: `Could not find API key file at path`

**Solution**:

```bash
# Check if file exists
ls -la fastlane/AuthKey_*.p8

# If missing, move file again
mv ~/Downloads/AuthKey_YOUR_KEY_ID.p8 ./fastlane/
```

### Q3: Environment Variables Not Working

**Solution**:

```bash
# Check if environment variables are set
echo $APP_STORE_CONNECT_KEY_ID
echo $APP_STORE_CONNECT_ISSUER_ID

# If empty, reload shell config
source ~/.zshrc  # or source ~/.bash_profile
```

### Q4: Team Member Without Admin Access

If you don't have permission to create API Keys:

1. Contact your **Account Holder** or **Admin**
2. Ask them to create an API Key and share:
   - `.p8` file
   - Key ID
   - Issuer ID

---

## Finding Team ID

If you don't know your Team ID:

### Method 1: App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to **Users and Access** → **Integrations**
3. Team ID is displayed at the top of the page

### Method 2: Apple Developer Portal

1. Log in to [Apple Developer](https://developer.apple.com/account/)
2. Go to **Membership** section
3. Team ID is shown next to your team name

### Method 3: Using spaceship

```bash
fastlane spaceship
```

Follow prompts to log in, then it will display your Team ID.

---

## Security Best Practices

### ✅ Do

- ✅ Use `.env` file or environment variables for sensitive data
- ✅ Add `fastlane/.env` to `.gitignore`
- ✅ Add `*.p8` to `.gitignore`
- ✅ Rotate API Keys regularly (every 6-12 months)
- ✅ Create different API Keys for different purposes
- ✅ Backup `.p8` file to secure location (password manager)

### ❌ Don't

- ❌ Don't commit `.p8` files to Git
- ❌ Don't share API Key information publicly
- ❌ Don't print API Key info in CI/CD logs
- ❌ Don't store `.p8` files in cloud sync folders (Dropbox, iCloud)
- ❌ Don't use the same API Key across multiple unrelated projects

---

## Revoking API Keys

If an API Key is compromised or no longer needed:

1. Log in to App Store Connect
2. Go to **Users and Access** → **Integrations** → **App Store Connect API**
3. Find the API Key
4. Click **Revoke**

⚠️ **Warning**: After revocation, all automation using this key will immediately fail.

---

## CI/CD Configuration

### GitHub Actions

Create repository secret with `.p8` file content:

```yaml
name: Deploy to App Store
on: [push]

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup API Key
        run: |
          echo "${{ secrets.APP_STORE_CONNECT_API_KEY }}" > ./fastlane/AuthKey_${{ secrets.APP_STORE_CONNECT_KEY_ID }}.p8

      - name: Upload metadata
        env:
          APP_STORE_CONNECT_KEY_ID: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          APP_STORE_CONNECT_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          APP_STORE_CONNECT_TEAM_ID: ${{ secrets.APP_STORE_CONNECT_TEAM_ID }}
          APP_STORE_CONNECT_API_KEY_PATH: ./fastlane/AuthKey_${{ secrets.APP_STORE_CONNECT_KEY_ID }}.p8
        run: fastlane ios upload_metadata
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - echo "$APP_STORE_CONNECT_API_KEY" > ./fastlane/AuthKey_$APP_STORE_CONNECT_KEY_ID.p8
    - fastlane ios upload_metadata
  variables:
    APP_STORE_CONNECT_KEY_ID: "8XWFT9BX9U"
    APP_STORE_CONNECT_ISSUER_ID: "8a4771f0-a094-40f8-94e5-712726e9a161"
    APP_STORE_CONNECT_TEAM_ID: "UWNR93L682"
    APP_STORE_CONNECT_API_KEY_PATH: "./fastlane/AuthKey_8XWFT9BX9U.p8"
```

---

## Additional Resources

- [Fastlane App Store Connect API Documentation](https://docs.fastlane.tools/app-store-connect-api/)
- [Apple App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Fastlane Deliver Documentation](https://docs.fastlane.tools/actions/deliver/)

---

**Configuration complete - you're ready to automate your App Store releases!** 🚀
