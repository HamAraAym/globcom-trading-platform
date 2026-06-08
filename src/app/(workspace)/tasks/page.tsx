import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientModalWrapper from "./ClientModalWrapper";
import { getTasks } from "@/actions/taskActions";
import { prisma } from "@/lib/prisma";

// Forces Next.js to fetch fresh data every time someone loads the page
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  // 1. Secure Route Verification & Get Current User
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!currentUser) redirect("/login");

  // 2. Fetch initial board records
  const response = await getTasks();
  const tasks = response.success && response.data ? response.data : [];

  // 3. Fetch all active users for the Admin switcher & Modal tagging
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
    orderBy: { firstName: "asc" }
  });

  return (
    <ClientModalWrapper 
      tasks={tasks as any} 
      users={users} 
      currentUserId={currentUser.id} 
      userRole={currentUser.role} 
    />
  );
}