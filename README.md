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

| Endpoint                        | Method | Description                    |
|---------------------------------|--------|--------------------------------|
| `/api/auth/login`               | POST   | User authentication            |
| `/api/dashboard/stats`          | GET    | Dashboard statistics           |
| `/api/prosumer`                 | CRUD   | Prosumer management            |
| `/api/microgrid`                | CRUD   | Microgrid node management      |
| `/api/energyslot`               | CRUD   | Energy slot management         |
| `/api/booking/current`          | GET    | Current bookings               |
| `/api/booking/pending`          | GET    | Pending bookings               |
| `/api/booking/history`          | GET    | Booking history                |
| `/api/reservation`              | CRUD   | Reservation management         |

## User Roles

- **Backoffice**: Full administrative access including prosumer activation
- **Grid Operator**: Operational access for grid and energy management

## Team

Smart Solar Microgrid Team – University Group Project
