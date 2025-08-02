// Script to set password for a user
// Usage: node set-password.js <email> <password>

const [,, email, password] = process.argv;

if (!email || !password) {
  console.log('Usage: node set-password.js <email> <password>');
  console.log('Example: node set-password.js admin@example.com mypassword123');
  process.exit(1);
}

async function setPassword() {
  try {
    const response = await fetch('http://localhost:9006/api/auth/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅', result.message);
      console.log('User:', result.user);
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to set password:', error.message);
    console.log('\nMake sure the development server is running (npm run dev)');
  }
}

setPassword();