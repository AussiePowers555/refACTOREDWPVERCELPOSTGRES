
import { EmailForm } from "./email-form";

export default function AiEmailPage() {
    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">AI Email Generator</h1>
                    <p className="text-muted-foreground">A standalone tool to quickly generate professional emails.</p>
                </div>
            </div>
            <EmailForm />
        </div>
    )
}
