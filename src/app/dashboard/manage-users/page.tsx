import { ManageUsersClient } from '@/components/dashboard/manage-users-client';
import { getUsers } from '@/lib/db';

export default async function ManageUsersPage() {
  const users = await getUsers();
  
  return (
    <div className="h-full">
      <ManageUsersClient initialUsers={users} />
    </div>
  );
}
