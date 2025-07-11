import React from 'react';
import PizzeriaAdminPanel from '@/components/admin/PizzeriaAdminPanel';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

const Admin = () => {
  return (
    <AdminErrorBoundary componentName="Admin Panel">
      <PizzeriaAdminPanel />
    </AdminErrorBoundary>
  );
};

export default Admin;
