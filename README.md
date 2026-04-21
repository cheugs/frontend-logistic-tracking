# LogisticsFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

## Code scaffolding
 
```bash
ng generate component component-name
```
 Based on your logistics system document, here's a complete frontend organization plan with **3 distinct dashboards** for each actor.

---

## ACTORS & THEIR DASHBOARDS

| Actor | Dashboard Name | Primary Goal |
|--------|----------------|---------------|
| **Customer** (Sender/Receiver) | Customer Dashboard | Create parcels, track deliveries, make payments |
| **Delivery Agent** | Agent Dashboard | View assigned parcels, update location, complete deliveries |
| **System Admin** | Admin Dashboard | Manage agencies, monitor API usage, view all parcels |

---

## PAGE STRUCTURE & ROUTING

```
/
├── login
├── register
├── customer/
│   ├── dashboard
│   ├── create-parcel
│   ├── track-parcel/:id
│   ├── payment/:parcelId
│   └── history
├── agent/
│   ├── dashboard
│   ├── my-deliveries
│   ├── live-tracking/:parcelId
│   └── delivery-history
├── admin/
│   ├── dashboard
│   ├── agencies
│   ├── parcels
│   ├── routes-cache
│   ├── api-usage
│   └── users
└── shared/
    ├── map-view
    └── notifications
```

---

## 1. CUSTOMER DASHBOARD

### Pages & Content

| Page | Route | Key Features |
|-------|-------|---------------|
| **Dashboard** | `/customer/dashboard` | Overview of active parcels, recent deliveries, payment status, notifications |
| **Create Parcel** | `/customer/create-parcel` | - Select country → town<br>- Choose pickup/delivery agency OR manual address entry<br>- Enter weight (kg), fragility level (1-10 slider)<br>- Display calculated cost in real-time<br>- Submit button |
| **Track Parcel** | `/customer/track-parcel/:id` | - Live map with GPS position<br>- Progress bar (25%/50%/75%/100%)<br>- Estimated arrival time<br>- Status timeline (CREATED → IN_TRANSIT → DELIVERED)<br>- Notification log |
| **Payment** | `/customer/payment/:parcelId` | - Show cost breakdown (base + distance + fragility)<br>- Payment button (simulated or Stripe/PayPal)<br>- Status after payment |
| **History** | `/customer/history` | Table of all parcels with filters (status, date range) |

### Links between pages:
```
Dashboard → [Create New Parcel] → Create Parcel
Dashboard → [Track] on any parcel → Track Parcel
Create Parcel → [Pay Now] → Payment → back to Dashboard
Track Parcel → [View All] → History
```

---

## 2. DELIVERY AGENT DASHBOARD

> *Assumption: Each parcel has ONE assigned agent (per document)*

### Pages & Content

| Page | Route | Key Features |
|-------|-------|---------------|
| **Dashboard** | `/agent/dashboard` | - Today's deliveries count<br>- Active parcels in progress<br>- Map preview of current route<br>- Next delivery ETA |
| **My Deliveries** | `/agent/my-deliveries` | List of assigned parcels with:<br>- Pickup/delivery addresses<br>- Fragility level (⚠️ warning if high)<br>- Status (PENDING/IN_TRANSIT/DELIVERED)<br>- Start Delivery button |
| **Live Tracking** | `/agent/live-tracking/:parcelId` | - GPS simulation controls (start/pause)<br>- Current position on map<br>- Route segments with road type colors<br>- Speed adjustment shown (base × fragility)<br>- Update position manually (for testing)<br>- Mark Delivered button |
| **Delivery History** | `/agent/delivery-history` | Completed deliveries with timestamps, ratings (optional) |

### Links:
```
Dashboard → [View All Deliveries] → My Deliveries
My Deliveries → [Start] on parcel → Live Tracking
Live Tracking → [Complete] → Dashboard (updated)
```

---

## 3. ADMIN DASHBOARD

### Pages & Content

| Page | Route | Key Features |
|-------|-------|---------------|
| **Dashboard** | `/admin/dashboard` | - Total parcels (today/week)<br>- API calls remaining / used<br>- Cache hit rate<br>- Active agents online<br>- System health |
| **Agencies** | `/admin/agencies` | CRUD operations:<br>- Add/Edit/Delete agency<br>- Fields: name, country, town, lat, lng<br>- Pre-store coordinates (no API call for customers) |
| **Parcels** | `/admin/parcels` | - All parcels in system<br>- Filter by status, date, fragility<br>- View details of any parcel<br>- Force status change (admin override) |
| **Route Cache** | `/admin/routes-cache` | - View cached routes (source → destination)<br>- Delete expired/incorrect cache<br>- Manual cache entry |
| **API Usage** | `/admin/api-usage` | - Geocoding API calls chart<br>- Routing API calls chart<br>- Cache efficiency metrics<br>- Rate limit alerts |
| **Users** | `/admin/users` | - List customers and agents<br>- Promote customer → agent<br>- Disable accounts |

### Links:
```
Dashboard → [Manage Agencies] → Agencies
Dashboard → [View All Parcels] → Parcels
Dashboard → [API Stats] → API Usage
Parcels → [View Route Cache] → Route Cache
```

---

## SHARED COMPONENTS (Reused across dashboards)

| Component | Used In | Description |
|-----------|---------|-------------|
| **LiveMap** | Customer Track, Agent Live Tracking, Admin Parcels | Leaflet/Google Maps showing parcel position, route polyline |
| **StatusBadge** | All dashboards | Colored badge: CREATED (blue), IN_TRANSIT (orange), DELIVERED (green) |
| **ProgressStepper** | Customer Track | Milestone steps: 25% → 50% → 75% → 100% |
| **NotificationToast** | All dashboards | Real-time alerts for PARCEL_LOCATION_UPDATED, PARCEL_DELIVERED |
| **SidebarNav** | All dashboards | Collapsible navigation with role-specific links |
| **CostCalculator** | Customer Create Parcel | Live calculation: `base_price * distance_factor + (fragility * 500)` |

---

## LOGIN / REGISTRATION

### Login Page (`/login`)
- Email + Password
- Role selection (Customer / Agent / Admin) — or auto-detect from backend

### Register Page (`/register`)
- Name, Email, Password
- Account type: Customer only (Admin/Agent created by existing admin)

---

## SUGGESTED API ENDPOINTS (Frontend will call)

| Method | Endpoint | Used By |
|--------|----------|---------|
| POST | `/api/parcels` | Customer |
| GET | `/api/parcels/:id` | Customer, Agent, Admin |
| GET | `/api/parcels/user` | Customer |
| GET | `/api/parcels/agent` | Agent |
| PUT | `/api/parcels/:id/location` | Agent (simulation) |
| PUT | `/api/parcels/:id/status` | Agent, Admin |
| POST | `/api/payments` | Customer |
| GET | `/api/agencies` | Customer, Admin |
| POST | `/api/agencies` | Admin |
| GET | `/api/routes/cached` | Admin |
| GET | `/api/analytics/api-usage` | Admin |

---

 