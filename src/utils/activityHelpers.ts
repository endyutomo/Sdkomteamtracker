import { ActivityType } from '@/types';

// Helper to get activity type as array (handles both single and multi)
export const getActivityTypes = (activityType: ActivityType | ActivityType[]): ActivityType[] => {
  return Array.isArray(activityType) ? activityType : [activityType];
};

// Helper to get first activity type (for display)
export const getFirstActivityType = (activityType: ActivityType | ActivityType[]): ActivityType => {
  return Array.isArray(activityType) ? activityType[0] : activityType;
};

// Helper to get customer names as array
export const getCustomerNames = (customerName: string | string[]): string[] => {
  return Array.isArray(customerName) ? customerName : [customerName];
};

// Helper to get first customer name (for display)
export const getFirstCustomerName = (customerName: string | string[]): string => {
  return Array.isArray(customerName) ? customerName[0] : customerName;
};

// Helper to display customer names as string
export const displayCustomerNames = (customerName: string | string[]): string => {
  const names = getCustomerNames(customerName);
  return names.join(', ');
};

// Helper to display activity types as labels
export const displayActivityTypes = (
  activityType: ActivityType | ActivityType[],
  labels: Record<string, string>
): string => {
  const types = getActivityTypes(activityType);
  return types.map(t => labels[t] || t).join(', ');
};
