// tests/seats.test.ts — Unit tests for seat availability, overbooking prevention, and atomic transactions.
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const nodeRequire = createRequire(__filename);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = nodeRequire('node:sqlite');

interface TestDb {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...args: unknown[]) => unknown[];
    get: (...args: unknown[]) => unknown;
    run: (...args: unknown[]) => { lastInsertRowid: number | bigint; changes: number | bigint };
  };
  transaction: <T, Args extends unknown[]>(fn: (...args: Args) => T) => (...args: Args) => T;
}

describe('Seat Allocation and Overbooking Prevention', () => {
  let db: TestDb;

  beforeEach(() => {
    // Isolated in-memory SQLite database for test execution
    const raw = new DatabaseSync(':memory:') as TestDb;
    raw.transaction = <T, Args extends unknown[]>(fn: (...args: Args) => T) => {
      return (...args: Args): T => {
        raw.exec('BEGIN IMMEDIATE');
        try {
          const res = fn(...args);
          raw.exec('COMMIT');
          return res;
        } catch (err) {
          raw.exec('ROLLBACK');
          throw err;
        }
      };
    };

    raw.exec('PRAGMA foreign_keys = ON;');

    raw.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      );

      CREATE TABLE routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL REFERENCES users(id),
        seats_offered INTEGER NOT NULL,
        seats_available INTEGER NOT NULL CHECK(seats_available >= 0),
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL REFERENCES routes(id),
        rider_id INTEGER NOT NULL REFERENCES users(id),
        seats_booked INTEGER NOT NULL,
        status TEXT DEFAULT 'requested'
      );
    `);

    // Insert driver and riders
    raw.prepare("INSERT INTO users (name, email) VALUES ('Kavitha', 'k@test.com')").run();
    raw.prepare("INSERT INTO users (name, email) VALUES ('Rider A', 'ra@test.com')").run();
    raw.prepare("INSERT INTO users (name, email) VALUES ('Rider B', 'rb@test.com')").run();

    db = raw;
  });

  it('correctly allocates seats and decrements available count', () => {
    // Route created with 3 seats
    const route = db
      .prepare('INSERT INTO routes (driver_id, seats_offered, seats_available) VALUES (1, 3, 3)')
      .run();
    const routeId = route.lastInsertRowid;

    // Driver accepts booking of 2 seats
    db.transaction(() => {
      const currentRoute = db.prepare('SELECT seats_available FROM routes WHERE id = ?').get(routeId) as {
        seats_available: number;
      };
      expect(currentRoute.seats_available).toBe(3);

      db.prepare('UPDATE routes SET seats_available = seats_available - ? WHERE id = ?').run(2, routeId);
      db.prepare("INSERT INTO bookings (route_id, rider_id, seats_booked, status) VALUES (?, 2, 2, 'confirmed')").run(
        routeId,
      );
    })();

    const updated = db.prepare('SELECT seats_available FROM routes WHERE id = ?').get(routeId) as {
      seats_available: number;
    };
    expect(updated.seats_available).toBe(1);
  });

  it('strictly rejects overbooking via database constraint and transactional check', () => {
    // Route created with 1 seat
    const route = db
      .prepare('INSERT INTO routes (driver_id, seats_offered, seats_available) VALUES (1, 1, 1)')
      .run();
    const routeId = route.lastInsertRowid;

    // First booking takes 1 seat
    db.prepare('UPDATE routes SET seats_available = seats_available - 1 WHERE id = ?').run(routeId);

    // Second booking attempts to take 1 seat (exceeding capacity)
    expect(() => {
      db.transaction(() => {
        const currentRoute = db
          .prepare('SELECT seats_available FROM routes WHERE id = ?')
          .get(routeId) as { seats_available: number };

        if (currentRoute.seats_available < 1) {
          throw new Error('Not enough seats available');
        }

        db.prepare('UPDATE routes SET seats_available = seats_available - 1 WHERE id = ?').run(routeId);
      })();
    }).toThrow('Not enough seats available');

    // Also verify that SQLite CHECK constraint prevents negative seats if forced
    expect(() => {
      db.prepare('UPDATE routes SET seats_available = seats_available - 1 WHERE id = ?').run(routeId);
    }).toThrow(/CHECK constraint failed/);
  });

  it('restores seats to available pool when a confirmed booking is cancelled', () => {
    const route = db
      .prepare('INSERT INTO routes (driver_id, seats_offered, seats_available) VALUES (1, 4, 2)')
      .run();
    const routeId = route.lastInsertRowid;

    const booking = db
      .prepare("INSERT INTO bookings (route_id, rider_id, seats_booked, status) VALUES (?, 2, 2, 'confirmed')")
      .run(routeId);
    const bookingId = booking.lastInsertRowid;

    // Cancellation transaction
    db.transaction(() => {
      const b = db.prepare('SELECT seats_booked, status FROM bookings WHERE id = ?').get(bookingId) as {
        seats_booked: number;
        status: string;
      };
      if (b.status === 'confirmed') {
        db.prepare('UPDATE routes SET seats_available = seats_available + ? WHERE id = ?').run(
          b.seats_booked,
          routeId,
        );
      }
      db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId);
    })();

    const updatedRoute = db.prepare('SELECT seats_available FROM routes WHERE id = ?').get(routeId) as {
      seats_available: number;
    };
    expect(updatedRoute.seats_available).toBe(4); // 2 + 2 restored
  });
});
