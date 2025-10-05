import React from 'react';
import { UserManagement } from './UserManagement';

const UserManagementPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <UserManagement onClose={() => {}} />
    </div>
  );
};

export default UserManagementPage;
