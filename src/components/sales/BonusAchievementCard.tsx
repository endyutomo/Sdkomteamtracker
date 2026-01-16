import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateBonus, BONUS_TIERS } from '@/lib/bonusCalculator';

interface BonusAchievementCardProps {
    achievementPercentage: number;
    totalMargin: number;
    year: number;
    compact?: boolean;
}

export function BonusAchievementCard({
    achievementPercentage,
    totalMargin,
    year,
    compact = false
}: BonusAchievementCardProps) {
    const { bonusAmount, currentTier, nextTier, progressToNextTier } = calculateBonus(
        achievementPercentage,
        totalMargin
    );

    // Show card only if achievement >= 40%
    if (achievementPercentage < 40) return null;

    return (
        <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/5 border-green-500/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm font-medium">
                        🎉 Bonus Achievement {year}
                    </CardTitle>
                </div>
                {achievementPercentage >= 90 && (
                    <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Bonus Amount */}
                <div className="text-center bg-white/50 dark:bg-black/20 rounded-lg p-4">
                    <p className="text-3xl font-bold text-green-600 mb-1">
                        {formatCurrency(bonusAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimasi Bonus</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        dari margin {formatCurrency(totalMargin)}
                    </p>
                </div>

                {/* Current Tier Badge */}
                {currentTier && (
                    <div className="text-center">
                        <Badge
                            variant="outline"
                            className={`${currentTier.color} border-current bg-white/50 dark:bg-black/20`}
                        >
                            Tier Saat Ini: {currentTier.label} = {(currentTier.bonusRate * 100).toFixed(1)}% bonus
                        </Badge>
                    </div>
                )}

                {/* Progress to Next Tier */}
                {nextTier ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>Progress ke Tier Berikutnya</span>
                            </div>
                            <span className="font-medium">
                                {achievementPercentage.toFixed(1)}% → {nextTier.minPercentage}%
                            </span>
                        </div>
                        <Progress value={Math.min(progressToNextTier, 100)} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                            Naik ke <span className="font-semibold text-green-600">{(nextTier.bonusRate * 100).toFixed(1)}%</span> bonus
                            dengan mencapai <span className="font-semibold">{nextTier.minPercentage}%</span> target
                        </p>
                    </div>
                ) : (
                    <div className="text-center p-3 bg-gradient-to-r from-yellow-500/10 to-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm font-semibold text-green-600">
                            🏆 Tier Tertinggi! Pertahankan performa Anda!
                        </p>
                    </div>
                )}

                {!compact && (
                    <>
                        {/* Tier Breakdown */}
                        <div className="pt-3 border-t space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Semua Tier Bonus:</p>
                            <div className="grid grid-cols-4 gap-2">
                                {BONUS_TIERS.map((tier) => {
                                    const isCurrentTier = currentTier?.label === tier.label;
                                    const isPassed = achievementPercentage >= tier.minPercentage;

                                    return (
                                        <div
                                            key={tier.label}
                                            className={`p-2 rounded-lg text-center transition-all ${isCurrentTier
                                                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 scale-105'
                                                    : isPassed
                                                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-300'
                                                        : 'bg-muted border border-border'
                                                }`}
                                        >
                                            <div className={`font-bold text-sm ${isCurrentTier ? 'text-green-600' : ''}`}>
                                                {tier.minPercentage}%
                                            </div>
                                            <div className={`text-[10px] ${isCurrentTier ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                                                {(tier.bonusRate * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Motivational Message */}
                        <div className="pt-2 text-center">
                            {achievementPercentage >= 90 && (
                                <p className="text-xs text-green-600 font-medium">
                                    💎 Performa Luar Biasa! Anda di tier tertinggi!
                                </p>
                            )}
                            {achievementPercentage >= 75 && achievementPercentage < 90 && (
                                <p className="text-xs text-blue-600 font-medium">
                                    ⭐ Performa Sangat Baik! Sedikit lagi ke tier 10%!
                                </p>
                            )}
                            {achievementPercentage >= 50 && achievementPercentage < 75 && (
                                <p className="text-xs text-orange-600 font-medium">
                                    🔥 Terus tingkatkan! Target 75% untuk bonus 7.5%!
                                </p>
                            )}
                            {achievementPercentage >= 40 && achievementPercentage < 50 && (
                                <p className="text-xs text-yellow-600 font-medium">
                                    💪 Bagus! Kejar 50% untuk bonus 5%!
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
