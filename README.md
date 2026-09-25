# Smart Solar Microgrid Trading System

A full-stack enterprise web application for managing the trading and transfer of solar energy through microgrid nodes.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19 + Vite                     |
| Backend    | C# .NET 8.0 Web API                |
| Database   | MongoDB Atlas (NoSQL)               |
| Auth       | JWT Bearer Tokens + BCrypt          |
| API Docs   | Swagger / OpenAPI                   |

## Project Structure

```
smart-solar-microgrid/
├── frontend/          # React + Vite web application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-based page components
│   │   ├── services/    # API service layer (Axios)
│   │   └── utils/       # Auth utilities
│   └── ...
├── backend/           # C# .NET 8.0 Web API
│   └── SmartSolarMicrogrid.API/
│       ├── Controllers/   # REST API endpoints
│       ├── Services/      # Business logic (FAT Service pattern)
│       ├── Repositories/  # Data access layer
│       ├── Models/        # MongoDB document models + DTOs
│       ├── Data/          # MongoDB context
│       └── Middleware/    # Global exception handling
└── docs/              # Documentation
```

## Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- MongoDB Atlas account (or local MongoDB instance)

### Backend Setup

```bash
cd backend
dotnet restore
dotnet run --project SmartSolarMicrogrid.API
```
The API will start on `http://localhost:5299`
Swagger UI: `http://localhost:5299/swagger`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The web app will start on `http://localhost:5173`

## Default Login Credentials

| Role           | Username       | Password     |
|----------------|----------------|--------------|
| Backoffice     | admin          | admin123     |
| Grid Operator  | gridoperator   | operator123  |

## API Endpoints

| Endpoint                        | Method | Description                                      |
|---------------------------------|--------|--------------------------------------------------|
| `/api/auth/login`               | POST   | User authentication                             |
| `/api/dashboard/stats`          | GET    | Dynamic metrics (Pending & Approved Future Resv) |
| `/api/dashboard/monitoring`     | GET    | Real-time operational monitoring & recent events |
| `/api/prosumer`                 | CRUD   | Prosumer management (NIC as primary identifier)  |
| `/api/microgrid`                | CRUD   | Microgrid node management & geo-mapping          |
| `/api/energyslot`               | CRUD   | Energy slot inventory management                 |
| `/api/booking/current`          | GET    | Active claimed bookings with counterpart details |
| `/api/booking/pending`          | GET    | Pending bookings awaiting confirmation           |
| `/api/booking/history`          | GET    | Completed and cancelled historical bookings      |
| `/api/booking/search`           | GET    | Multi-criteria search & filtering                |
| `/api/booking/{id}/details`     | GET    | Complete 360° operational booking breakdown      |
| `/api/booking/{id}/confirm`     | PUT    | Confirm & approve pending booking                |
| `/api/booking/{id}/complete`    | PUT    | Mark booking as concluded                        |
| `/api/booking/{id}/cancel`      | PUT    | Terminate / cancel booking                       |
| `/api/reservation`              | CRUD   | Reservation management (7-day rule, 12h notice)  |

## Phase 5 – Member 4: Booking Operations & Monitoring

- **Operational Dashboard**: Real-time aggregated overview featuring pending reservation counts, approved future reservation counts (marking scheme compliant), active bookings, energy traded volume (kWh & $), and live activity feeds with auto-refresh.
- **Current Bookings**: Live tracking of active energy slots with buyer/seller counterpart contact details, schedules, and complete/cancel actions.
- **Pending Bookings**: Centralized approval queue for pending energy trades with instant state refresh.
- **Booking History**: Full audit trail of concluded and cancelled transactions with multi-status filtering.
- **Booking Details**: 360-degree operational view linking prosumer profiles, microgrid nodes, and audit timestamps.
- **Search & Filtering**: Multi-criteria query engine supporting keyword search, microgrid node filtering, date selection, and status filters.

## User Roles

- **Backoffice**: Full administrative access including prosumer activation and operational governance
- **Grid Operator**: Operational access for grid, slot reservations, and booking management

## Team

Smart Solar Microgrid Team – University Group Project
- **Member 1**: Microgrid Nodes & Energy Supply
- **Member 2**: Prosumer Management & Account Activation
- **Member 3**: Energy Slot & Reservation Management
- **Member 4**: Booking Operations, Dashboard and Monitoring
