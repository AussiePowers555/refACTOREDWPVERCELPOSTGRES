import { CaseFrontend } from '@/lib/database-schema';

// Mock data matching the structure in the page
const mockCases: CaseFrontend[] = [
  {
    id: "case-001",
    caseNumber: "2025-001",
    clientName: "John Smith",
    status: "New Matter",
    lastUpdated: "2 hours ago",
    atFaultPartyName: "Jane Doe",
    clientInsuranceCompany: "AllState",
    atFaultPartyInsuranceCompany: "Geico",
    clientPhone: "555-1111",
    clientEmail: "john.s@example.com",
    clientStreetAddress: "123 Main St",
    clientSuburb: "Anytown",
    clientState: "NSW",
    clientPostcode: "2000",
    clientClaimNumber: "C001",
    clientInsurer: "",
    atFaultPartyPhone: "555-2222",
    atFaultPartyEmail: "jane.d@example.com",
    atFaultPartyStreetAddress: "456 Oak Ave",
    atFaultPartySuburb: "Otherville",
    atFaultPartyState: "NSW",
    atFaultPartyPostcode: "2001",
    atFaultPartyClaimNumber: "AF001",
    atFaultPartyInsurer: "",
    invoiced: 5500,
    reserve: 5000,
    agreed: 5000,
    paid: 2500,
    assigned_rental_company_id: "rental-001",
    assigned_lawyer_id: "lawyer-001",
    clientVehicleRego: "ABC123",
    atFaultPartyVehicleRego: "XYZ789"
  },
  {
    id: "case-002",
    caseNumber: "CASE-309002",
    clientName: "Sarah Johnson",
    status: "Paid",
    lastUpdated: "1 hour ago",
    atFaultPartyName: "Mike Davis",
    clientInsuranceCompany: "NRMA",
    atFaultPartyInsuranceCompany: "AAMI",
    clientPhone: "0412345678",
    clientEmail: "sarah.johnson@email.com",
    atFaultPartyPhone: "0498765432",
    atFaultPartyEmail: "mike.davis@email.com",
    clientStreetAddress: "42 Collins Street",
    clientSuburb: "Melbourne",
    clientState: "VIC",
    clientPostcode: "3000",
    clientClaimNumber: "NRMA001",
    clientInsurer: "",
    atFaultPartyStreetAddress: "15 George Street",
    atFaultPartySuburb: "Sydney",
    atFaultPartyState: "NSW",
    atFaultPartyPostcode: "2000",
    atFaultPartyClaimNumber: "AAMI001",
    atFaultPartyInsurer: "",
    invoiced: 8500,
    reserve: 8000,
    agreed: 0,
    paid: 0,
    assigned_rental_company_id: "rental-002",
    assigned_lawyer_id: "lawyer-002",
    accidentDate: "2025-01-15",
    accidentTime: "14:30",
    accidentDescription: "Rear-end collision at traffic lights on Collins Street",
    clientVehicleRego: "MNO345",
    atFaultPartyVehicleRego: "YZA012"
  }
];

// Search function implementation (from the page component)
function createSearchFilter(searchQuery: string) {
  if (!searchQuery.trim()) return () => true;
  
  const query = searchQuery.toLowerCase().trim();
  
  return (c: CaseFrontend) => {
    // Search in case number
    if (c.caseNumber?.toLowerCase().includes(query)) return true;
    
    // Search in not-at-fault client (NAF) details
    if (c.clientName?.toLowerCase().includes(query)) return true;
    if (c.clientPhone?.toLowerCase().includes(query)) return true;
    if (c.clientEmail?.toLowerCase().includes(query)) return true;
    if (c.clientSuburb?.toLowerCase().includes(query)) return true;
    if (c.clientPostcode?.toLowerCase().includes(query)) return true;
    if (c.clientClaimNumber?.toLowerCase().includes(query)) return true;
    if (c.clientVehicleRego?.toLowerCase().includes(query)) return true;
    
    // Search in at-fault party details
    if (c.atFaultPartyName?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartyPhone?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartyEmail?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartySuburb?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartyPostcode?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartyClaimNumber?.toLowerCase().includes(query)) return true;
    if (c.atFaultPartyVehicleRego?.toLowerCase().includes(query)) return true;
    
    return false;
  };
}

// Test cases
const testCases = [
  // Case number searches
  { query: "2025-001", expectedMatches: 1, description: "Search by exact case number" },
  { query: "2025", expectedMatches: 1, description: "Search by partial case number" },
  { query: "CASE-309002", expectedMatches: 1, description: "Search by full case number with prefix" },
  
  // Client name searches
  { query: "John Smith", expectedMatches: 1, description: "Search by full client name" },
  { query: "john", expectedMatches: 1, description: "Search by partial client name (case insensitive)" },
  { query: "Sarah", expectedMatches: 1, description: "Search by first name" },
  { query: "Johnson", expectedMatches: 1, description: "Search by last name" },
  
  // At-fault party searches
  { query: "Jane Doe", expectedMatches: 1, description: "Search by at-fault party full name" },
  { query: "Mike Davis", expectedMatches: 1, description: "Search by at-fault party name" },
  { query: "jane", expectedMatches: 1, description: "Search by at-fault party first name (case insensitive)" },
  
  // Vehicle registration searches
  { query: "ABC123", expectedMatches: 1, description: "Search by client vehicle rego" },
  { query: "XYZ789", expectedMatches: 1, description: "Search by at-fault vehicle rego" },
  { query: "MNO345", expectedMatches: 1, description: "Search by client vehicle rego (second case)" },
  { query: "YZA012", expectedMatches: 1, description: "Search by at-fault vehicle rego (second case)" },
  
  // Claim number searches
  { query: "C001", expectedMatches: 1, description: "Search by client claim number" },
  { query: "AF001", expectedMatches: 1, description: "Search by at-fault claim number" },
  { query: "NRMA001", expectedMatches: 1, description: "Search by specific client claim number" },
  { query: "AAMI001", expectedMatches: 1, description: "Search by specific at-fault claim number" },
  
  // Suburb searches
  { query: "Anytown", expectedMatches: 1, description: "Search by client suburb" },
  { query: "Otherville", expectedMatches: 1, description: "Search by at-fault suburb" },
  { query: "Melbourne", expectedMatches: 1, description: "Search by client suburb (Melbourne)" },
  { query: "Sydney", expectedMatches: 1, description: "Search by at-fault suburb (Sydney)" },
  
  // Postcode searches
  { query: "2000", expectedMatches: 2, description: "Search by postcode (appears in both cases)" },
  { query: "2001", expectedMatches: 1, description: "Search by at-fault postcode" },
  { query: "3000", expectedMatches: 1, description: "Search by client postcode (Melbourne)" },
  
  // Phone number searches
  { query: "555-1111", expectedMatches: 1, description: "Search by client phone" },
  { query: "0412345678", expectedMatches: 1, description: "Search by mobile phone" },
  
  // Email searches
  { query: "john.s@example.com", expectedMatches: 1, description: "Search by client email" },
  { query: "sarah.johnson@email.com", expectedMatches: 1, description: "Search by full email address" },
  
  // No matches
  { query: "nonexistent", expectedMatches: 0, description: "Search with no matches" },
  { query: "999999", expectedMatches: 0, description: "Search for non-existent postcode" }
];

// Run tests
function runSearchTests() {
  console.log('🧪 Running Case List Search Functionality Tests\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((test, index) => {
    const searchFilter = createSearchFilter(test.query);
    const results = mockCases.filter(searchFilter);
    const actualMatches = results.length;
    
    const passed = actualMatches === test.expectedMatches;
    const status = passed ? '✅' : '❌';
    
    console.log(`${index + 1}. ${status} ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected: ${test.expectedMatches} match(es), Got: ${actualMatches} match(es)`);
    
    if (!passed) {
      console.log(`   Matches found: ${results.map(r => r.caseNumber).join(', ')}`);
    }
    
    console.log('');
    
    if (passed) passedTests++;
  });
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All search functionality tests passed!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
  }
  
  return { passed: passedTests, total: totalTests };
}

// Export for potential use in actual testing framework
export { runSearchTests, createSearchFilter, mockCases, testCases };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runSearchTests();
}