import type { ContactFrontend } from "./database-schema";

export async function addContact(contact: Omit<ContactFrontend, "id">) {
  try {
    // Remove undefined values
    const cleanContact = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => value !== undefined)
    );
    console.log("Saving contact:", cleanContact);
    
    // Make API call to server-side endpoint
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanContact),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Contact saved with ID:", result.id);
    return result;
  } catch (error) {
    console.error("Error adding contact: ", error);
    let errorMessage = "Failed to add contact to database";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}