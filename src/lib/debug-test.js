const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function debugConnection() {
  console.log('🔍 Debugging PostgreSQL Connection...');
  console.log('📊 Environment Variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL);
  console.log('   DB_HOST:', process.env.DB_HOST);
  console.log('   DB_PORT:', process.env.DB_PORT);
  console.log('   DB_NAME:', process.env.DB_NAME);
  console.log('   DB_USER:', process.env.DB_USER);
  console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'NOT SET');
  
  // Parse connection string
  const url = new URL(process.env.DATABASE_URL);
  console.log('\n🔗 Parsed Connection Details:');
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port);
  console.log('   Database:', url.pathname.substring(1));
  console.log('   Username:', url.username);
  console.log('   Password:', url.password ? '****' : 'NOT SET');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    console.log('\n📋 Testing basic query...');
    const res = await client.query('SELECT current_user, current_database(), version()');
    console.log('   Current User:', res.rows[0].current_user);
    console.log('   Current Database:', res.rows[0].current_database);
    console.log('   PostgreSQL Version:', res.rows[0].version);
    
    console.log('\n📋 Testing table queries...');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('   Users table count:', userCount.rows[0].count);
    
    const profileCount = await client.query('SELECT COUNT(*) as count FROM profiles');
    console.log('   Profiles table count:', profileCount.rows[0].count);
    
    await client.end();
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message);
    console.error('   Code:', err.code);
    console.error('   Detail:', err.detail);
    
    // Try to get more details
    if (err.code === '28P01') {
      console.error('   🔐 Authentication failed - check username/password');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   🌐 Connection refused - check if PostgreSQL is running');
    } else if (err.code === 'ENOTFOUND') {
      console.error('   🔍 Host not found - check hostname');
    }
    
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

debugConnection();
