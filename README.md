# Carpool — Tamil Nadu Commuter Ride-Sharing App

Carpool is a local web application built for daily commuters in Tamil Nadu, India. Drivers publish routes they already travel (by bike, auto, or cab), and riders heading the same way book seats along that path and split the travel fare based on vehicle occupancy.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/) (version 9.x or higher)

---

## Quick Start (Localhost)

### 1. Install Dependencies

Install root dependencies as well as server and client dependencies:

```bash
# In the project root directory:
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Seed Sample Data

Load realistic Tamil Nadu commuter routes, vehicles, users, and bookings:

```bash
npm run seed
```

This populates the SQLite database (`server/data/carpool.db`) with:
- **6 Commuters**: Kavitha Selvam, Rajesh Kumar, Priya Murugan, Arun Natarajan, Deepa Chandran, Suresh Raman (password for all: `password123`)
- **6 Registered Vehicles**: Cabs, Autos, and Bikes with valid Tamil Nadu plates (e.g. `TN 09 AB 1234`)
- **Realistic Commute Corridors**: Chennai (Tambaram &rarr; Guindy &rarr; T. Nagar, Velachery &rarr; OMR Siruseri, Anna Nagar &rarr; Central), Coimbatore (Gandhipuram &rarr; Peelamedu), Madurai (Thirupparankundram &rarr; Mattuthavani), and Intercity (Chengalpattu &rarr; Tambaram).

### 3. Run the Application

Start both the Express backend API and the Vite frontend simultaneously:

```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## Running Automated Tests

Run the test suite verifying segment fare calculations, route matching spatial math, and transactional seat protection:

```bash
npm test
```

To run linter checks:

```bash
npm run lint
```

---

## Demo Accounts

You can log in with any of these sample accounts (password: `password123`):

| Name | Role | Email | Vehicle | City / Corridor |
| :--- | :--- | :--- | :--- | :--- |
| **Kavitha Selvam** | Driver (Cab) | `kavitha@example.com` | Dzire (`TN 09 AB 1234`) | Chennai: Tambaram &rarr; T. Nagar |
| **Rajesh Kumar** | Driver (Auto) | `rajesh@example.com` | Bajaj RE (`TN 01 CD 5678`) | Chennai: Velachery &rarr; OMR Siruseri |
| **Priya Murugan** | Driver (Bike) & Rider | `priya@example.com` | Activa (`TN 11 EF 9012`) | Chennai: Anna Nagar &rarr; Central |
| **Arun Natarajan** | Driver (Cab) | `arun@example.com` | i20 (`TN 38 GH 3456`) | Coimbatore: Gandhipuram &rarr; Peelamedu |
| **Deepa Chandran** | Driver (Auto) | `deepa@example.com` | TVS King (`TN 45 IJ 7890`) | Madurai: Thirupparankundram &rarr; Mattuthavani |
| **Suresh Raman** | Driver (Cab) | `suresh@example.com` | Innova (`TN 09 KL 2345`) | Intercity: Chengalpattu &rarr; Tambaram |

*(Tip: On the Login page, click any of the 1-click demo account buttons to sign in instantly).*

---

## Project Documentation

For interview explanations, architectural diagrams, algorithm details, and viva FAQs, refer to:
- [`docs/EXPLAIN.md`](docs/EXPLAIN.md)
