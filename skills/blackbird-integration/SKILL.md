---
name: blackbird-integration
description: Integrate Blackbird SQLite ORM into Swift/SwiftUI Xcode projects. Use when setting up Blackbird database, creating BlackbirdModel structs, or adding SQLite persistence to an iOS/macOS app. Automates dependency injection, database setup, extension creation, and model scaffolding.
---

# Blackbird Integration for Swift/SwiftUI Projects

This skill guides you through integrating Marco Arment's Blackbird SQLite ORM into a Swift Xcode project.

## Workflow

### Step 1: Add Blackbird Dependency to Xcode Project

**IMPORTANT**: This step edits the project.pbxproj file directly. The pbxproj format is fragile — follow the exact structure below.

#### 1.1 Generate Unique IDs

Generate **one** 24-character hex ID that will be used for all Blackbird-related entries. The ID must be unique within the project.

Example ID generation (bash):
```bash
openssl rand -hex 12
```

Example output: `8B95964D2F3481550072D6B0`

You'll use this base ID with different suffixes:
- PBXBuildFile: append `1` → `8B95964E2F3481550072D6B0`
- XCSwiftPackageProductDependency: the base → `8B95964D2F3481550072D6B0`
- XCRemoteSwiftPackageReference: subtract `3` from last char → `8B95964A2F3481550072D6B0`

(The exact ID doesn't matter as long as it's unique in the file and follows this pattern.)

#### 1.2 Add to `PBXBuildFile` Section

Find `/* Begin PBXBuildFile section */` and add:
```
8B95964E2F3481550072D6B0 /* Blackbird in Frameworks */ = {isa = PBXBuildFile; productRef = 8B95964D2F3481550072D6B0 /* Blackbird */; };
```

#### 1.3 Add to Target's Frameworks Phase

Find the main app target's `PBXFrameworksBuildPhase` section (search for `isa = PBXFrameworksBuildPhase` under your app target). Add to the `files` array:
```
8B95964E2F3481550072D6B0 /* Blackbird in Frameworks */,
```

#### 1.4 Add to Target's Package Dependencies

Find the main app target's `packageProductDependencies` array and add:
```
8B95964D2F3481550072D6B0 /* Blackbird */,
```

#### 1.5 Add to Project's Package References

Find the root PBXProject's `packageReferences` array (near `productRefGroup` and `projectDirPath`) and add:
```
8B95964A2F3481550072D6B0 /* XCRemoteSwiftPackageReference "Blackbird" */,
```

#### 1.6 Add `XCRemoteSwiftPackageReference` Section

Before `/* End XCConfigurationList section */`, add:
```
/* Begin XCRemoteSwiftPackageReference section */
8B95964A2F3481550072D6B0 /* XCRemoteSwiftPackageReference "Blackbird" */ = {
	isa = XCRemoteSwiftPackageReference;
	repositoryURL = "https://github.com/marcoarment/Blackbird.git";
	requirement = {
		branch = main;
		kind = branch;
	};
};
/* End XCRemoteSwiftPackageReference section */
```

**Note**: User prefers tracking the `main` branch. Do NOT use version tags.

#### 1.7 Add `XCSwiftPackageProductDependency` Section

After the `XCRemoteSwiftPackageReference` section, add:
```
/* Begin XCSwiftPackageProductDependency section */
8B95964D2F3481550072D6B0 /* Blackbird */ = {
	isa = XCSwiftPackageProductDependency;
	package = 8B95964A2F3481550072D6B0 /* XCRemoteSwiftPackageReference "Blackbird" */;
	productName = Blackbird;
};
/* End XCSwiftPackageProductDependency section */
```

### Step 2: Create `Extension/Database+Extension.swift`

Create the file `<ProjectName>/Extension/Database+Extension.swift` with the following content:

```swift
import Blackbird

extension Blackbird.Database {

  func upsert(item: some BlackbirdModel) async {
    do {
      try await item.write(to: self)
    } catch {
      debugPrint(error)
    }
  }

  func upsert(items: [any BlackbirdModel]) async throws {
    do {
      for item in items {
        try await item.write(to: self)
      }
    } catch {
      debugPrint(error)
    }
  }
}
```

This extension provides convenient `upsert` methods with automatic error handling.

### Step 3: Create an Example BlackbirdModel

Create a model file in `<ProjectName>/Models/<ModelName>.swift`. The model name and fields depend on the project domain.

**Example**: For a gardening app, create `Models/Plant.swift`:

```swift
import Blackbird

struct Plant: BlackbirdModel {
    @BlackbirdColumn var id: Int
    @BlackbirdColumn var name: String
    @BlackbirdColumn var species: String
    @BlackbirdColumn var wateringInterval: Int  // days
    @BlackbirdColumn var notes: String?
}
```

**Pattern**:
- Struct conforms to `BlackbirdModel`
- All persisted properties use `@BlackbirdColumn`
- Optional fields use `String?`, `Int?`, etc.
- Blackbird auto-creates the SQLite table and schema

**Custom Primary Keys** (optional):
```swift
struct CustomModel: BlackbirdModel {
    static var primaryKey: [BlackbirdColumnKeyPath] = [\.$customID]

    @BlackbirdColumn var customID: String
    @BlackbirdColumn var data: String
}
```

Default primary key is `id` if not specified.

### Step 4: Set Up Database in App Entry Point

Modify the main App struct (e.g., `<ProjectName>App.swift`):

```swift
import SwiftUI
import Blackbird

private let dbPath =
  "\(NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0])/app.sqlite"

let db: Blackbird.Database = try! Blackbird.Database(path: dbPath)

@main
struct YourProjectApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.blackbirdDatabase, db)
        }
    }
}
```

**Key points**:
- `db` is a top-level global constant accessible throughout the app
- Database file stored in app's Documents directory
- `.environment(\.blackbirdDatabase, db)` is still required for `@BlackbirdLiveModels` to function
- Direct write operations can use `db` without environment injection

### Step 5: Use Blackbird in SwiftUI Views

**Example**: Display and insert data in `ContentView.swift`:

```swift
import SwiftUI
import Blackbird

struct ContentView: View {
    @BlackbirdLiveModels({ try await Plant.read(from: $0, orderBy: .ascending(\.$id)) }) var plants

    var body: some View {
        NavigationStack {
            if plants.didLoad {
                List {
                    ForEach(plants.results) { plant in
                        VStack(alignment: .leading) {
                            Text(plant.name)
                                .font(.headline)
                            Text(plant.species)
                                .font(.subheadline)
                        }
                    }
                }
                .navigationTitle("Plants")
                .toolbar {
                    Button("Add") {
                        addSamplePlant()
                    }
                }
            } else {
                ProgressView()
            }
        }
    }

    private func addSamplePlant() {
        Task {
            let plant = Plant(
                id: Int.random(in: 1...10000),
                name: "Monstera",
                species: "Monstera deliciosa",
                wateringInterval: 7,
                notes: "Loves indirect light"
            )
            await db.upsert(item: plant)
        }
    }
}
```

**Key APIs**:
- `@BlackbirdLiveModels`: Property wrapper for live-updating query results
- `plants.results`: Array of model instances
- `plants.didLoad`: Boolean for showing loading state
- `db.upsert(item:)`: Direct access to global database with convenience method

### Step 6: Verify Integration

Run the build:
```bash
xcodebuild -scheme <ProjectName> -destination 'platform=iOS Simulator,name=iPhone 17' build
```

Expected result: Build succeeds, Blackbird resolves from GitHub main branch.

## Advanced Usage

### Querying Data

```swift
// Read all
let all = try await Plant.read(from: db)

// Filter with SQL WHERE
let filtered = try await Plant.read(from: db, sqlWhere: "wateringInterval < 10")

// Order by column
let sorted = try await Plant.read(from: db, orderBy: .ascending(\.$name))

// Single record by primary key
let plant = try await Plant.read(from: db, id: 123)
```

### Updating Data

```swift
var plant = try await Plant.read(from: db, id: 123)
plant.name = "Updated Name"
await db.upsert(item: plant)
```

### Deleting Data

```swift
try await Plant.delete(from: db, matching: \.$id == 123)
```

## Troubleshooting

**Build error: "No such module 'Blackbird'"**
- Xcode hasn't indexed the new dependency yet
- Run Product → Clean Build Folder (Cmd+Shift+K)
- Run xcodebuild to resolve packages

**Database file location**
- Simulator: `~/Library/Developer/CoreSimulator/Devices/<UUID>/data/Containers/Data/Application/<UUID>/Documents/app.sqlite`
- Use `print(FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0])` to debug

**Migration errors**
- Blackbird auto-migrates schema changes (add/remove columns)
- For breaking changes, delete the database file and restart the app
