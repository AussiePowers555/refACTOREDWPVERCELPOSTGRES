const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;

async function createPDF(formName, fields) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  let y = 750;

  page.drawText(formName, { x: 50, y, size: fontSize + 4, font });
  y -= 30;

  for (const [label, type] of Object.entries(fields)) {
    page.drawText(label + ':', { x: 50, y, size: fontSize, font });
    y -= 20;
    const form = pdfDoc.getForm();
    if (type === 'text') {
      const textField = form.createTextField(label.replace(/ /g, '_'));
      textField.setText('');
      textField.addToPage(page, { x: 50, y: y - 20, width: 200, height: 20 });
    } // Add more types as needed
    y -= 30;
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(`${formName}.pdf`, pdfBytes);
}

(async () => {
  // Claims Form fields (example, add all from extraction)
  const claimsFields = { 'First Name': 'text', 'Last Name': 'text' /* add more */ };
  await createPDF('claims_form', claimsFields);

  // Repeat for other forms
  // Not At Fault Rental
  const rentalFields = { 'Hirer Name': 'text', 'Address': 'text' /* add more */ };
  await createPDF('not_at_fault_rental_form', rentalFields);

  // Certis Rental
  const certisFields = { 'Vehicle Rego': 'text' /* add more */ };
  await createPDF('certis_rental_form', certisFields);

  // Authority to Act
  const authorityFields = { 'Name': 'text', 'Date': 'text' /* add more */ };
  await createPDF('authority_to_act_form', authorityFields);

  // Direction to Pay
  const directionFields = { 'Claimant': 'text', 'DOB': 'text' /* add more */ };
  await createPDF('direction_to_pay_form', directionFields);

  console.log('PDFs generated');
})();