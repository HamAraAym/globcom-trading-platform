import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamChatUI from "./TeamChatUI";
import { getTeamMessages } from "@/actions/teamChatActions";

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

  // Fetch initial history to populate the chat
  const initialMessages = await getTeamMessages();

  return (
    // ⚡ FIX: Removed lg:pl-72. Used height calc to fill the remaining space inside your PageWrapper perfectly!
    <div className="h-[calc(100vh-100px)] lg:h-[calc(100vh-73px)] w-full flex flex-col bg-slate-50">
      <TeamChatUI 
        initialMessages={initialMessages} 
        currentUserId={user.id} 
      />
    </div>
  );
}