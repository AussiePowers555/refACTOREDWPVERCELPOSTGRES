'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testBrevoEmail = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          clientName: 'Test Client',
          caseNumber: 'TEST-001',
        }),
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.success ? 'Email sent successfully!' : data.error || 'Failed to send email',
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setTesting(false);
    }
  };

  const testBrevoSMS = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/send-test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          clientName: 'Test Client',
          caseNumber: 'TEST-001',
        }),
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.success ? 'SMS sent successfully!' : data.error || 'Failed to send SMS',
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setTesting(false);
    }
  };

  const testDocumentSend = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/documents/send-for-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseNumber: 'TEST-001',
          documentType: 'claims',
          method: 'email',
          clientEmail: email,
          clientName: 'Test Client',
          formData: {
            '3': 'Test Value 1',
            '4': 'Test Value 2',
          },
          // Include case data for prefilling
          clientPhone: '0412345678',
          clientStreetAddress: '123 Test Street',
          clientSuburb: 'Testville',
          clientState: 'NSW',
          clientPostcode: '2000',
          atFaultPartyName: 'Test At Fault',
          atFaultPartyInsuranceCompany: 'Test Insurance Co',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: `Document sent successfully! JotForm URL: ${data.data.jotFormLink}`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send document',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Brevo Email/SMS Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61412345678"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={testBrevoEmail}
              disabled={!email || testing}
            >
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Test Email
            </Button>

            <Button
              onClick={testBrevoSMS}
              disabled={!phone || testing}
              variant="outline"
            >
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Test SMS
            </Button>

            <Button
              onClick={testDocumentSend}
              disabled={!email || testing}
              variant="secondary"
            >
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Test Document Send
            </Button>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Check the browser console and server logs for detailed information.</p>
            <p>Make sure the Brevo API key is configured in your environment variables.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}