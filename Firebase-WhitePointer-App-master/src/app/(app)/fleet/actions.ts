"use server";

import { sendEmail } from "@/lib/email";

interface SendSignatureEmailInput {
    clientName: string;
    clientEmail: string; 
    caseNumber: string;
    bikeModel: string;
}

export async function sendSignatureRequestEmail(input: SendSignatureEmailInput) {
    const { clientName, clientEmail, caseNumber, bikeModel } = input;

    const signatureUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/sign-agreement?case=${caseNumber}`;

    const subject = `Action Required: Please Sign Your Rental Agreement for Case ${caseNumber}`;
    const html = `
        <div style="font-family: sans-serif; line-height: 1.5;">
            <h2>PBikeRescue - Rental Agreement Signature</h2>
            <p>Dear ${clientName},</p>
            <p>
                Thank you for choosing PBikeRescue. To finalize the rental of the <strong>${bikeModel}</strong> for case <strong>${caseNumber}</strong>, 
                we require your digital signature on the rental agreement.
            </p>
            <p>
                Please click the button below to review and sign the document securely.
            </p>
            <a 
                href="${signatureUrl}" 
                style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;"
            >
                Sign Rental Agreement
            </a>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Sincerely,<br/>The PBikeRescue Team</p>
        </div>
    `;

    // This email sending logic depends on environment variables that may not be set.
    // For now, we will simulate the email sending to avoid errors.
    console.log("Simulating email sending to:", clientEmail);
    console.log("Subject:", subject);
    // In a real scenario, you would uncomment the line below.
    // return await sendEmail({ to: clientEmail, subject, html });
    return { success: true, message: "Email sending is simulated." };
}
