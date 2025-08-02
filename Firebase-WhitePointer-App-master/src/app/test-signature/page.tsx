'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestSignaturePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [formData, setFormData] = useState({
    caseNumber: 'TEST-001',
    clientName: 'John Test',
    clientEmail: 'test@example.com',
    documentType: 'claims'
  });

  const createTestToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/send-for-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseNumber: formData.caseNumber,
          documentType: formData.documentType,
          method: 'email',
          clientEmail: formData.clientEmail,
          clientName: formData.clientName,
          formData: {
            clientName: formData.clientName,
            clientEmail: formData.clientEmail,
            caseNumber: formData.caseNumber
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(`Token created successfully! Secure URL: ${data.secureUrl}`);
        // Extract token from URL
        const urlToken = data.secureUrl.split('/').pop();
        setToken(urlToken);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testTokenValidation = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/signature-portal/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setResult(`Token validation result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Validation error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Signature Token System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <select 
                id="documentType"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="claims">Claims Form</option>
                <option value="authority-to-act">Authority to Act</option>
                <option value="not-at-fault-rental">NAF Rental</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={createTestToken} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Test Token'}
            </Button>
            
            {token && (
              <Button onClick={testTokenValidation} disabled={loading} className="w-full" variant="outline">
                {loading ? 'Validating...' : 'Test Token Validation'}
              </Button>
            )}
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}

          {token && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="font-semibold">Test the secure portal:</p>
              <a 
                href={`/secure-signature-portal/${token}`} 
                target="_blank"
                className="text-blue-600 underline"
              >
                Open Secure Portal
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}