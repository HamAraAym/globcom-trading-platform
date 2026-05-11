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
    <main className="lg:pl-72 flex-1 w-full relative h-screen overflow-hidden">
      <TeamChatUI 
        initialMessages={initialMessages} 
        currentUserId={user.id} 
      />
    </main>
  );
}