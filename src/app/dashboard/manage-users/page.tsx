import { ManageUsersClient } from '@/components/dashboard/manage-users-client';

export default function ManageUsersPage() {
  // In a real app, you'd fetch this data securely.
  // For this prototype, we'll use the data from the context on the client.
  
  return (
    <div className="h-full">
      <ManageUsersClient />
    </div>
  );
}
