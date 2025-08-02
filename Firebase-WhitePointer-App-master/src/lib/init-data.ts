import type { ContactFrontend as Contact, WorkspaceFrontend as Workspace } from "@/lib/database-schema";

export const initialContacts: Contact[] = [
  {
    id: "contact-david-001",
    name: "David",
    company: "Not At Fault",
    type: "Rental Company",
    phone: "0413063463",
    email: "whitepointer2016@gmail.com",
    address: "123 Business Street, Sydney NSW 2000"
  },
  {
    id: "contact-smith-lawyers",
    name: "Smith & Co Lawyers",
    company: "Smith & Co Legal",
    type: "Lawyer",
    phone: "02 9876 5432",
    email: "contact@smithlegal.com.au",
    address: "456 Legal Avenue, Sydney NSW 2000"
  },
  {
    id: "contact-allstate-insurer",
    name: "AllState Insurance",
    company: "AllState",
    type: "Insurer",
    phone: "1800 123 456",
    email: "claims@allstate.com.au",
    address: "789 Insurance Plaza, Melbourne VIC 3000"
  },
  {
    id: "contact-geico-insurer",
    name: "Geico Insurance",
    company: "Geico",
    type: "Insurer",
    phone: "1800 654 321",
    email: "support@geico.com.au",
    address: "321 Coverage Street, Brisbane QLD 4000"
  }
];

export const initialWorkspaces: Workspace[] = [
  {
    id: "workspace-david-001",
    name: "David - Not At Fault Workspace",
    contactId: "contact-david-001"
  }
];

export function initializeLocalStorage() {
  if (typeof window === 'undefined') return;

  // Initialize contacts if not exists
  const existingContacts = localStorage.getItem('contacts');
  if (!existingContacts) {
    localStorage.setItem('contacts', JSON.stringify(initialContacts));
    console.log('✅ Initialized contacts data');
  } else {
    // Check if David exists, if not add him
    const contacts = JSON.parse(existingContacts) as Contact[];
    const davidExists = contacts.find(c => c.email === "whitepointer2016@gmail.com");
    if (!davidExists) {
      const davidContact = initialContacts.find(c => c.email === "whitepointer2016@gmail.com");
      if (davidContact) {
        contacts.push(davidContact);
        localStorage.setItem('contacts', JSON.stringify(contacts));
        console.log('✅ Added David contact');
      }
    }
  }

  // Initialize workspaces if not exists
  const existingWorkspaces = localStorage.getItem('workspaces');
  if (!existingWorkspaces) {
    localStorage.setItem('workspaces', JSON.stringify(initialWorkspaces));
    console.log('✅ Initialized workspaces data');
  } else {
    // Check if David's workspace exists, if not add it
    const workspaces = JSON.parse(existingWorkspaces) as Workspace[];
    const davidWorkspaceExists = workspaces.find(w => w.contactId === "contact-david-001");
    if (!davidWorkspaceExists) {
      const davidWorkspace = initialWorkspaces.find(w => w.contactId === "contact-david-001");
      if (davidWorkspace) {
        workspaces.push(davidWorkspace);
        localStorage.setItem('workspaces', JSON.stringify(workspaces));
        console.log('✅ Added David workspace');
      }
    }
  }
}
