/**
 * Master-admin check based on the real `admin` role from the database.
 *
 * Do NOT gate privileges on a hardcoded username/email: that is trivially
 * forgeable and impossible to revoke. The `admin` role is granted via the
 * seed/RBAC and carries every permission.
 */
export function isMasterAdmin(user?: { roles?: string[] } | null): boolean {
  return !!user?.roles?.includes('admin');
}