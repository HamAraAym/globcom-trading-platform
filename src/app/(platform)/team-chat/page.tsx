import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamChatUI from "./TeamChatUI";

export const dynamic = "force-dynamic";

export default async function TeamChatPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) redirect("/login");

  // ⚡ NEW: Fetch all active colleagues to populate the "Start Conversation" modal
  const colleagues = await prisma.user.findMany({
    where: { 
      isActive: true,
      id: { not: user.id } // Exclude the current user from their own contact list
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      onlineStatus: true
    },
    orderBy: {
      firstName: 'asc'
    }
  });

  return (
    <div className="h-[calc(100vh-100px)] lg:h-[calc(100vh-73px)] w-full flex flex-col bg-slate-50">
      <TeamChatUI 
        currentUserId={user.id} 
        users={colleagues} 
      />
    </div>
  );
}