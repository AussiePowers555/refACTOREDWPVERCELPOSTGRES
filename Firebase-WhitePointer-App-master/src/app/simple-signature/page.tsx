'use client';

import { useState } from 'react';

export default function SimpleSignaturePage() {
  const [formData, setFormData] = useState({
    caseId: '',
    clientEmail: '',
    clientName: '',
    documentType: 'authority_to_act'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Simulate creating signature request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token = 'test-token-' + Date.now();
      const signatureUrl = `http://localhost:9015/secure-signature-portal/${token}`;

      setResult({
        success: true,
        token,
        signatureUrl,
        message: 'Signature link created successfully!'
      });

      // Reset form
      setFormData({
        caseId: '',
        clientEmail: '',
        clientName: '',
        documentType: 'authority_to_act'
      });

    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to create signature link'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '4px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '16px'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '32px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%', 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            ✅ Login Successful!
          </h1>
          <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '8px' }}>
            Create Signature Request
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Generate signature links for your clients
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
              Case ID
            </label>
            <input
              style={inputStyle}
              type="text"
              value={formData.caseId}
              onChange={(e) => setFormData(prev => ({...prev, caseId: e.target.value}))}
              placeholder="WP-2024-001"
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
              Client Name
            </label>
            <input
              style={inputStyle}
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({...prev, clientName: e.target.value}))}
              placeholder="John Smith"
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>
              Client Email
            </label>
            <input
              style={inputStyle}
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({...prev, clientEmail: e.target.value}))}
              placeholder="john@example.com"
              required
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? '⏳ Creating Link...' : '🚀 Create Signature Link'}
          </button>
        </form>

        {result && (
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '6px'
          }}>
            {result.success ? (
              <div>
                <p style={{ color: '#15803d', fontWeight: '500', marginBottom: '8px' }}>
                  ✅ {result.message}
                </p>
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {result.signatureUrl}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(result.signatureUrl)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Link
                </button>
              </div>
            ) : (
              <p style={{ color: '#dc2626', fontWeight: '500' }}>
                ❌ {result.error}
              </p>
            )}
          </div>
        )}

        <div style={{ 
          marginTop: '32px', 
          paddingTop: '16px', 
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p>🎉 Login system working perfectly!</p>
          <p>Server: localhost:9015 | Status: ✅ Active</p>
        </div>
      </div>
    </div>
  );
}