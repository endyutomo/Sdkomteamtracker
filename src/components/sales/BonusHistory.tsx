import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { calculateBonus, BONUS_TIERS } from '@/lib/bonusCalculator';
import { AchievementBadgeList } from './AchievementBadge';
import { Award, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { useSales } from '@/hooks/useSales';

interface BonusHistoryProps {
    userId?: string;
}

export function BonusHistory({ userId }: BonusHistoryProps) {
    const { getAvailableYears, getTargetForPeriod, getSalesForPeriod } = useSales({});
    const availableYears = getAvailableYears();

    // Calculate bonus for each year
    const bonusHistory = availableYears.map(year => {
        const yearlyTarget = getTargetForPeriod('yearly', year);
        const yearlySales = getSalesForPeriod('yearly', year);
        const yearlyTotal = yearlySales.reduce((sum, r) => sum + (r.marginAmount || 0), 0);
        const achievementPercentage = yearlyTarget && yearlyTarget.targetAmount > 0
            ? (yearlyTotal / yearlyTarget.targetAmount) * 100
            : 0;

        const bonus = calculateBonus(achievementPercentage, yearlyTotal);

        return {
            year,
            targetAmount: yearlyTarget?.targetAmount || 0,
            achievedMargin: yearlyTotal,
            achievementPercentage,
            bonusAmount: bonus.bonusAmount,
            tier: bonus.currentTier,
        };
    }).filter(b => b.achievementPercentage >= 40); // Only show years that qualified for bonus

    const totalBonusAllTime = bonusHistory.reduce((sum, b) => sum + b.bonusAmount, 0);

    if (bonusHistory.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Riwayat Bonus
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        Belum ada riwayat bonus. Capai minimal 40% target tahunan untuk mendapatkan bonus!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Riwayat Bonus
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Bonus Sepanjang Masa</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalBonusAllTime)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="history" className="w-full">
                    <TabsList>
                        <TabsTrigger value="history">
                            <Award className="h-4 w-4 mr-1" />
                            Riwayat Bonus
                        </TabsTrigger>
                        <TabsTrigger value="badges">
                            <Trophy className="h-4 w-4 mr-1" />
                            Achievement Badges
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="mt-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Tahun
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Target</TableHead>
                                        <TableHead className="text-right">Margin Dicapai</TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingUp className="h-4 w-4" />
                                                Pencapaian
                                            </div>
                                        </TableHead>
                                        <TableHead>Tier</TableHead>
                                        <TableHead className="text-right">Bonus</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bonusHistory.map((item) => (
                                        <TableRow key={item.year}>
                                            <TableCell className="font-medium">{item.year}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.targetAmount)}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatCurrency(item.achievedMargin)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-semibold ${item.achievementPercentage >= 90 ? 'text-green-600' :
                                                    item.achievementPercentage >= 75 ? 'text-blue-600' :
                                                        item.achievementPercentage >= 50 ? 'text-orange-600' : 'text-yellow-600'
                                                    }`}>
                                                    {item.achievementPercentage.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {item.tier && (
                                                    <Badge variant="outline" className={item.tier.color}>
                                                        {item.tier.label} ({(item.tier.bonusRate * 100).toFixed(1)}%)
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-lg font-bold text-green-600">
                                                    {formatCurrency(item.bonusAmount)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Achievement Trend Chart or Summary */}
                        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm font-medium mb-2">📊 Ringkasan Performa:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Tahun Terbaik</p>
                                    <p className="font-bold">
                                        {bonusHistory.reduce((prev, curr) =>
                                            curr.achievementPercentage > prev.achievementPercentage ? curr : prev
                                        ).year}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Pencapaian Tertinggi</p>
                                    <p className="font-bold text-green-600">
                                        {Math.max(...bonusHistory.map(b => b.achievementPercentage)).toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Bonus Tertinggi</p>
                                    <p className="font-bold text-green-600">
                                        {formatCurrency(Math.max(...bonusHistory.map(b => b.bonusAmount)))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Rata-rata Pencapaian</p>
                                    <p className="font-bold">
                                        {(bonusHistory.reduce((sum, b) => sum + b.achievementPercentage, 0) / bonusHistory.length).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="badges" className="mt-4">
                        <AchievementBadgeList
                            yearlyAchievements={bonusHistory.map(b => ({
                                year: b.year,
                                achievement: b.achievementPercentage
                            }))}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
