import { prisma } from "@/lib/prisma";
import { acceptInvitation } from "@/actions/userActions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>; // ⚡ FIX 1: Type it as a Promise
}) {
  // ⚡ FIX 2: Await the searchParams before reading the token
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  // 1. If there's no token in the URL, block them
  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-10 text-center bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-gray-600">No invitation token was provided.</p>
        </div>
      </div>
    );
  }

  // 2. Look up the secure token in the database
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  // 3. If it doesn't exist or is expired, block them
  if (!invitation || invitation.expires < new Date()) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-10 text-center bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Expired or Invalid</h2>
          <p className="text-gray-600">
            This invitation link has expired or has already been used. Please ask your administrator to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // 4. If valid, show them the signup form!
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to GlobCom</h1>
          <p className="text-gray-500 mt-2">
            You have been invited as a <span className="font-semibold text-gray-800">{invitation.role.replace('_', ' ')}</span>.
          </p>
          <p className="text-sm text-gray-400 mt-1">Registering: {invitation.email}</p>
        </div>

        <form action={acceptInvitation} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input 
                name="firstName" 
                type="text" 
                required 
                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                name="lastName" 
                type="text" 
                required 
                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              minLength={8}
              className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none" 
            />
            <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-black text-white font-semibold p-3 rounded-md hover:bg-gray-800 transition-colors mt-2"
          >
            Create Account & Login
          </button>
        </form>
      </div>
    </div>
  );
}