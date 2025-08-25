import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { ReportAccessControl } from '@/components/reports/ReportAccessControl';

export default function ReportsPage() {
  const { accountName } = useParams<{ accountName: string }>();
  const decodedAccountName = accountName ? decodeURIComponent(accountName) : 'Sales Account';
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <ReportAccessControl>
          <ReportsDashboard accountName={decodedAccountName} />
        </ReportAccessControl>
      </main>
    </div>
  );
}