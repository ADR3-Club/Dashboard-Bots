require('dotenv').config();
const database = require('../src/config/database');
const bcrypt = require('bcrypt');

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scripts/create-user.js <username> <password>');
    process.exit(1);
  }

  const [username, password] = args;

  try {
    await database.connect();

    // Check if user already exists
    const existingUser = await database.get('SELECT * FROM users WHERE username = ?', [username]);

    if (existingUser) {
      console.error(`Error: User '${username}' already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    await database.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    console.log(`✓ User '${username}' created successfully`);

  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

createUser();
