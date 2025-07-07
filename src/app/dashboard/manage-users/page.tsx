import { ManageUsersClient } from '@/components/dashboard/manage-users-client';
import { getUsers, getCurrentUser } from '@/lib/db';
import DashboardProvider from '../dashboard-provider';

export default async function ManageUsersPage({ searchParams }: { searchParams: { userId?: string } }) {
  const [users, currentUser] = await Promise.all([
      getUsers(),
      getCurrentUser(searchParams.userId)
  ]);
  
  return (
    <DashboardProvider searchParams={searchParams}>
        <div className="h-full">
            <ManageUsersClient initialUsers={users} currentUser={currentUser} />
        </div>
    </DashboardProvider>
  );
}
