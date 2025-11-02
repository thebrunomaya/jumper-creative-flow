import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { DashboardsDisplay } from '@/components/dashboards/DashboardsDisplay';
import { DashboardAccessControl } from '@/components/dashboards/DashboardAccessControl';

export default function DashboardsPage() {
  const { accountName } = useParams<{ accountName: string }>();
  const decodedAccountName = accountName ? decodeURIComponent(accountName) : 'Sales Account';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <DashboardAccessControl>
          <DashboardsDisplay accountName={decodedAccountName} />
        </DashboardAccessControl>
      </main>
    </div>
  );
}