import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTasks } from "@/actions/taskActions";
import ClientModalWrapper from "../ClientModalWrapper";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!currentUser) redirect("/login");

  // ⚡ 1. Fetch ONLY tasks where the current user is an assignee
  const response = await getTasks({ userId: currentUser.id });
  const myTasks = response.success && response.data ? response.data : [];

  // 2. Fetch active users (needed for the Edit Modal dropdown if they want to reassign a task)
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
    orderBy: { firstName: "asc" }
  });

  return (
    <ClientModalWrapper 
      tasks={myTasks as any} 
      users={users} 
      currentUserId={currentUser.id} 
      // ⚡ 3. We deliberately pass "USER" here instead of currentUser.role. 
      // This explicitly hides the "Admin Global Switcher" dropdown from the UI, 
      // locking this view strictly to their own tasks.
      userRole="USER" 
    />
  );
}