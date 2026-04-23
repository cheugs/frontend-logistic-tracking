# 📦 Parcel/Logistics Tracking System

> A microservices-based parcel delivery platform with real-time GPS tracking, fragility-aware handling, and event-driven notifications.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Actors & Roles](#actors--roles)
- [Parcel Entity](#parcel-entity)
- [Delivery Simulation](#delivery-simulation)
- [Payment System](#payment-system)
- [Notifications & Events](#notifications--events)
- [API Caching Strategy](#api-caching-strategy)
- [User Interaction Flow](#user-interaction-flow)
- [Database Design](#database-design)
- [Technical Considerations](#technical-considerations)
- [Future Extensions](#future-extensions)
- [References & APIs](#references--apis)

---

## Overview

The **Parcel/Logistics Tracking System** manages parcel deliveries in a realistic, efficient, and scalable way. Core capabilities include:

- 📍 Real-time GPS tracking of parcels
- 🧊 Fragility-aware delivery speed and cost adjustments
- 💳 Secure payment processing before delivery begins
- 📧 Email/SMS notifications at delivery milestones
- 🗺️ Route simulation using real map data

---

## Architecture

The system follows a **microservices architecture**, with each service responsible for a specific function.

### Services

| Service               | Responsibility                                                          |
|-----------------------|-------------------------------------------------------------------------|
| **Parcel Service**    | Manages parcel creation, attributes, and tracking                       |
| **Delivery Service**  | Simulates delivery movement, calculates ETA, manages route segments     |
| **Payment Service**   | Handles payment calculation and processing before delivery              |
| **Notification Service** | Sends email/SMS notifications for delivery milestones               |

### High-Level Flow

```
Customer → Parcel Service → Delivery Service → Notification Service
                          ↘
                        Payment Service
```

- Services communicate via **event-driven architecture** (RabbitMQ or Kafka)
- **Docker Compose** orchestrates services for local development and testing

---

## Actors & Roles

| Actor              | Role                                                   | Purpose                                      |
|--------------------|--------------------------------------------------------|----------------------------------------------|
| **Customer**       | Creates parcels, selects locations, makes payments     | Primary user of the system                   |
| **Delivery Agent** | Moves parcels along simulated routes, updates location | Enables GPS tracking simulation              |
| **Admin**          | Monitors parcels, manages system issues                | Ensures smooth system operation              |
| **System**         | Processes events, updates statuses, sends notifications | Automates interactions and maintains consistency |

> **Note:** Each parcel is assigned to **one delivery agent** to simplify tracking. Multi-agent delivery is not implemented in the current version.

---

## Parcel Entity

Each parcel carries the following attributes:

| Attribute                  | Description                                              |
|----------------------------|----------------------------------------------------------|
| `id`                       | Unique parcel identifier                                 |
| `source_coords`            | Latitude/Longitude of pickup location                    |
| `destination_coords`       | Latitude/Longitude of delivery location                  |
| `source_agency`            | Predefined pickup agency (optional)                      |
| `destination_agency`       | Predefined delivery agency (optional)                    |
| `weight`                   | Parcel weight in kilograms                               |
| `fragility_level`          | Scale 1–10; affects handling, speed, and cost            |
| `delivery_status`          | Enum: `CREATED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`  |
| `estimated_delivery_time`  | Calculated based on distance, road type, and fragility   |
| `route_segments`           | List of coordinates and road types along the path        |

### Fragility Effect

- Higher fragility → slower adjusted speed → more careful handling
- Increases delivery cost due to extra care requirements

### Cost Calculation

```python
base_price      = 5000
fragility_level = 7
distance_factor = 1.2

final_price = base_price * distance_factor + (fragility_level * 500)
# Result: 5000 * 1.2 + (7 * 500) = 6000 + 3500 = 9500
```

---

## Delivery Simulation

The delivery simulation models parcel movement in real time using route data, speed adjustment, and GPS updates.

### Step 1 — Convert Addresses to Coordinates

- **Agency selected:** Coordinates are pre-stored → no API call needed
- **Manual address entered:** Uses geocoding API (Google Maps or Nominatim)
- Coordinates are cached for future use to reduce API calls

### Step 2 — Route Calculation

Map API (Google Directions / OpenRouteService) retrieves the real route, broken into segments by road type:

| Road Type   | Base Speed   |
|-------------|--------------|
| Town        | 60 km/h      |
| Highway     | 90 km/h      |
| Motorway    | 100 km/h     |

### Step 3 — Adjust Speed for Fragility

```
adjusted_speed = base_speed × (1 - fragility_level / 15)
```

Fragile parcels move slower, producing a realistic delivery simulation.

### Step 4 — Simulate GPS Movement

- Route stored in the database as a list of coordinates
- Delivery Service updates the parcel's current position at regular intervals
- Each update emits the event: `PARCEL_LOCATION_UPDATED`

### Step 5 — Event Handling & Notifications

- Notifications are triggered at delivery milestones: **25%, 50%, 75%, and 100% (delivered)**
- Frontend or mobile app consumes events to update the live parcel map

---

## Payment System

- Payment is **required before delivery** begins
- Cost is calculated based on:
  - **Distance** (from route segments)
  - **Parcel weight**
  - **Fragility level**
- On successful payment → parcel status changes from `PENDING` to `CREATED` → delivery simulation starts

> **Future option:** Cash-on-delivery support

---

## Notifications & Events

| Event                      | Trigger                          |
|----------------------------|----------------------------------|
| `PARCEL_CREATED`           | Payment successfully completed   |
| `PARCEL_LOCATION_UPDATED`  | GPS position update              |
| `PARCEL_DELIVERED`         | Delivery completed               |

- **Channels:** Email and SMS
- **Transport:** Kafka or RabbitMQ for event propagation between services

---

## API Caching Strategy

Free map APIs have request limits (e.g., Google Maps: 2,500 requests/day). The system handles this with a three-step caching strategy:

1. **Call API only when needed** — manual address entry or a genuinely new route
2. **Cache results** — store agency coordinates and computed route data in the database
3. **Reuse cached routes** — avoids redundant API calls, speeds up simulation, stays within free tier limits

---

## User Interaction Flow

```
1. User logs in
2. Selects country → town
3. Chooses pickup and delivery agency OR enters a custom address
4. Enters parcel details (weight, fragility level)
5. System calculates delivery cost → user pays
6. Parcel enters delivery simulation
7. User tracks parcel in real time on a map
8. Notifications sent at 25%, 50%, 75%, and delivery completion
9. Status updated to DELIVERED
```

---

## Database Design

### Parcel Table

| Column                  | Type       | Description         |
|-------------------------|------------|---------------------|
| `id`                    | UUID       | Parcel ID           |
| `source_agency_id`      | FK         | Pickup agency       |
| `destination_agency_id` | FK         | Delivery agency     |
| `weight`                | Float      | Parcel weight (kg)  |
| `fragility_level`       | Integer    | 1–10                |
| `status`                | Enum       | Delivery status     |
| `estimated_time`        | Datetime   | ETA                 |

### Agency Table

| Column      | Type    | Description   |
|-------------|---------|---------------|
| `id`        | UUID    | Agency ID     |
| `name`      | String  | Agency name   |
| `country`   | String  | Country       |
| `town`      | String  | Town          |
| `latitude`  | Float   | GPS latitude  |
| `longitude` | Float   | GPS longitude |

### Route Cache Table

| Column                  | Type   | Description                                          |
|-------------------------|--------|------------------------------------------------------|
| `id`                    | UUID   | Route ID                                             |
| `source_agency_id`      | FK     | Start agency                                         |
| `destination_agency_id` | FK     | End agency                                           |
| `route_data`            | JSON   | List of coordinates, road types, and segment distances |

### Event / Notification Table

Stores emitted events for parcel tracking and notification history.

---

## Technical Considerations

| Concern                    | Approach                                              |
|----------------------------|-------------------------------------------------------|
| Geocoding API limits       | Caching agency coordinates and route data             |
| Realistic routing          | Segments divided by road type with speed adjustments  |
| Fragility-aware simulation | Speed formula applied per segment                     |
| Performance                | API calls only at parcel creation; simulation uses DB |
| Single delivery agent      | Simplifies GPS tracking logic per parcel              |

---

## Future Extensions

- 🚦 **Traffic-aware routing** — adjust ETA based on live traffic data
- 👥 **Multi-agent delivery** — support for relay-style handoffs between agents
- 🌦️ **Weather-aware adjustments** — slow down fragile parcels in bad weather
- 🏠 **Door-to-door delivery** — precise geocoding for non-agency addresses

---

## References & APIs

| Category              | Options                                          |
|-----------------------|--------------------------------------------------|
| Geocoding             | Google Maps API, OpenStreetMap Nominatim         |
| Routing               | Google Directions API, OpenRouteService          |
| Notifications         | Email/SMS service provider (e.g., Twilio, SendGrid) |
| Event Streaming       | RabbitMQ, Apache Kafka                           |
| Scheduling/Simulation | Microservice logic, cron jobs, scheduled tasks   |

---

*Documentation generated: March 28, 2026*
