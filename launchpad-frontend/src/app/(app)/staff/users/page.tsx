import { requireAdmin } from "@/lib/auth";
import { getMembers } from "@/lib/users";
import { UserActions } from "./user-actions";

export default async function UsersPage() {
  await requireAdmin("/staff/users");
  const members = await getMembers();

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">Users</h1>
      <p className="mt-2 text-muted">Members who can vote, comment, and submit products.</p>

      {members.length === 0 ? (
        <p className="mt-6 text-muted">No members yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-hairline">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-fill text-xs font-medium text-background">
                {member.firstName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {member.firstName} {member.lastName}
                </p>
                <p className="truncate text-sm text-muted">{member.email}</p>
              </div>
              {member.isSuspended && (
                <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-danger">
                  Suspended
                </span>
              )}
              <UserActions id={member.id} isSuspended={member.isSuspended} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
