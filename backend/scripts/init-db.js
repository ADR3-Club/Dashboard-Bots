require('dotenv').config();
const database = require('../src/config/database');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Connect to database
    await database.connect();

    // Run migrations
    await database.initialize();

    // Check if admin user exists
    const existingUser = await database.get('SELECT * FROM users WHERE username = ?', ['admin']);

    if (!existingUser) {
      // Create default admin user
      console.log('Creating default admin user...');
      const password = 'admin123'; // Default password - should be changed
      const passwordHash = await bcrypt.hash(password, 10);

      await database.run(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        ['admin', passwordHash]
      );

      console.log('✓ Default admin user created');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('  ⚠️  Please change this password after first login!');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('✓ Database initialized successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

initDatabase();
