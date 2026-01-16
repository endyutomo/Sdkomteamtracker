export interface BonusTier {
    minPercentage: number;
    maxPercentage: number;
    bonusRate: number;
    label: string;
    color: string;
}

export const BONUS_TIERS: BonusTier[] = [
    { minPercentage: 40, maxPercentage: 49.9, bonusRate: 0.03, label: '40-49.9%', color: 'text-yellow-600' },
    { minPercentage: 50, maxPercentage: 74.9, bonusRate: 0.05, label: '50-74.9%', color: 'text-orange-600' },
    { minPercentage: 75, maxPercentage: 89.9, bonusRate: 0.075, label: '75-89.9%', color: 'text-blue-600' },
    { minPercentage: 90, maxPercentage: Infinity, bonusRate: 0.10, label: '90-100%+', color: 'text-green-600' },
];

export interface BonusCalculation {
    bonusAmount: number;
    currentTier: BonusTier | null;
    nextTier: BonusTier | null;
    progressToNextTier: number;
    achievementPercentage: number;
}

/**
 * Calculate bonus based on achievement percentage and total margin
 * @param achievementPercentage - Percentage of target achieved (0-100+)
 * @param totalMargin - Total margin amount achieved
 * @returns Bonus calculation details
 */
export function calculateBonus(
    achievementPercentage: number,
    totalMargin: number
): BonusCalculation {
    // Find current tier
    const currentTier = BONUS_TIERS.find(
        tier => achievementPercentage >= tier.minPercentage && achievementPercentage <= tier.maxPercentage
    ) || null;

    // Find next tier
    const currentTierIndex = currentTier ? BONUS_TIERS.indexOf(currentTier) : -1;
    const nextTier = currentTierIndex >= 0 && currentTierIndex < BONUS_TIERS.length - 1
        ? BONUS_TIERS[currentTierIndex + 1]
        : null;

    // Calculate bonus amount
    const bonusAmount = currentTier ? totalMargin * currentTier.bonusRate : 0;

    // Calculate progress to next tier (0-100)
    let progressToNextTier = 0;
    if (currentTier && nextTier) {
        const currentMin = currentTier.minPercentage;
        const nextMin = nextTier.minPercentage;
        const range = nextMin - currentMin;
        const progress = achievementPercentage - currentMin;
        progressToNextTier = Math.min((progress / range) * 100, 100);
    } else if (currentTier && !nextTier) {
        // Already at max tier
        progressToNextTier = 100;
    }

    return {
        bonusAmount,
        currentTier,
        nextTier,
        progressToNextTier,
        achievementPercentage,
    };
}

/**
 * Get bonus tier by achievement percentage
 */
export function getBonusTier(achievementPercentage: number): BonusTier | null {
    return BONUS_TIERS.find(
        tier => achievementPercentage >= tier.minPercentage && achievementPercentage <= tier.maxPercentage
    ) || null;
}

/**
 * Check if achievement percentage qualifies for bonus
 */
export function qualifiesForBonus(achievementPercentage: number): boolean {
    return achievementPercentage >= 40;
}
