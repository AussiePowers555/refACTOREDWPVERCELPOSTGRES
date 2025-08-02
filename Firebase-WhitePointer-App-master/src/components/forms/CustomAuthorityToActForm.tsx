'use client';

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthorityToActFormData {
  // Case reference
  caseReference?: string;
  
  // Not at fault party details
  notAtFaultFirstName?: string;
  notAtFaultLastName?: string;
  accidentDate?: string;
  
  // Vehicle details
  regoNumber?: string;
  insuranceCompany?: string;
  claimNumber?: string;
  
  // At fault party details
  atFaultFirstName?: string;
  atFaultLastName?: string;
  atFaultRegoNumber?: string;
  atFaultInsuranceCompany?: string;
  atFaultClaimNumber?: string;
  
  // Signatures and dates
  notAtFaultSignature?: string;
  notAtFaultSignatureDate?: string;
  atFaultSignature?: string;
  atFaultSignatureDate?: string;
  
  // Case info
  caseNumber?: string;
}

interface CustomAuthorityToActFormProps {
  initialData: AuthorityToActFormData;
  onSubmit: (formData: AuthorityToActFormData & { notAtFaultSignature: string; atFaultSignature: string }) => void;
  onSaveDraft?: (formData: AuthorityToActFormData) => void;
  isLoading?: boolean;
}

export default function CustomAuthorityToActForm({ 
  initialData, 
  onSubmit, 
  onSaveDraft,
  isLoading = false 
}: CustomAuthorityToActFormProps) {
  const [formData, setFormData] = useState<AuthorityToActFormData>(initialData);
  const notAtFaultSignatureRef = useRef<SignatureCanvas>(null);
  const atFaultSignatureRef = useRef<SignatureCanvas>(null);

  // Update form data when initialData changes (for pre-filling)
  useEffect(() => {
    console.log('🔄 CustomAuthorityToActForm received new initialData:', initialData);
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (field: keyof AuthorityToActFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearNotAtFaultSignature = () => {
    notAtFaultSignatureRef.current?.clear();
  };

  const clearAtFaultSignature = () => {
    atFaultSignatureRef.current?.clear();
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const handleSubmit = () => {
    const notAtFaultSig = notAtFaultSignatureRef.current;
    const atFaultSig = atFaultSignatureRef.current;
    
    if (notAtFaultSig && atFaultSig && !notAtFaultSig.isEmpty() && !atFaultSig.isEmpty()) {
      const notAtFaultSignatureDataURL = notAtFaultSig.toDataURL();
      const atFaultSignatureDataURL = atFaultSig.toDataURL();
      
      onSubmit({
        ...formData,
        notAtFaultSignature: notAtFaultSignatureDataURL,
        atFaultSignature: atFaultSignatureDataURL
      });
    } else {
      alert('Please provide both signatures before submitting.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Authority to Act Form</CardTitle>
          <p className="text-lg font-semibold">WHITE POINTER RECOVERIES PTY LTD</p>
          <p className="text-sm text-gray-600">ABN 47 636 569 732</p>
          <p className="text-lg font-semibold mt-2">
            AUTHORITY TO ACT, DIRECTION TO PAY AND DEED OF SUBROGATION
          </p>
          <p className="text-sm text-gray-600">(CREDIT HIRE ONLY)</p>
          {formData.caseNumber && (
            <p className="text-sm font-medium mt-2">Case: {formData.caseNumber}</p>
          )}
        </CardHeader>
      </Card>

      {/* Case Reference */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="caseReference">CC REF No.</Label>
              <Input
                id="caseReference"
                value={formData.caseReference || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('caseReference', e.target.value)}
                placeholder="Enter case reference number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Declaration Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 text-sm leading-relaxed">
            <div className="flex flex-wrap items-center gap-2">
              <span>1, I</span>
              <Input
                className="inline-block w-32"
                value={formData.notAtFaultFirstName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notAtFaultFirstName', e.target.value)}
                placeholder="First Name"
              />
              <Input
                className="inline-block w-32"
                value={formData.notAtFaultLastName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notAtFaultLastName', e.target.value)}
                placeholder="Last Name"
              />
              <span>, have suffered loss as a result of the collision I was involved in on</span>
              <Input
                type="date"
                className="inline-block w-40"
                value={formData.accidentDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('accidentDate', e.target.value)}
              />
              <span>.</span>
            </div>

            <div className="space-y-2 text-justify">
              <p><strong>I was not at fault in this collision</strong></p>
              <p>I am the owner of the vehicle.</p>
              <p>
                I irrevocably appoint White Pointer to act on my behalf to recover the loss associated with the replacement vehicle and any miscellaneous loss defined by clause 14(d) below ("miscellaneous loss"). I also understand that White Pointer will instruct MGL Lawyers or another lawyer appointed by White Pointer to act on my behalf to recover the loss associated with the replacement vehicle and / or any miscellaneous loss. This appointment does not cover the loss associated with other loss I have suffered including damage and repairs to my vehicle. I am responsible for pursuing these claims, although I understand that the proceedings for the damage to my vehicle must be brought together with the rental claim, else I may be unable to bring the claim for damage and repairs later. I confirm I will/have provided White Pointer with all required documents requested to process the claim. By signing this Deed, I confirm I have read, understood and consent to be bound by the clauses outlined below. I declare that the particulars I have supplied in relation to the collision are true and correct to the best of my knowledge and belief.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>GENERAL AUTHORITY TO ACT, DIRECTION TO PAY AND DEED OF SUBROGATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-justify">
          <div>
            <p><strong>1.</strong> I understand that I have suffered loss as a result of the negligence/fault of a third party because of the Accident, as I have identified in the form above.</p>
            <p><strong>2.</strong> I was not at fault regarding this Accident.</p>
            <p><strong>3.</strong> I wish to appoint White Pointer to recover compensation for the losses associated with the repair of my vehicle, and other associated costs replacement vehicle / miscellaneous loss.</p>
          </div>

          <div>
            <h4 className="font-semibold">COOPERATION</h4>
            <p><strong>4.</strong> I understand that I must provide full cooperation as required in this agreement to assist with enquiries regarding my claim.</p>
            <p><strong>5.</strong> I confirm I will follow and fully cooperate with all reasonable requests in a timely manner and to the best of my ability.</p>
            <p><strong>6.</strong> If I am responsible for the conduct of my claim regarding repairs, towing, demurrage and assessment, I acknowledge it is likely that this claim will need to be brought in the same proceedings as the proceedings for the market cost of the replacement vehicle, and that I will do everything necessary to cooperate with White Pointer in the commencement, continuation and settlement of the claim.</p>

            <p><strong>7.</strong> Under this deed, I confirm I will:</p>
            <ul className="list-disc ml-6">
              <li>Be truthful in all information I provide.</li>
              <li>Provide information or documents at the request of White Pointer or any other nominated legal representative.</li>
              <li>Review and provide a signed statement or affidavit, if necessary.</li>
              <li>Attend court as a witness when required.</li>
            </ul>

            <p><strong>8.</strong> Under this deed, I confirm I will NOT:</p>
            <ul className="list-disc ml-6">
              <li>Make any admission of liability in respect to the accident to any person or business;</li>
              <li>Release, by signing a form or otherwise, the other party from compensating the loss (with respect to the replacement vehicle and / or miscellaneous loss) suffered; or</li>
              <li>Negotiate with any insurance company, person, business, lawyer, or related or interested entity regarding the settlement figure to be awarded to me for compensation for my loss. (with respect to the replacement vehicle and / or miscellaneous loss).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">SERVICES ORGANISED ON MY BEHALF</h4>
            <p><strong>9.</strong> I authorise White Pointer to organise the following on my behalf in relation to the Accident;</p>
            <ul className="list-disc ml-6">
              <li>Recover the costs associated with my replacement vehicle;</li>
              <li>A lawyer to do anything necessary to recover my losses with respect to the replacement vehicle from the at fault party or their insurer.</li>
            </ul>

            <p><strong>10.</strong> I will enter into an agreement with the people or companies who provide replacement vehicles and miscellaneous items including but not limited to helmets or gloves. This means that I will not have to pay anything upfront while my vehicle is repaired, and I will only be liable when money is recovered from the at-fault party or their insurer.</p>

            <p><strong>11.</strong> I understand that White Pointer may charge a fee to third parties engaged by White Pointer to assist in providing me with services under this agreement.</p>

            <p><strong>12.</strong> I understand that White Pointer will enter into a costs agreement with the lawyer retained on my behalf, and will receive the relevant disclosure as a third party payer.</p>

            <p><strong>13.</strong> I understand that this Deed is not an insurance contract, as no insurance premiums are paid to White Pointer by me.</p>
          </div>

          <div>
            <h4 className="font-semibold">RECOVERY OF LOSS</h4>
            <p><strong>14.</strong> I understand that my losses resulting from the Accident may include;</p>
            <ul className="list-disc ml-6">
              <li>Repair costs;</li>
              <li>Rental costs based on a daily rate that is applied per day for the required period whilst my vehicle is being assessed and repaired;</li>
              <li>Towing costs;</li>
              <li>Miscellaneous loss including but not limited to items in my vehicle;</li>
              <li>Demurrage;</li>
              <li>Expert report/assessment costs;</li>
              <li>Legal costs;</li>
              <li>Disbursements.</li>
            </ul>

            <p><strong>15.</strong> I understand that the market cost for the hire of the replacement vehicle, along with any miscellaneous items will be recovered on my behalf by White Pointer.</p>

            <p><strong>16.</strong> I understand that with respect to the market cost for repairs, towing, diminished value, demurrage and assessment I am responsible for conducting these proceedings (if applicable), and I understand:</p>
            <ul className="list-disc ml-6">
              <li>I may, or may not engage MGL Lawyers or the same authorised legal representative to conduct these proceedings on my behalf;</li>
              <li>I retain my rights to conduct the proceedings mentioned in clause 16 above and in these proceedings:
                <ul className="list-disc ml-6">
                  <li>Assignments mentioned at clause 18, 19 and 20 do not apply.</li>
                  <li>Indemnities mentioned at clause 31 continue to apply.</li>
                </ul>
              </li>
              <li>It is likely these proceedings mentioned in this paragraph must be commenced and concluded together with the proceedings for the market cost of the hire of the replacement vehicle and miscellaneous items (clause 14 above) else I may lose any rights I have under these claims.</li>
            </ul>

            <p><strong>17.</strong> I understand that this Deed is not subject to the National Credit Protection Act or the National Credit Code.</p>
          </div>

          <div>
            <h4 className="font-semibold">LITIGATION</h4>
            <p><strong>18.</strong> I understand if there is a dispute as to the reasonable amount of my loss, a law firm named MGL Lawyers or another nominated law firm will be instructed to commence legal proceedings in my name and on my behalf against the at-fault party.</p>

            <p><strong>19.</strong> I authorise MGL Lawyers and/or any other nominated legal representative to do the following on my behalf:</p>
            <ul className="list-disc ml-6">
              <li>Make all reasonable enquiries relating to my loss to implicated or interested parties including, but without limitation to, the third-party and/or the third-party insurer;</li>
              <li>File and conduct legal proceedings on my behalf and in my name;</li>
              <li>Acquire relevant information and documents from third parties;</li>
              <li>Use the personal information I provided to White Pointer either verbally, in writing and/or set out in the White Pointer Claim Form to assist in recovering my loss;</li>
              <li>Prepare documents on my behalf including, but not limited to: statements, affidavits or any other evidence relevant to, and required for, the purposes of litigation or the settlement of my claim; and</li>
              <li>Release other parties from liability on my behalf by way of deed or consent orders.</li>
            </ul>

            <p><strong>20.</strong> I agree to sign all documents and do anything else that is necessary for MGL Lawyers and/or any other nominated legal representative to do those things.</p>
          </div>

          <div>
            <h4 className="font-semibold">AUTHORITY TO RECEIVE AND PAY</h4>
            <p><strong>21.</strong> I understand that for the recovery of my loss there will be requests made for payment from the at fault party and or their insurer.</p>

            <p><strong>22.</strong> I understand that as part of procedure of authorising White Pointer or any nominated legal representative to act on my behalf to recover any loss due to the accident, White Pointer or any nominated legal representative will receive a settlement cheque or payment in my name when the claim or matter has been finalised.</p>

            <p><strong>23.</strong> I hereby authorise White Pointer and or the nominated legal representative to receive any settlement monies to be paid to me by way of verdict, award or agreement.</p>

            <p><strong>24.</strong> I further authorise White Pointer or any nominated legal representative to bank relevant payments made out in my name into an account nominated by White Pointer.</p>

            <p><strong>25.</strong> I confirm that should I receive any payment from an insurer or third party directly related to this claim I will forward the entire payment to White Pointer within 48 hours by cheque or EFT.</p>

            <p><strong>26.</strong> I authorise White Pointer and/or MGL Lawyers and/or any other nominated legal representative to pay from the nominated account any monies on my behalf to White Pointer, MGL Lawyers, or any other person or business who is owed money arising from the claim or matter. Such persons or businesses include, without limitation, the legal representatives nominated to represent me, and where applicable, the hire car company that provided a replacement vehicle or loaned me any miscellaneous items whilst my vehicle was being repaired.</p>
          </div>

          <div>
            <h4 className="font-semibold">TERMINATION OF THIS DEED</h4>
            <p><strong>27.</strong> I understand and acknowledge this Deed is irrevocable by me.</p>

            <p><strong>28.</strong> However, I acknowledge that White Pointer reserves the right to terminate this deed with immediate effect at its absolute discretion, without notice and for any reason.</p>

            <p><strong>29.</strong> I understand if I breach the terms of this Deed or attempt to terminate this Deed White Pointer at its sole discretion may cease all dealings with me. I understand should this occur, that the indemnities at the whole of clause 31 shall cease to apply and I am personally liable for all costs associated with my loss and any recovery costs accrued whilst White Pointer and any nominated legal representative acted on my behalf.</p>

            <p><strong>30.</strong> Any termination of this Deed shall be without prejudice to any rights which either party may have against the other arising out of or connection with this Deed.</p>
          </div>

          <div>
            <h4 className="font-semibold">INDEMNITY</h4>
            <p><strong>31.</strong></p>
            <ul className="list-disc ml-6">
              <li><strong>a)</strong> I understand that White Pointer, in reliance on the warranties and covenants provided by me and subject to the terms and conditions outlined in this Deed, agrees to indemnify me in respect of the cost of the replacement vehicle and loan of any miscellaneous items incurred on my behalf, as a loss arising from the Accident</li>

              <li><strong>b)</strong> I understand that White Pointer, in reliance on the warranties and covenants provided by me and subject to the terms and conditions outlined in this Deed, agrees to indemnify me in respect of the whole of the legal costs incurred on my behalf, and any adverse costs order that may be made against me in legal proceedings commenced to recover my loss arising from the Accident, whether or not these costs relate to the claim regarding the replacement vehicle, or another claim arising from the Accident.</li>

              <li><strong>c)</strong> I agree that the indemnity will not apply and will cease to have effect in circumstances where:
                <ul className="list-disc ml-6">
                  <li>I breach any of the essential terms of this Deed;</li>
                  <li>I deal directly with the at-fault party or their insurer without the consent of White Pointer;</li>
                  <li>I refuse or fail to respond to reasonable requests from White Pointer or any nominated legal representatives for information or documents reasonably necessary to the proper prosecution or settlement of my claim;</li>
                  <li>I refuse to accept reasonable advice rendered by MGL Lawyers or the other legal representative nominated by White Pointer:</li>
                  <li>I give false or fraudulent information to White Pointer, the Defendant, the Insurer, or the court.</li>
                  <li>I purport to withdraw my authority and instructions to act on my behalf (even though I am not permitted to do so under this Deed).</li>
                </ul>
              </li>

              <li><strong>d)</strong> If the indemnity ceases to have effect then, unless otherwise agreed, I will become immediately liable to White Pointer for any liability or expense incurred by White Pointer because of this Deed.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Not At Fault Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>Not At Fault Party Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notAtFaultFirstName">First Name *</Label>
              <Input
                id="notAtFaultFirstName"
                value={formData.notAtFaultFirstName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notAtFaultFirstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="notAtFaultLastName">Last Name *</Label>
              <Input
                id="notAtFaultLastName"
                value={formData.notAtFaultLastName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notAtFaultLastName', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="regoNumber">Rego No.</Label>
            <Input
              id="regoNumber"
              value={formData.regoNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('regoNumber', e.target.value)}
              placeholder="Vehicle Details"
            />
          </div>
          
          <div>
            <Label htmlFor="insuranceCompany">Insurance Company</Label>
            <Input
              id="insuranceCompany"
              value={formData.insuranceCompany || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('insuranceCompany', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="claimNumber">Claim Number</Label>
            <Input
              id="claimNumber"
              value={formData.claimNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('claimNumber', e.target.value)}
              placeholder="The claim number provided by your insurer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Not At Fault Party Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Not At Fault Party Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4">
            <SignatureCanvas
              ref={notAtFaultSignatureRef!}
              canvasProps={{
                className: 'w-full h-[200px] signature-canvas border rounded'
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearNotAtFaultSignature}>
              Clear Signature
            </Button>
          </div>
          <div>
            <Label htmlFor="notAtFaultSignatureDate">Date</Label>
            <Input
              type="date"
              id="notAtFaultSignatureDate"
              value={formData.notAtFaultSignatureDate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notAtFaultSignatureDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* At Fault Party Details */}
      <Card>
        <CardHeader>
          <CardTitle>At Fault Party Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="atFaultFirstName">First Name *</Label>
              <Input
                id="atFaultFirstName"
                value={formData.atFaultFirstName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultFirstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="atFaultLastName">Last Name *</Label>
              <Input
                id="atFaultLastName"
                value={formData.atFaultLastName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultLastName', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="atFaultRegoNumber">Rego No.</Label>
            <Input
              id="atFaultRegoNumber"
              value={formData.atFaultRegoNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultRegoNumber', e.target.value)}
              placeholder="Vehicle Details"
            />
          </div>
          
          <div>
            <Label htmlFor="atFaultInsuranceCompany">Insurance Company</Label>
            <Input
              id="atFaultInsuranceCompany"
              value={formData.atFaultInsuranceCompany || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultInsuranceCompany', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="atFaultClaimNumber">Claim Number</Label>
            <Input
              id="atFaultClaimNumber"
              value={formData.atFaultClaimNumber || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultClaimNumber', e.target.value)}
              placeholder="The claim number provided by your insurer"
            />
          </div>
        </CardContent>
      </Card>

      {/* At Fault Party Signature */}
      <Card>
        <CardHeader>
          <CardTitle>At Fault Party Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4">
            <SignatureCanvas
              ref={atFaultSignatureRef!}
              canvasProps={{
                className: 'w-full h-[200px] signature-canvas border rounded'
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearAtFaultSignature}>
              Clear Signature
            </Button>
          </div>
          <div>
            <Label htmlFor="atFaultSignatureDate">Date</Label>
            <Input
              type="date"
              id="atFaultSignatureDate"
              value={formData.atFaultSignatureDate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('atFaultSignatureDate', e.target.value)}
            />
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
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Submitting...' : 'Sign & Submit'}
        </Button>
      </div>
    </div>
  );
}
