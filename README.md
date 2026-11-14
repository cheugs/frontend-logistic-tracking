# Logistics Tracking Frontend

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white) ![Angular Material](https://img.shields.io/badge/Angular%20Material-21-757575?logo=angular&logoColor=white) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white) ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)

The web client of a **parcel delivery and tracking platform**. One Angular application serves three kinds of users, each with their own space: **customers** who send and follow parcels, **delivery agents** who carry them, and **administrators** who supervise the whole system.

**Online preview:** https://cheugs.github.io/frontend-logistic-tracking/
*The preview shows the interface. Signing in needs the backend API, which runs locally (see [Run it locally](#run-it-locally)).*

**Author:** Chengho Fongang Marie Louise

---

## What each user can do

| Role | Pages | What they are for |
|---|---|---|
| **Customer** | Dashboard, send a package (step-by-step wizard), my packages, delivery details, track a parcel, account | Create a parcel, see what it costs, and follow it on a map until delivery |
| **Delivery agent** | Dashboard, my deliveries, live tracking, delivery history, parcel marketplace, trip planner, verification | Pick up parcels, follow the route, and keep a record of completed deliveries |
| **Administrator** | Dashboard, agencies, parcels, users, route cache, API usage, verification | Manage agencies and users, see every parcel, and monitor how much of the map API quota is used |

Public pages: landing, onboarding, login and registration.

## How it is built

```
src/app/
├── core/          guards (auth, role), JWT interceptor, typed models, app-wide services
├── features/
│   ├── auth/        login, register
│   ├── customer/    dashboard, parcel wizard, tracking, account
│   ├── agent/       deliveries, live tracking, trip planner
│   ├── admin/       agencies, parcels, users, API usage
│   ├── landing/
│   └── onboarding/
└── shared/        navbar, sidebars, map view, notifications, status badge, API services
```

- **Role-based access.** Three roles (`CUSTOMER`, `AGENT`, `ADMIN`). An auth guard and a role guard protect the routes, and an HTTP interceptor attaches the JWT to every API call.
- **Lazy loading.** The admin and agent areas are separate modules loaded on demand; customer pages are standalone components loaded one by one, so the first page stays light.
- **Maps.** Parcel and delivery tracking are drawn on OpenStreetMap with Leaflet, through a reusable `map-view` component.
- **One service per backend resource.** Parcels, trips, payments, wallet, agencies, routes cache, statistics and notifications each have a typed service and model.
- **Tests.** 29 spec files, run with Vitest.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Angular 21, TypeScript 5.9, RxJS |
| UI | Angular Material, Angular CDK, Bootstrap 5, ngx-toastr |
| Maps | Leaflet, ngx-leaflet |
| Auth | JWT (`@auth0/angular-jwt`), route guards, HTTP interceptor |
| Tests and tooling | Vitest, Prettier, Angular CLI |
| Deployment | GitHub Pages (`angular-cli-ghpages`) |

## The backend it talks to

This repository is the frontend only. It expects the logistics API on `http://localhost:8765` (set in `src/environments/environment.ts`). The backend design is a set of microservices (parcel, delivery, payment, notification) that communicate through events; it is described in [BackEnd-README.md](BackEnd-README.md).

## Run it locally

Requirements: Node.js 20 or later and npm.

```bash
git clone https://github.com/cheugs/frontend-logistic-tracking.git
cd frontend-logistic-tracking
npm install
npm start
```

Then open http://localhost:4200.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the unit tests |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run deploy` | Builds and publishes to GitHub Pages |

## Limits and next steps

- Without the backend running, pages that need data stay empty and sign-in fails.
- There are no screenshots in this README yet.
- No end-to-end tests yet.

## Skills shown

Angular application architecture (core / features / shared), role-based routing and guards, JWT authentication, lazy loading, interactive maps with Leaflet, typed REST services with RxJS, and deployment to GitHub Pages.
