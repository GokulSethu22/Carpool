-- schema.sql — Database schema for the Carpool app. All tables, indexes, and constraints.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  phone         TEXT,
  created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT    NOT NULL CHECK(type IN ('bike', 'auto', 'cab')),
  registration  TEXT    NOT NULL,
  model         TEXT    NOT NULL,
  colour        TEXT    NOT NULL,
  seat_capacity INTEGER NOT NULL CHECK(seat_capacity >= 1 AND seat_capacity <= 10),
  UNIQUE(user_id, registration)
);

CREATE TABLE IF NOT EXISTS routes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id       INTEGER NOT NULL REFERENCES users(id),
  vehicle_id      INTEGER NOT NULL REFERENCES vehicles(id),
  origin_name     TEXT    NOT NULL,
  origin_lat      REAL    NOT NULL,
  origin_lng      REAL    NOT NULL,
  destination_name TEXT   NOT NULL,
  dest_lat        REAL    NOT NULL,
  dest_lng        REAL    NOT NULL,
  waypoints       TEXT    DEFAULT '[]',
  route_geometry  TEXT    DEFAULT '',
  departure_time  TEXT    NOT NULL,
  recurring_days  TEXT,
  seats_offered   INTEGER NOT NULL CHECK(seats_offered >= 1),
  seats_available INTEGER NOT NULL CHECK(seats_available >= 0),
  price_per_km    REAL    NOT NULL CHECK(price_per_km > 0),
  status          TEXT    DEFAULT 'active' CHECK(status IN ('active', 'in_progress', 'paused', 'cancelled', 'completed')),
  notes           TEXT,
  created_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id      INTEGER NOT NULL REFERENCES routes(id),
  rider_id      INTEGER NOT NULL REFERENCES users(id),
  pickup_name   TEXT    NOT NULL,
  pickup_lat    REAL    NOT NULL,
  pickup_lng    REAL    NOT NULL,
  drop_name     TEXT    NOT NULL,
  drop_lat      REAL    NOT NULL,
  drop_lng      REAL    NOT NULL,
  seats_booked  INTEGER NOT NULL DEFAULT 1 CHECK(seats_booked >= 1),
  fare          REAL    NOT NULL CHECK(fare >= 0),
  status        TEXT    DEFAULT 'requested'
                        CHECK(status IN ('requested', 'confirmed', 'declined', 'cancelled', 'in_progress', 'completed')),
  created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ratings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id    INTEGER NOT NULL REFERENCES bookings(id),
  from_user_id  INTEGER NOT NULL REFERENCES users(id),
  to_user_id    INTEGER NOT NULL REFERENCES users(id),
  score         INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
  comment       TEXT,
  created_at    TEXT    DEFAULT (datetime('now')),
  UNIQUE(booking_id, from_user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  message     TEXT    NOT NULL,
  type        TEXT    NOT NULL,
  related_id  INTEGER,
  is_read     INTEGER DEFAULT 0,
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id      INTEGER NOT NULL REFERENCES users(id),
  reported_user_id INTEGER NOT NULL REFERENCES users(id),
  reason           TEXT    NOT NULL,
  created_at       TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id  INTEGER NOT NULL REFERENCES users(id),
  blocked_id  INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT    DEFAULT (datetime('now')),
  UNIQUE(blocker_id, blocked_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_routes_driver     ON routes(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_route    ON bookings(route_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_rider    ON bookings(rider_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user   ON ratings(to_user_id);
