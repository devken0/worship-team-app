import { getCurrentUser } from "@/lib/auth";
import AccountMenu from "./AccountMenu";

/**
 * Top-right account affordance for top-level screens. Replaces the old Profile
 * tab in the bottom nav: account/settings is a low-frequency destination, so it
 * lives as an initials avatar in the header rather than taking a nav slot.
 * Server component — reads the signed-in user, then hands off to the client-side
 * dropdown menu (Profile + Sign out).
 */
export default async function HeaderAvatar() {
  const user = await getCurrentUser();
  if (!user?.profile) return null;

  return (
    <AccountMenu
      name={user.profile.full_name}
      email={user.email}
      isAdmin={user.profile.role === "admin"}
    />
  );
}
