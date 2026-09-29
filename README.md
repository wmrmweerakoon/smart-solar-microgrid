# Smart Solar Microgrid Trading & Energy Management System

[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Android Native](https://img.shields.io/badge/Android-Pure%20Native%20Java-3DDC84?logo=android&logoColor=white)](https://developer.android.com/)
[![SQLite](https://img.shields.io/badge/Local%20DB-SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Google%20Maps%20SDK-4285F4?logo=googlemaps&logoColor=white)](https://developers.google.com/maps)

An end-to-end enterprise microgrid energy trading platform designed for decentralized solar energy exchange between residential **Prosumers**, **Grid Station Operators**, and **Backoffice Administrators**. The system provides real-time telemetry, automated trade reservations, cryptographically verifiable QR dispatch tokens, and spatial geo-mapping of microgrid stations.

---

## System Architecture & Tech Stack

```
                              ┌─────────────────────────────────────────┐
                              │       Web Browser (Backoffice/Operator) │
                              │         React 19 + Vite + Tailwind CSS  │
                              └────────────────────┬────────────────────┘
                                                   │ HTTP / REST
                                                   ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────────┐
│ Android Native Mobile App       │       │ ASP.NET Core 8.0 Web API            │
│  - Pure Native Java (SDK 34)    │ REST  │  - Controllers & Fat Services       │
│  - Local SQLite (Offline Cache) ├──────►│  - JWT Bearer Authentication        │
│  - Google Maps SDK v19          │       │  - Port 5299                        │
│  - ZXing QR Scanner & Generator │       └──────────────────┬──────────────────┘
└─────────────────────────────────┘                          │
                                                             ▼
                                                  ┌──────────────────────┐
                                                  │ MongoDB Atlas        │
                                                  │ (Cloud NoSQL DB)     │
                                                  └──────────────────────┘
```

| Layer | Technology | Key Components & Purpose |
| :--- | :--- | :--- |
| **Backend API** | C# .NET 8.0 Web API | RESTful controllers, FAT service pattern, JWT token auth, BCrypt, Swagger/OpenAPI |
| **Central Database** | MongoDB Atlas (Cloud) | Scalable NoSQL persistence for Users, Prosumers, Microgrid Nodes, Energy Slots, Bookings |
| **Web Frontend** | React 19 + Vite | Backoffice governance, real-time telemetry dashboards, booking approvals, Tailwind CSS, Lucide icons |
| **Mobile App** | Pure Native Android (Java) | **No cross-platform frameworks**. Android SDK 34, Material 3, AndroidX |
| **Local Mobile DB** | Android SQLite | Pure `SQLiteOpenHelper` DAO pattern for offline user auth, node mapping, and reservation cache |
| **Mapping & GIS** | Google Maps Android SDK v19 | Live microgrid station markers, operational statuses, capacity badges, distance calculation |
| **QR Code Engine** | ZXing (`core:3.5.3` + `embedded:4.3.0`) | High-resolution encrypted QR token generation & hardware camera barcode scanning |
| **Networking** | Retrofit 2 + OkHttp 3 + Gson | Asynchronous HTTP client with connection pooling, logging, and automatic API base switching |

---

## Project Folder Structure

```
smart-solar-microgrid/
├── .vscode/                                # VS Code & Antigravity IDE automated tasks
│   └── tasks.json                          # 1-Click shortcuts for Emulator, Phone, and APK builds
├── backend/
│   └── SmartSolarMicrogrid.API/            # ASP.NET Core 8.0 Web API project
│       ├── Controllers/                    # Auth, Booking, Dashboard, EnergySlot, Microgrid, Prosumer
│       ├── Data/                           # MongoDbContext and database seeding
│       ├── Middleware/                     # Global exception handling middleware
│       ├── Models/                         # MongoDB documents and DTOs
│       ├── Repositories/                   # Repository abstractions and Mongo implementations
│       ├── Services/                       # Business logic (7-day rule, 12h notice, slot matching)
│       ├── appsettings.json                # MongoDB Atlas connection string & JWT config
│       └── Program.cs                      # Service registration, CORS, and middleware pipeline
├── frontend/                               # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── components/                     # Navbar, Sidebar, ProtectedRoute, StatsCards
│   │   ├── pages/                          # Dashboard, Bookings, MicrogridNodes, Prosumers, Slots
│   │   ├── services/                       # Axios API service clients
│   │   └── utils/                          # Auth helpers and JWT session management
│   ├── package.json
│   └── vite.config.js
├── mobile/                                 # Pure Native Android Application (No Frameworks)
│   ├── app/
│   │   ├── build.gradle                    # Dependencies (Retrofit, ZXing, Play Services Maps)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml         # Permissions (Camera, Internet, Location), Activities
│   │       ├── java/com/smartsolar/microgrid/
│   │       │   ├── SmartSolarApplication.java # Maps SDK pre-warming (Renderer.LEGACY)
│   │       │   ├── activities/             # 23 Native Activity screens (Prosumer & Operator)
│   │       │   │   ├── LoginActivity.java
│   │       │   │   ├── RegisterActivity.java
│   │       │   │   ├── ProsumerHomeActivity.java
│   │       │   │   ├── OperatorHomeActivity.java
│   │       │   │   ├── DashboardActivity.java
│   │       │   │   ├── MapActivity.java
│   │       │   │   ├── CreateReservationActivity.java
│   │       │   │   ├── UpdateReservationActivity.java
│   │       │   │   ├── CancelReservationActivity.java
│   │       │   │   ├── QrGeneratorActivity.java
│   │       │   │   ├── QrScannerActivity.java
│   │       │   │   ├── VerifyTransactionActivity.java
│   │       │   │   ├── SearchBookingActivity.java
│   │       │   │   ├── BookingHistoryActivity.java
│   │       │   │   ├── PendingBookingsActivity.java
│   │       │   │   ├── ProfileActivity.java
│   │       │   │   └── DeactivateAccountActivity.java
│   │       │   ├── database/               # Pure SQLite DAOs (DatabaseHelper, UserDao, NodeDao, ReservationDao)
│   │       │   ├── api/                    # Retrofit 2 ApiService, ApiClient, Request/Response DTOs
│   │       │   ├── adapters/               # RecyclerView adapters (Booking, Slot, Node, History)
│   │       │   └── utils/                  # Constants (IP resolution), NetworkUtils
│   │       └── res/
│   │           ├── layout/                 # XML UI layouts with Material Design 3 cards and buttons
│   │           ├── values/                 # strings.xml, colors.xml, google_maps_api.xml
│   │           └── drawable/               # Vector drawables and brand icons
│   ├── build.gradle
│   ├── gradle/wrapper/
│   └── gradlew.bat                         # Gradle build wrapper for Windows
├── run-emulator.ps1                        # 1-Click script: boots emulator, bridges port, builds & launches
├── run-phone.ps1                           # 1-Click script: detects USB phone, bridges port, installs & launches
└── README.md
```

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

1. **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (`dotnet --version` should output `8.0.x`)
2. **[Node.js 20+ & npm](https://nodejs.org/)** (`node --version` and `npm --version`)
3. **[Java Development Kit (JDK 17 or 21)](https://www.oracle.com/java/technologies/downloads/)** (`java -version`)
4. **[Android SDK & Command-line Tools](https://developer.android.com/studio)**:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Set environment variable `ANDROID_HOME` (e.g., `C:\Users\<user>\AppData\Local\Android\Sdk`)
   - Add `platform-tools` (`adb`) and `emulator` to your system `PATH`
5. **MongoDB Atlas Account** (A pre-configured cloud cluster is already set in `appsettings.json`, or you can use a local MongoDB instance).

---

## Setup & Running Guide

### 1. Backend Setup (.NET 8.0 Web API)

The backend provides the central REST API, business logic validation, and database operations.

```powershell
# Navigate to the backend project directory
cd backend\SmartSolarMicrogrid.API

# Restore NuGet dependencies
dotnet restore

# Run the API server
dotnet run
```

* **API Server URL**: `http://localhost:5299`
* **Interactive Swagger UI**: `http://localhost:5299/swagger`
* **Database Connection**: Configured in `appsettings.json` under `MongoDbSettings:ConnectionString`. The application automatically seeds initial admin, operator, and sample microgrid nodes upon first startup.

---

### 2. Frontend Setup (React 19 Web App)

The web dashboard is used by Backoffice Administrators and Grid Operators.

```powershell
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

* **Web Application URL**: `http://localhost:5173`
* Communicates directly with the backend API on port `5299`.

---

### 3. Mobile Application Setup (Pure Native Android)

The mobile app is built exclusively using pure native Android (Java) and a local SQLite database with zero cross-platform frameworks.

#### Step A: Configure Google Maps API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Maps SDK for Android** in your project APIs.
3. Under **Credentials**, create an API key (or restrict it to package `com.smartsolar.microgrid` and SHA-1: `C6:AD:56:E8:15:6E:A6:87:EE:63:23:BA:8A:FF:88:98:D8:80:45:D9`).
4. Paste your key into `mobile/app/src/main/res/values/google_maps_api.xml`:
   ```xml
   <resources>
       <string name="google_maps_key" templateMergeStrategy="preserve">YOUR_API_KEY_HERE</string>
   </resources>
   ```

#### Step B: Run on Android Emulator (1-Click)
Make sure an AVD (e.g., `Medium_Phone_API_36` or any API 26+ device) is created in Android Studio.

**Via IDE Menu / Keyboard Shortcut:**
* Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (or click **Terminal > Run Build Task...**).

**Or via PowerShell:**
```powershell
.\run-emulator.ps1
```
*What this script does automatically:*
1. Boots the Android Emulator with a visible GUI window.
2. Bridges port 5299 (`adb -e reverse tcp:5299 tcp:5299`) so the app seamlessly talks to your local backend API.
3. Incrementally builds the debug APK (`app-debug.apk`).
4. Installs and launches the app directly on the emulator.

#### Step C: Run on Physical Android Phone via USB (1-Click)
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone to your PC via a USB cable. Tap **Allow USB Debugging** on your phone screen.
3. Run the 1-click script:
   ```powershell
   .\run-phone.ps1
   ```
   *(Or in the IDE: **Terminal > Run Task... > Run Mobile App on Phone (1-Click)**).*
   This automatically routes `127.0.0.1:5299` through ADB reverse to your physical phone.

#### Step D: Build APK Manually via Command Line
```powershell
cd mobile
.\gradlew.bat assembleDebug
cd ..
```
* The compiled APK will be generated at: `mobile/app/build/outputs/apk/debug/app-debug.apk`.
* To perform a clean rebuild: `.\gradlew.bat clean assembleDebug`.

---

## Default Credentials & Roles

| Role | Username | Password | Purpose / Access Scope |
| :--- | :--- | :--- | :--- |
| **Backoffice Admin** | `admin` | `admin123` | Full governance, prosumer account approval, system logs |
| **Grid Operator** | `gridoperator` | `operator123` | Station queue, QR token scanning, finalizing energy delivery |
| **Solar Prosumer** | *(Self-registered)* | *(Your password)* | Registered via Mobile/Web using National Identity Card (**NIC**) as primary key |

---

## Mobile Application Features & Compliance

The mobile application satisfies all project criteria:

### 1. Pure Native Android & Local SQLite (No Frameworks)
- Developed purely with native Java 8/17, Android SDK 34, AndroidX, and Material Design 3.
- Features a local SQLite database (`DatabaseHelper.java`) implementing `SQLiteOpenHelper` without external ORMs or cross-platform wrappers (no Flutter, React Native, Cordova, or MAUI).
- Caches authenticated user sessions, microgrid node locations, and reservations locally for rapid offline browsing.

### 2. Prosumer Account Control
- **NIC Primary Key**: Prosumers register using their Sri Lankan NIC as their primary unique identifier (`RegisterActivity.java`).
- **Profile Management**: Prosumers can inspect and modify contact details, installed solar capacity (kW), and primary microgrid substation (`ProfileActivity.java`).
- **Account Deactivation**: Self-service deactivation workflow (`DeactivateAccountActivity.java`) that verifies and prevents deactivation if active or pending reservation commitments exist.

### 3. Reservation & QR Dispatch
- **Slot Booking**: Browse available capacity and reserve energy drop-off or charging slots (`CreateReservationActivity.java`).
- **Modification & Cancellation**: Update reservation parameters or cancel bookings adhering to the strict **12-hour advance notice window rule** (`UpdateReservationActivity.java`, `CancelReservationActivity.java`).
- **Encrypted QR Dispatch**: Once a reservation is approved, the app dynamically generates a secure high-resolution QR token (`QrGeneratorActivity.java`) encoding the reservation ID, prosumer NIC, energy volume, timestamp, and substation ID using ZXing.

### 4. Real-Time Dashboard, Search & Google Maps
- **Live Counter Widgets**: Dashboard displays real-time badges for Approved Future Bookings, Pending Bookings, Active Bookings, and Total Energy Traded (kWh).
- **Google Maps Station Locator**: Interactive Google Maps view (`MapActivity.java`) plotting all operational microgrid nodes with custom capacity pins, live availability indicators, and location distances.
- **Search & Filter**: Search bookings by keyword, reservation ID, station node, or status (`SearchBookingActivity.java`), and view historical logs (`BookingHistoryActivity.java`).

### 5. Operator Mode
- **QR Code Scanning**: Hardware camera-based scanner (`QrScannerActivity.java`) utilizing ZXing to decode prosumer tokens in milliseconds.
- **Server Verification**: Scanned tokens are verified live against the ASP.NET Core database (`VerifyTransactionActivity.java`) to ensure validity and prevent double-spending.
- **Finalize Energy Transfer**: The operator verifies physical delivery and executes `Finalize Energy Transfer & Mark Done`, which concludes the transaction and updates central ledgers.

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT Bearer Token |
| `POST` | `/api/auth/register` | Register new Prosumer with NIC as unique identifier |
| `GET` | `/api/dashboard/stats` | Dynamic metrics (Pending, Approved Future, Completed) |
| `GET` | `/api/dashboard/monitoring` | Operational telemetry & recent event audits |
| `GET` | `/api/microgrid` | List all microgrid nodes and geo-coordinates |
| `GET` | `/api/energyslot/available` | Available energy trading slots |
| `POST` | `/api/reservation` | Create new slot reservation |
| `PUT` | `/api/reservation/{id}` | Modify reservation (12-hour notice check) |
| `DELETE` | `/api/reservation/{id}` | Cancel reservation |
| `GET` | `/api/booking/current` | Active claimed bookings |
| `GET` | `/api/booking/pending` | Bookings awaiting operator approval |
| `GET` | `/api/booking/history` | Concluded & cancelled booking history |
| `GET` | `/api/booking/search` | Multi-criteria query engine |
| `GET` | `/api/booking/{id}/details`| Comprehensive 360° booking details |
| `PUT` | `/api/booking/{id}/confirm`| Approve/confirm pending booking |
| `PUT` | `/api/booking/{id}/complete`| Conclude energy transfer transaction |
| `PUT` | `/api/prosumer/{nic}/deactivate` | Deactivate prosumer account with active slot checks |

---

## Troubleshooting & FAQs

### 1. Google Maps displays a blank beige grid with Google watermark
* **Cause**: The Google Maps API key in `google_maps_api.xml` is missing or has not enabled the **Maps SDK for Android** in the Google Cloud Console.
* **Fix**: Ensure "Maps SDK for Android" is enabled in your Google Cloud project. If API key restrictions are used, add the debug keystore SHA-1 fingerprint:
  `C6:AD:56:E8:15:6E:A6:87:EE:63:23:BA:8A:FF:88:98:D8:80:45:D9` with package name `com.smartsolar.microgrid`.

### 2. Mobile app shows "Network error" or cannot connect to backend
* **On Emulator**: Android emulators access the host machine's localhost via `http://10.0.2.2:5299`. The app automatically detects the emulator environment and selects this URL.
* **On Physical Phone**: Run `adb -d reverse tcp:5299 tcp:5299` (or run `.\run-phone.ps1`), allowing your phone to talk to `http://127.0.0.1:5299` via the USB cable.

### 3. Emulator running in the background without a window
* If an emulator was previously started headlessly, run `.\run-emulator.ps1`. The script checks for visible window handles, cleanly restarts invisible instances, and brings the Android window into focus.

### 4. Port 5299 already in use
* If another instance of the backend is active, run `Get-Process -Id (Get-NetTCPConnection -LocalPort 5299).OwningProcess | Stop-Process -Force` in PowerShell.

---

## License & Academic Disclaimer

Developed for the **SE4040 Enterprise Application Development** curriculum. All rights reserved. Designed to demonstrate native Android enterprise architecture, asynchronous RESTful microservices, and modern web telemetry integration.
