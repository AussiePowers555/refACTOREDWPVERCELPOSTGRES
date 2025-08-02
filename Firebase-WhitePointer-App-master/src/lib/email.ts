import nodemailer from 'nodemailer';

const { 
    EMAIL_SERVER_HOST, 
    EMAIL_SERVER_PORT, 
    EMAIL_SERVER_USER, 
    EMAIL_SERVER_PASSWORD, 
    EMAIL_FROM 
} = process.env;

if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_PORT || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD || !EMAIL_FROM) {
    console.warn(
`**************************************************************************************************
* WARNING: Email environment variables are not set. Email sending will be disabled.              *
* Please set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD,     *
* and EMAIL_FROM in your .env file to enable email functionality.                                *
**************************************************************************************************`
    );
}

const transporter = nodemailer.createTransport({
    host: EMAIL_SERVER_HOST,
    port: Number(EMAIL_SERVER_PORT),
    secure: Number(EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
     if (!EMAIL_SERVER_HOST) {
        console.log("Email sending is disabled. Would have sent email to:", to);
        console.log("Subject:", subject);
        console.log("HTML Body:", html);
        // Return a success-like object so the UI can proceed as if email was sent
        return { success: true, message: "Email sending is simulated." };
    }
    
    try {
        await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            html,
        });
        return { success: true, message: "Email sent successfully." };
    } catch (error) {
        console.error("Failed to send email:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to send email: ${errorMessage}` };
    }
}
