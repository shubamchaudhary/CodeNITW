// Who may see the owner-only pages (no React, so tests can load it).

export const OWNER_EMAIL = "beshubam@gmail.com";

export function isOwner(user) {
  return !!user && (user.email || "").toLowerCase() === OWNER_EMAIL;
}

// People the owner has let into the AI Stack (and only the AI Stack: the job tracker, projects and
// every other owner-only page stay the owner's). They need a verified email, so nobody can take
// the address by signing up with it first. To let someone in, add their address here; to remove
// them, delete the line.
const AI_STACK_GUESTS = ["sachinmishra2709@gmail.com"];

/** The owner, or a guest the owner let into the AI Stack. */
export function canSeeAiStack(user) {
  if (isOwner(user)) return true;
  return !!user && user.emailVerified === true && AI_STACK_GUESTS.includes((user.email || "").toLowerCase());
}
