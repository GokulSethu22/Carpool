// seed.ts — Database seeding script with realistic Tamil Nadu routes, vehicles, users, and bookings.
import bcrypt from 'bcryptjs';
import { getDb } from './connection';

export function runSeed(): void {
  const db = getDb();
  // eslint-disable-next-line no-console
  console.log('Seeding database with Tamil Nadu commuter data...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  db.transaction(() => {
    // Clear existing data
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM ratings').run();
    db.prepare('DELETE FROM bookings').run();
    db.prepare('DELETE FROM routes').run();
    db.prepare('DELETE FROM vehicles').run();
    db.prepare('DELETE FROM reports').run();
    db.prepare('DELETE FROM blocks').run();
    db.prepare('DELETE FROM users').run();

    // 1. Users
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone)
      VALUES (?, ?, ?, ?)
    `);

    const u1 = insertUser.run('Kavitha Selvam', 'kavitha@example.com', passwordHash, '+919876543210').lastInsertRowid;
    const u2 = insertUser.run('Rajesh Kumar', 'rajesh@example.com', passwordHash, '+919876543211').lastInsertRowid;
    const u3 = insertUser.run('Priya Murugan', 'priya@example.com', passwordHash, '+919876543212').lastInsertRowid;
    const u4 = insertUser.run('Arun Natarajan', 'arun@example.com', passwordHash, '+919876543213').lastInsertRowid;
    const u5 = insertUser.run('Deepa Chandran', 'deepa@example.com', passwordHash, '+919876543214').lastInsertRowid;
    const u6 = insertUser.run('Suresh Raman', 'suresh@example.com', passwordHash, '+919876543215').lastInsertRowid;

    // 2. Vehicles
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (user_id, type, registration, model, colour, seat_capacity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const v1 = insertVehicle.run(u1, 'cab', 'TN 09 AB 1234', 'Maruti Suzuki Dzire', 'White', 4).lastInsertRowid;
    const v2 = insertVehicle.run(u2, 'auto', 'TN 01 CD 5678', 'Bajaj RE', 'Yellow', 3).lastInsertRowid;
    const v3 = insertVehicle.run(u3, 'bike', 'TN 11 EF 9012', 'Honda Activa 6G', 'Black', 1).lastInsertRowid;
    const v4 = insertVehicle.run(u4, 'cab', 'TN 38 GH 3456', 'Hyundai i20', 'Silver', 4).lastInsertRowid;
    const v5 = insertVehicle.run(u5, 'auto', 'TN 45 IJ 7890', 'TVS King Deluxe', 'Green', 3).lastInsertRowid;
    const v6 = insertVehicle.run(u6, 'cab', 'TN 09 KL 2345', 'Toyota Innova Crysta', 'White', 6).lastInsertRowid;

    // 3. Routes
    const insertRoute = db.prepare(`
      INSERT INTO routes (
        driver_id, vehicle_id, origin_name, origin_lat, origin_lng,
        destination_name, dest_lat, dest_lng, waypoints, route_geometry,
        departure_time, recurring_days, seats_offered, seats_available,
        price_per_km, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const datePrefix = tomorrow.toISOString().split('T')[0];

    // Chennai Route 1: Tambaram -> Guindy -> T. Nagar (Kavitha)
    const r1 = insertRoute.run(
      u1,
      v1,
      'Tambaram Sanatorium, Chennai',
      12.9249,
      80.10,
      'T. Nagar, Chennai',
      13.0418,
      80.2341,
      JSON.stringify([{ name: 'Guindy Kathipara Junction', lat: 13.0067, lng: 80.2206 }]),
      '',
      `${datePrefix}T08:30:00`,
      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
      3,
      2, // 1 seat already booked below
      14,
      'Office commute via GST Road and Anna Salai. AC cab.',
    ).lastInsertRowid;

    // Chennai Route 2: Velachery -> Sholinganallur -> Siruseri (Rajesh - Auto)
    insertRoute.run(
      u2,
      v2,
      'Velachery Vijayanagar, Chennai',
      12.9815,
      80.218,
      'Siruseri SIPCOT, OMR',
      12.8231,
      80.2196,
      JSON.stringify([{ name: 'Sholinganallur Signal', lat: 12.901, lng: 80.2279 }]),
      '',
      `${datePrefix}T09:00:00`,
      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      3,
      3,
      12,
      'OMR IT corridor daily commute. Clean auto, music on request.',
    );

    // Chennai Route 3: Anna Nagar -> Koyambedu -> Central (Priya - Bike)
    insertRoute.run(
      u3,
      v3,
      'Anna Nagar West, Chennai',
      13.085,
      80.2101,
      'Chennai Central Railway Station',
      13.0827,
      80.2707,
      JSON.stringify([{ name: 'Koyambedu Roundtana', lat: 13.0694, lng: 80.1948 }]),
      '',
      `${datePrefix}T08:00:00`,
      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
      1,
      1,
      5,
      'Pillion helmet provided. Quick morning commute.',
    );

    // Coimbatore Route: Gandhipuram -> Peelamedu -> Avinashi Road (Arun)
    insertRoute.run(
      u4,
      v4,
      'Gandhipuram Bus Stand, Coimbatore',
      11.0168,
      76.9558,
      'Avinashi Road / CIT, Coimbatore',
      11.036,
      77.03,
      JSON.stringify([{ name: 'Peelamedu Airport Road', lat: 11.0283, lng: 77.0054 }]),
      '',
      `${datePrefix}T09:30:00`,
      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
      4,
      4,
      14,
      'Daily morning trip toward TIDEL Park / CIT.',
    );

    // Madurai Route: Thirupparankundram -> Periyar -> Mattuthavani (Deepa - Auto)
    insertRoute.run(
      u5,
      v5,
      'Thirupparankundram, Madurai',
      9.8744,
      78.0657,
      'Mattuthavani Integrated Bus Terminus, Madurai',
      9.9408,
      78.145,
      JSON.stringify([{ name: 'Periyar Bus Stand', lat: 9.9252, lng: 78.1198 }]),
      '',
      `${datePrefix}T07:30:00`,
      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      3,
      3,
      12,
      'Crosses through Madurai city center. Fixed timings.',
    );

    // Intercity Route: Chengalpattu -> Tambaram (Suresh - Innova)
    const r6 = insertRoute.run(
      u6,
      v6,
      'Chengalpattu New Bus Stand',
      12.6819,
      79.9888,
      'Tambaram Railway Station, Chennai',
      12.9249,
      80.10,
      JSON.stringify([{ name: 'Guduvanchery Junction', lat: 12.8434, lng: 80.0592 }]),
      '',
      `${datePrefix}T07:00:00`,
      null, // one-time run
      6,
      6,
      14,
      'Spacious AC Innova. Ideal for early morning airport and train commuters.',
    ).lastInsertRowid;

    // 4. Sample Bookings
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        route_id, rider_id, pickup_name, pickup_lat, pickup_lng,
        drop_name, drop_lat, drop_lng, seats_booked, fare, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Confirmed booking on Kavitha's route by Priya
    const b1 = insertBooking.run(
      r1,
      u3,
      'Chromepet GST Road',
      12.9516,
      80.1462,
      'Guindy Kathipara',
      13.0067,
      80.2206,
      1,
      75.5,
      'confirmed',
    ).lastInsertRowid;

    // Completed past booking on Suresh's route by Arun
    const b2 = insertBooking.run(
      r6,
      u4,
      'Maraimalai Nagar',
      12.7932,
      80.0256,
      'Tambaram Station',
      12.9249,
      80.10,
      1,
      110.0,
      'completed',
    ).lastInsertRowid;

    // 5. Sample Ratings
    const insertRating = db.prepare(`
      INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertRating.run(b2, u4, u6, 5, 'Very comfortable journey and on-time pickup in Maraimalai Nagar!');
    insertRating.run(b2, u6, u4, 5, 'Pleasant passenger, exact change and ready at the pickup spot.');

    // 6. Sample Notifications
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, message, type, related_id, is_read)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertNotif.run(u1, 'Priya Murugan booked 1 seat for route #1 (Tambaram to T. Nagar)', 'booking_confirmed', b1, 1);
    insertNotif.run(u3, 'Your booking for route #1 was confirmed by Kavitha Selvam.', 'booking_confirmed', b1, 0);
  })();

  // eslint-disable-next-line no-console
  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  runSeed();
}
