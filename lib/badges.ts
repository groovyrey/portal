import { Badge } from '@/types';

export const BADGES: Record<string, Badge> = {
  staff: {
    id: 'staff',
    name: 'Staff',
    description: 'Official portal staff member',
    icon: 'ShieldCheck',
    color: 'blue',
    permissions: [], // No permissions yet as requested
  },
};

export const BADGE_LIST = [BADGES.staff];

/**
 * Checks if a user has a specific permission based on their badges
 * @param userBadges Array of badge IDs the user has
 * @param permission The permission string to check
 */
export function hasPermission(userBadges: string[] | undefined, permission: string): boolean {
  if (!userBadges) return false;
  
  return userBadges.some(badgeId => {
    const badge = BADGES[badgeId];
    return badge && badge.permissions.includes(permission);
  });
}

/**
 * Gets all permissions associated with a list of badges
 */
export function getPermissionsFromBadges(userBadges: string[] | undefined): string[] {
  if (!userBadges) return [];
  
  const permissions = new Set<string>();
  userBadges.forEach(badgeId => {
    const badge = BADGES[badgeId];
    if (badge) {
      badge.permissions.forEach(p => permissions.add(p));
    }
  });
  
  return Array.from(permissions);
}
