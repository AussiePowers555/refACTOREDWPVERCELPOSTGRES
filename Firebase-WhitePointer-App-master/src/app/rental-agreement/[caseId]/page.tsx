import { Suspense } from 'react';
import RentalAgreementForm from './rental-agreement-form';

export default async function RentalAgreementPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RentalAgreementForm caseId={caseId} />
    </Suspense>
  )
}
