'use client';

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ClaimsFormData {
  // Panel Shop
  panelShopName?: string;
  panelShopContact?: string;
  panelShopPhone?: string;
  repairStartDate?: string;
  vehicleCondition?: string[];

  // Client/Driver
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostcode?: string;

  // Owner (if different)
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;

  // Insurance
  insuranceCompany?: string;
  claimNumber?: string;

  // Vehicle
  make?: string;
  model?: string;
  year?: string;
  rego?: string;

  // At-fault party
  afDriverName?: string;
  afDriverPhone?: string;
  afDriverEmail?: string;
  afDriverAddress?: string;
  afOwnerName?: string;
  afOwnerPhone?: string;
  afOwnerEmail?: string;
  afInsuranceCompany?: string;
  afClaimNumber?: string;
  afMake?: string;
  afModel?: string;
  afYear?: string;
  afRego?: string;

  // Accident details
  accidentDetails?: string;
  accidentLocation?: string;
  injuries?: boolean;

  // Case info
  caseNumber?: string;
  signature?: string;
}

interface CustomClaimsFormProps {
  initialData: ClaimsFormData;
  onSubmit: (formData: ClaimsFormData & { signature: string }) => void;
  onSaveDraft?: (formData: ClaimsFormData) => void;
  isLoading?: boolean;
}

export default function CustomClaimsForm({ 
  initialData, 
  onSubmit, 
  onSaveDraft,
  isLoading = false 
}: CustomClaimsFormProps) {
  const [formData, setFormData] = useState<ClaimsFormData>(initialData);
  const [vehicleConditions, setVehicleConditions] = useState<string[]>(
    initialData.vehicleCondition || []
  );
  const [hasInjuries, setHasInjuries] = useState(initialData.injuries || false);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Update form data when initialData changes (for pre-filling)
  useEffect(() => {
    console.log('🔄 CustomClaimsForm received new initialData:', initialData);
    setFormData(initialData);
    setVehicleConditions(initialData.vehicleCondition || []);
    setHasInjuries(initialData.injuries || false);
  }, [initialData]);

  const handleInputChange = (field: keyof ClaimsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleConditionChange = (condition: string, checked: boolean) => {
    setVehicleConditions(prev => {
      if (checked) {
        return [...prev, condition];
      } else {
        return prev.filter(c => c !== condition);
      }
    });
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft({ ...formData, vehicleCondition: vehicleConditions, injuries: hasInjuries });
    }
  };

  const handleSubmit = () => {
    if (!signatureRef.current?.isEmpty()) {
      const signatureDataURL = signatureRef.current?.toDataURL();
      if (!signatureDataURL) {
        alert('Please provide a signature');
        return;
      }
      onSubmit({
        ...formData,
        vehicleCondition: vehicleConditions,
        injuries: hasInjuries,
        signature: signatureDataURL
      });
    } else {
      alert('Please provide your signature before submitting.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Claims Form</h1>
        <p className="text-gray-600 mt-2">Not At Fault Accident Replacement Vehicles</p>
        {formData.caseNumber && (
          <p className="text-sm text-gray-500 mt-1">Case: {formData.caseNumber}</p>
        )}
      </div>

      {/* Panel Shop Section */}
      <Card>
        <CardHeader>
          <CardTitle>Panel Shop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="panelShopName">Panel Shop Name</Label>
            <Input
              id="panelShopName"
              value={formData.panelShopName || ''}
              onChange={(e) => handleInputChange('panelShopName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="panelShopContact">Contact *</Label>
            <Input
              id="panelShopContact"
              value={formData.panelShopContact || ''}
              onChange={(e) => handleInputChange('panelShopContact', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="panelShopPhone">Phone Number</Label>
            <Input
              id="panelShopPhone"
              type="tel"
              value={formData.panelShopPhone || ''}
              onChange={(e) => handleInputChange('panelShopPhone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="repairStartDate">Repair Start Date</Label>
            <Input
              id="repairStartDate"
              type="date"
              value={formData.repairStartDate || ''}
              onChange={(e) => handleInputChange('repairStartDate', e.target.value)}
            />
          </div>
          <div>
            <Label>Is the client's bike: *</Label>
            <div className="flex gap-4 mt-2">
              {['DRIVEABLE', 'NON DRIVEABLE', 'TOTAL LOSS'].map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={vehicleConditions.includes(condition)}
                    onCheckedChange={(checked) => 
                      handleVehicleConditionChange(condition, checked as boolean)
                    }
                  />
                  <Label htmlFor={condition}>{condition}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client/Driver Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bike</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientName">Driver *</Label>
            <Input
              id="clientName"
              value={formData.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="clientPhone">Mobile No. *</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={formData.clientPhone || ''}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="clientAddress">Address</Label>
            <Input
              id="clientAddress"
              value={formData.clientAddress || ''}
              onChange={(e) => handleInputChange('clientAddress', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientCity">City</Label>
              <Input
                id="clientCity"
                value={formData.clientCity || ''}
                onChange={(e) => handleInputChange('clientCity', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientState">State</Label>
              <Input
                id="clientState"
                value={formData.clientState || ''}
                onChange={(e) => handleInputChange('clientState', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientPostcode">Postal Code</Label>
            <Input
              id="clientPostcode"
              value={formData.clientPostcode || ''}
              onChange={(e) => handleInputChange('clientPostcode', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="clientEmail">Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail || ''}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Owner Section */}
      <Card>
        <CardHeader>
          <CardTitle>Owner (if different from driver)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ownerName">Owner</Label>
            <Input
              id="ownerName"
              value={formData.ownerName || ''}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ownerPhone">Mobile No.</Label>
            <Input
              id="ownerPhone"
              type="tel"
              value={formData.ownerPhone || ''}
              onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Email</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail || ''}
              onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="insuranceCompany">Insurance Company</Label>
            <Input
              id="insuranceCompany"
              value={formData.insuranceCompany || ''}
              onChange={(e) => handleInputChange('insuranceCompany', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="claimNumber">Claim Number</Label>
            <Input
              id="claimNumber"
              value={formData.claimNumber || ''}
              onChange={(e) => handleInputChange('claimNumber', e.target.value)}
              placeholder="The claim number provided by your insurer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rego">Rego No.</Label>
              <Input
                id="rego"
                value={formData.rego || ''}
                onChange={(e) => handleInputChange('rego', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* At-Fault Party Section */}
      <Card>
        <CardHeader>
          <CardTitle>Other Vehicle (at fault party)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="afDriverName">Driver</Label>
            <Input
              id="afDriverName"
              value={formData.afDriverName || ''}
              onChange={(e) => handleInputChange('afDriverName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afDriverPhone">Mobile No.</Label>
            <Input
              id="afDriverPhone"
              type="tel"
              value={formData.afDriverPhone || ''}
              onChange={(e) => handleInputChange('afDriverPhone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afDriverAddress">Address</Label>
            <Input
              id="afDriverAddress"
              value={formData.afDriverAddress || ''}
              onChange={(e) => handleInputChange('afDriverAddress', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afDriverEmail">Email</Label>
            <Input
              id="afDriverEmail"
              type="email"
              value={formData.afDriverEmail || ''}
              onChange={(e) => handleInputChange('afDriverEmail', e.target.value)}
            />
          </div>

          <Separator />

          <div>
            <Label htmlFor="afOwnerName">Owner</Label>
            <Input
              id="afOwnerName"
              value={formData.afOwnerName || ''}
              onChange={(e) => handleInputChange('afOwnerName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afOwnerPhone">Mobile No. *</Label>
            <Input
              id="afOwnerPhone"
              type="tel"
              value={formData.afOwnerPhone || ''}
              onChange={(e) => handleInputChange('afOwnerPhone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afOwnerEmail">Email</Label>
            <Input
              id="afOwnerEmail"
              type="email"
              value={formData.afOwnerEmail || ''}
              onChange={(e) => handleInputChange('afOwnerEmail', e.target.value)}
            />
          </div>

          <Separator />

          <div>
            <Label htmlFor="afInsuranceCompany">Insurance Company</Label>
            <Input
              id="afInsuranceCompany"
              value={formData.afInsuranceCompany || ''}
              onChange={(e) => handleInputChange('afInsuranceCompany', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="afClaimNumber">Claim Number</Label>
            <Input
              id="afClaimNumber"
              value={formData.afClaimNumber || ''}
              onChange={(e) => handleInputChange('afClaimNumber', e.target.value)}
              placeholder="The claim number of the at fault party"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="afMake">Make</Label>
              <Input
                id="afMake"
                value={formData.afMake || ''}
                onChange={(e) => handleInputChange('afMake', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="afModel">Model</Label>
              <Input
                id="afModel"
                value={formData.afModel || ''}
                onChange={(e) => handleInputChange('afModel', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="afYear">Year</Label>
              <Input
                id="afYear"
                value={formData.afYear || ''}
                onChange={(e) => handleInputChange('afYear', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="afRego">Rego No.</Label>
              <Input
                id="afRego"
                value={formData.afRego || ''}
                onChange={(e) => handleInputChange('afRego', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accident Details */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accidentDetails">Accident Details *</Label>
            <Textarea
              id="accidentDetails"
              value={formData.accidentDetails || ''}
              onChange={(e) => handleInputChange('accidentDetails', e.target.value)}
              placeholder="Detailed Description of Accident"
              required
            />
          </div>
          <div>
            <Label htmlFor="accidentLocation">Accident Location *</Label>
            <Input
              id="accidentLocation"
              value={formData.accidentLocation || ''}
              onChange={(e) => handleInputChange('accidentLocation', e.target.value)}
              placeholder="Suburb and Street where the accident took place"
              required
            />
          </div>
          <div>
            <Label>INJURIES Has the driver or passenger been injured? *</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="injuries-yes"
                  checked={hasInjuries === true}
                  onCheckedChange={(checked) => setHasInjuries(checked as boolean)}
                />
                <Label htmlFor="injuries-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="injuries-no"
                  checked={hasInjuries === false}
                  onCheckedChange={(checked) => setHasInjuries(!(checked as boolean))}
                />
                <Label htmlFor="injuries-no">No</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-[200px] signature-canvas border rounded'
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearSignature}>
              Clear Signature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isLoading}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Sign & Submit'}
        </Button>
      </div>
    </div>
  );
}
