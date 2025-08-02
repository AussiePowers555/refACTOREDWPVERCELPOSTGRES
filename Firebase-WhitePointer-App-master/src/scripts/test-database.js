// Simple script to test database functionality
const { DatabaseService } = require('../lib/database.ts');

try {
  console.log('🔍 Testing SQLite Database...');
  
  // Test contacts
  const contacts = DatabaseService.getAllContacts();
  console.log(`📞 Found ${contacts.length} contacts`);
  contacts.forEach(contact => {
    console.log(`  - ${contact.name} (${contact.type}): ${contact.email}`);
  });
  
  // Test workspaces
  const workspaces = DatabaseService.getAllWorkspaces();
  console.log(`🏢 Found ${workspaces.length} workspaces`);
  workspaces.forEach(workspace => {
    console.log(`  - ${workspace.name} (Contact ID: ${workspace.contactId})`);
  });
  
  // Test cases
  const cases = DatabaseService.getAllCases();
  console.log(`📋 Found ${cases.length} cases`);
  cases.forEach(caseItem => {
    console.log(`  - ${caseItem.case_number}: ${caseItem.client_name} (${caseItem.status})`);
  });
  
  // Test user accounts
  const users = DatabaseService.getAllUserAccounts();
  console.log(`👥 Found ${users.length} user accounts`);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.role}, ${user.status})`);
  });
  
  console.log('✅ Database test completed successfully!');
  
} catch (error) {
  console.error('❌ Database test failed:', error);
}