import { db } from './db';
import { subscriptionUsage, subscriptions, organizations, subscriptionPlans } from './schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Feature Gating & Usage Limits
 * Controls access to features based on subscription tier
 */

// Subscription tier limits
export const TIER_LIMITS = {
  starter: {
    maxUsers: 2,
    maxJobsPerMonth: 50,
    maxStorageMb: 5120, // 5GB
    maxLocations: 1,
    features: {
      xeroIntegration: false,
      advancedReporting: false,
      inventory: false,
      smsNotifications: false,
      customBranding: false,
      bookingWidget: true,
      dvi: true,
      invoicing: true,
      stripePayments: true,
      mobileApp: true,
    },
  },
  professional: {
    maxUsers: 10,
    maxJobsPerMonth: -1, // Unlimited
    maxStorageMb: 51200, // 50GB
    maxLocations: 1,
    features: {
      xeroIntegration: true,
      advancedReporting: true,
      inventory: true,
      smsNotifications: true,
      customBranding: true,
      bookingWidget: true,
      dvi: true,
      invoicing: true,
      stripePayments: true,
      mobileApp: true,
    },
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxJobsPerMonth: -1, // Unlimited
    maxStorageMb: 204800, // 200GB
    maxLocations: 5,
    features: {
      xeroIntegration: true,
      advancedReporting: true,
      inventory: true,
      smsNotifications: true,
      customBranding: true,
      bookingWidget: true,
      dvi: true,
      invoicing: true,
      stripePayments: true,
      mobileApp: true,
      multiLocation: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
};

/**
 * Check if organization has access to a feature
 */
export async function hasFeatureAccess(
  organizationId: number,
  feature: keyof typeof TIER_LIMITS.professional.features
): Promise<boolean> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) return false;

  // Allow access during trial or if subscription is active
  if (org.subscriptionStatus === 'cancelled' || org.subscriptionStatus === 'suspended') {
    return false;
  }

  const tier = org.subscriptionTier;
  const limits = TIER_LIMITS[tier];

  return limits.features[feature] === true;
}

/**
 * Check if organization can create more jobs this month
 */
export async function canCreateJob(organizationId: number): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    return { allowed: false, current: 0, limit: 0, message: 'Organization not found' };
  }

  const tier = org.subscriptionTier;
  const limits = TIER_LIMITS[tier];

  // Unlimited jobs
  if (limits.maxJobsPerMonth === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Get current month usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await db.query.subscriptionUsage.findFirst({
    where: and(
      eq(subscriptionUsage.organizationId, organizationId),
      gte(subscriptionUsage.billingPeriodStart, startOfMonth),
      lte(subscriptionUsage.billingPeriodEnd, endOfMonth)
    ),
  });

  const currentJobs = usage?.jobsCreated || 0;

  if (currentJobs >= limits.maxJobsPerMonth) {
    return {
      allowed: false,
      current: currentJobs,
      limit: limits.maxJobsPerMonth,
      message: `Monthly job limit reached (${limits.maxJobsPerMonth}). Upgrade to Professional for unlimited jobs.`,
    };
  }

  return {
    allowed: true,
    current: currentJobs,
    limit: limits.maxJobsPerMonth,
  };
}

/**
 * Increment job count for usage tracking
 */
export async function trackJobCreated(organizationId: number): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Find or create usage record for current month
  const existing = await db.query.subscriptionUsage.findFirst({
    where: and(
      eq(subscriptionUsage.organizationId, organizationId),
      gte(subscriptionUsage.billingPeriodStart, startOfMonth),
      lte(subscriptionUsage.billingPeriodEnd, endOfMonth)
    ),
  });

  if (existing) {
    await db.update(subscriptionUsage)
      .set({
        jobsCreated: existing.jobsCreated + 1,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionUsage.id, existing.id));
  } else {
    await db.insert(subscriptionUsage).values({
      organizationId,
      billingPeriodStart: startOfMonth,
      billingPeriodEnd: endOfMonth,
      jobsCreated: 1,
      storageUsedMb: 0,
      activeUsers: 1,
      apiCalls: 0,
    });
  }
}

/**
 * Check if organization can add more users
 */
export async function canAddUser(organizationId: number, currentUserCount: number): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    return { allowed: false, current: 0, limit: 0, message: 'Organization not found' };
  }

  const tier = org.subscriptionTier;
  const limits = TIER_LIMITS[tier];

  // Unlimited users
  if (limits.maxUsers === -1) {
    return { allowed: true, current: currentUserCount, limit: -1 };
  }

  if (currentUserCount >= limits.maxUsers) {
    return {
      allowed: false,
      current: currentUserCount,
      limit: limits.maxUsers,
      message: `User limit reached (${limits.maxUsers}). Upgrade to add more team members.`,
    };
  }

  return {
    allowed: true,
    current: currentUserCount,
    limit: limits.maxUsers,
  };
}

/**
 * Check storage usage
 */
export async function checkStorageLimit(organizationId: number, additionalMb: number = 0): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    return { allowed: false, current: 0, limit: 0, message: 'Organization not found' };
  }

  const tier = org.subscriptionTier;
  const limits = TIER_LIMITS[tier];

  // Get current month usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await db.query.subscriptionUsage.findFirst({
    where: and(
      eq(subscriptionUsage.organizationId, organizationId),
      gte(subscriptionUsage.billingPeriodStart, startOfMonth),
      lte(subscriptionUsage.billingPeriodEnd, endOfMonth)
    ),
  });

  const currentStorage = usage?.storageUsedMb || 0;
  const newTotal = currentStorage + additionalMb;

  if (newTotal > limits.maxStorageMb) {
    return {
      allowed: false,
      current: currentStorage,
      limit: limits.maxStorageMb,
      message: `Storage limit exceeded. Upgrade for more storage.`,
    };
  }

  return {
    allowed: true,
    current: currentStorage,
    limit: limits.maxStorageMb,
  };
}

/**
 * Track storage usage
 */
export async function trackStorageUsed(organizationId: number, sizeMb: number): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const existing = await db.query.subscriptionUsage.findFirst({
    where: and(
      eq(subscriptionUsage.organizationId, organizationId),
      gte(subscriptionUsage.billingPeriodStart, startOfMonth),
      lte(subscriptionUsage.billingPeriodEnd, endOfMonth)
    ),
  });

  if (existing) {
    await db.update(subscriptionUsage)
      .set({
        storageUsedMb: existing.storageUsedMb + sizeMb,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionUsage.id, existing.id));
  } else {
    await db.insert(subscriptionUsage).values({
      organizationId,
      billingPeriodStart: startOfMonth,
      billingPeriodEnd: endOfMonth,
      jobsCreated: 0,
      storageUsedMb: sizeMb,
      activeUsers: 1,
      apiCalls: 0,
    });
  }
}

/**
 * Get current usage for an organization
 */
export async function getCurrentUsage(organizationId: number) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) return null;

  const tier = org.subscriptionTier;
  const limits = TIER_LIMITS[tier];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await db.query.subscriptionUsage.findFirst({
    where: and(
      eq(subscriptionUsage.organizationId, organizationId),
      gte(subscriptionUsage.billingPeriodStart, startOfMonth),
      lte(subscriptionUsage.billingPeriodEnd, endOfMonth)
    ),
  });

  return {
    tier,
    limits,
    usage: {
      jobsCreated: usage?.jobsCreated || 0,
      storageUsedMb: usage?.storageUsedMb || 0,
      activeUsers: usage?.activeUsers || 0,
      apiCalls: usage?.apiCalls || 0,
    },
    billingPeriod: {
      start: startOfMonth,
      end: endOfMonth,
    },
  };
}
