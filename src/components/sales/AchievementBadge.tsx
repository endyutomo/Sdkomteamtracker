import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface AchievementBadgeProps {
    achievementPercentage: number;
    year?: number;
    compact?: boolean;
}

/**
 * Achievement badges based on yearly performance
 */
export const ACHIEVEMENT_BADGES = {
    bronze: { min: 40, max: 74.9, emoji: '🥉', name: 'Bronze', color: 'border-yellow-700 text-yellow-700 bg-yellow-50' },
    silver: { min: 75, max: 89.9, emoji: '🥈', name: 'Silver', color: 'border-gray-400 text-gray-700 bg-gray-100' },
    gold: { min: 90, max: 99.9, emoji: '🥇', name: 'Gold', color: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
    diamond: { min: 100, max: Infinity, emoji: '💎', name: 'Diamond', color: 'border-blue-500 text-blue-600 bg-blue-50' },
};

export function AchievementBadge({ achievementPercentage, year, compact = false }: AchievementBadgeProps) {
    let badge = null;

    if (achievementPercentage >= 100) {
        badge = ACHIEVEMENT_BADGES.diamond;
    } else if (achievementPercentage >= 90) {
        badge = ACHIEVEMENT_BADGES.gold;
    } else if (achievementPercentage >= 75) {
        badge = ACHIEVEMENT_BADGES.silver;
    } else if (achievementPercentage >= 40) {
        badge = ACHIEVEMENT_BADGES.bronze;
    }

    if (!badge) return null;

    if (compact) {
        return (
            <span className="inline-flex items-center gap-1" title={`${badge.name} Achievement ${year || ''}`}>
                <span className="text-lg">{badge.emoji}</span>
            </span>
        );
    }

    return (
        <Badge variant="outline" className={`${badge.color} font-semibold`}>
            <Award className="h-3 w-3 mr-1" />
            {badge.emoji} {badge.name}
            {year && <span className="ml-1 text-xs opacity-70">{year}</span>}
        </Badge>
    );
}

interface AchievementBadgeListProps {
    yearlyAchievements: Array<{ year: number; achievement: number }>;
}

/**
 * Display a list of achievement badges earned over the years
 */
export function AchievementBadgeList({ yearlyAchievements }: AchievementBadgeListProps) {
    const badgesEarned = yearlyAchievements.filter(ya => ya.achievement >= 40);

    if (badgesEarned.length === 0) {
        return (
            <div className="text-center p-4 text-muted-foreground text-sm">
                Belum ada achievement badge. Capai minimal 40% target tahunan!
            </div>
        );
    }

    // Count achievements by type
    const counts = {
        diamond: badgesEarned.filter(ya => ya.achievement >= 100).length,
        gold: badgesEarned.filter(ya => ya.achievement >= 90 && ya.achievement < 100).length,
        silver: badgesEarned.filter(ya => ya.achievement >= 75 && ya.achievement < 90).length,
        bronze: badgesEarned.filter(ya => ya.achievement >= 40 && ya.achievement < 75).length,
    };

    // Check for hall of fame (3+ consecutive years >= 90%)
    const hallOfFame = checkHallOfFame(yearlyAchievements);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {badgesEarned.map(({ year, achievement }) => (
                    <AchievementBadge key={year} achievementPercentage={achievement} year={year} />
                ))}
            </div>

            {/* Badge Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {counts.diamond > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200">
                        <div className="text-2xl text-center">💎</div>
                        <div className="text-center font-semibold text-blue-600">{counts.diamond}x Diamond</div>
                    </div>
                )}
                {counts.gold > 0 && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200">
                        <div className="text-2xl text-center">🥇</div>
                        <div className="text-center font-semibold text-yellow-600">{counts.gold}x Gold</div>
                    </div>
                )}
                {counts.silver > 0 && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-900/10 rounded border border-gray-200">
                        <div className="text-2xl text-center">🥈</div>
                        <div className="text-center font-semibold text-gray-600">{counts.silver}x Silver</div>
                    </div>
                )}
                {counts.bronze > 0 && (
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded border border-orange-200">
                        <div className="text-2xl text-center">🥉</div>
                        <div className="text-center font-semibold text-orange-600">{counts.bronze}x Bronze</div>
                    </div>
                )}
            </div>

            {/* Hall of Fame Badge */}
            {hallOfFame && (
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border-2 border-purple-500/30 text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="font-bold text-lg text-purple-600">Hall of Fame Member!</p>
                    <p className="text-sm text-muted-foreground">
                        {hallOfFame.count} tahun berturut-turut mencapai 90%+
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Check if user qualifies for Hall of Fame (3+ consecutive years >= 90%)
 */
function checkHallOfFame(yearlyAchievements: Array<{ year: number; achievement: number }>): { count: number } | null {
    const sorted = [...yearlyAchievements].sort((a, b) => b.year - a.year);

    let consecutiveCount = 0;
    let maxConsecutive = 0;

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].achievement >= 90) {
            consecutiveCount++;
            if (i > 0 && sorted[i].year !== sorted[i - 1].year - 1) {
                // Not consecutive, reset
                maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
                consecutiveCount = 1;
            }
        } else {
            maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
            consecutiveCount = 0;
        }
    }

    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);

    return maxConsecutive >= 3 ? { count: maxConsecutive } : null;
}
