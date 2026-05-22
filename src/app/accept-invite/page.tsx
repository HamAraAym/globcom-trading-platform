import { prisma } from "@/lib/prisma";
import { acceptInvitation } from "@/actions/userActions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  // 1. If there's no token in the URL, block them
  if (!token) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50">
        <div className="p-10 text-center bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 m-4">
          <h2 className="text-xl font-black text-rose-600 mb-2">Invalid Link</h2>
          <p className="text-slate-500 text-sm">No invitation token was provided.</p>
        </div>
      </div>
    );
  }

  // 2. Look up the secure token in the database
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  // 3. If it doesn't exist or is expired, block them
  if (!invitation || invitation.expires < new Date()) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50">
        <div className="p-10 text-center bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 m-4">
          <h2 className="text-xl font-black text-rose-600 mb-2">Expired or Invalid</h2>
          <p className="text-slate-500 text-sm">
            This invitation link has expired or has already been used. Please ask your administrator to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // 4. If valid, show them the signup form (FULL SCREEN TAKEOVER)
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 overflow-y-auto">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-slate-200 m-4">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome to GlobCom</h1>
          <p className="text-slate-500 mt-2 text-sm">
            You have been invited as a <span className="font-bold text-slate-800">{invitation.role.replace('_', ' ')}</span>.
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Registering: {invitation.email}</p>
        </div>

        <form action={acceptInvitation} className="flex flex-col gap-5">
          <input type="hidden" name="token" value={token} />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
              <input 
                name="firstName" 
                type="text" 
                required 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
              <input 
                name="lastName" 
                type="text" 
                required 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              minLength={8}
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" 
            />
            <p className="text-xs text-slate-400 mt-2 font-medium">Must be at least 8 characters.</p>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-black text-white font-bold p-3.5 rounded-xl hover:bg-slate-800 transition-all mt-2 active:scale-[0.98]"
          >
            Create Account & Login
          </button>
        </form>
      </div>
    </div>
  );
}