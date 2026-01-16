import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getBonusTier } from '@/lib/bonusCalculator';

interface BonusAchievementTrackerProps {
    userId?: string;
    achievementPercentage: number;
    year: number;
    enabled?: boolean; // Allow disabling the tracker
}

/**
 * Hook to track bonus tier achievements and send notifications
 * Only runs when enabled and data is valid
 */
export function useBonusAchievementTracker({
    userId,
    achievementPercentage,
    year,
    enabled = true,
}: BonusAchievementTrackerProps) {
    const lastTierRef = useRef<number | null>(null);
    const hasNotifiedRef = useRef<Record<string, boolean>>({});
    const lastValidAchievementRef = useRef<number>(0);

    useEffect(() => {
        // Multiple safety guards
        if (!enabled) return;
        if (!userId) return;

        // Validate achievement percentage
        if (typeof achievementPercentage !== 'number') return;
        if (isNaN(achievementPercentage) || !isFinite(achievementPercentage)) return;
        if (achievementPercentage < 0 || achievementPercentage > 200) return; // Reasonable bounds
        if (achievementPercentage < 40) {
            // Reset when below threshold
            lastTierRef.current = null;
            return;
        }

        // Update last valid achievement
        lastValidAchievementRef.current = achievementPercentage;

        const currentTier = getBonusTier(achievementPercentage);
        if (!currentTier) return;

        const currentTierMin = currentTier.minPercentage;
        const notificationKey = `${userId}-${year}-${currentTierMin}`;

        // Check if we've already notified for this tier this session
        if (hasNotifiedRef.current[notificationKey]) return;

        // Check if user just crossed into a new tier
        const hasCrossedTier = lastTierRef.current !== null &&
            lastTierRef.current < currentTierMin &&
            achievementPercentage >= currentTierMin;

        if (hasCrossedTier) {
            // User crossed into new tier!
            const bonusRate = (currentTier.bonusRate * 100).toFixed(1);

            // Mark as notified immediately to prevent duplicates
            hasNotifiedRef.current[notificationKey] = true;

            // Show toast notification
            toast.success(`🎉 Selamat! Tier Baru Tercapai!`, {
                description: `Anda mencapai tier ${currentTier.label} dan mendapatkan bonus ${bonusRate}%!`,
                duration: 5000,
            });

            // Store notification in database (non-blocking, fire-and-forget)
            supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title: '🎉 Bonus Achievement - Tier Baru!',
                    message: `Selamat! Anda mencapai tier ${currentTier.label} (${achievementPercentage.toFixed(1)}%) dan mendapatkan bonus ${bonusRate}% dari margin tahun ${year}!`,
                })
                .then(({ error }) => {
                    if (error) console.warn('Could not store bonus notification:', error.message);
                });
        }

        // Update last tier for next comparison
        lastTierRef.current = currentTierMin;
    }, [enabled, userId, achievementPercentage, year]);
}
