import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SalesLeaderboardProps {
    data: {
        userId: string;
        userName: string;
        division: string;
        achievedAmount: number;
        targetAmount: number;
        achievementPercentage: number;
    }[];
}

export function SalesLeaderboard({ data }: SalesLeaderboardProps) {
    // Sort data by achievedAmount (margin) descending
    const sortedData = [...data].sort((a, b) => b.achievedAmount - a.achievedAmount);
    const topThree = sortedData.slice(0, 3);

    if (topThree.length === 0) return null;

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
            {/* 2nd Place (Silver) - Display First on Mobile, but visually Left on Desktop */}
            {topThree[1] && (
                <Card className="border-slate-200 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden order-2 md:order-1 md:mt-4">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Medal className="w-16 h-16" />
                    </div>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 border-slate-300">
                            <span className="text-xl font-bold text-slate-500">2</span>
                        </div>
                        <CardTitle className="text-sm font-medium text-slate-600 line-clamp-1">
                            {topThree[1].userName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{topThree[1].division}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-lg font-bold text-slate-700">
                            {formatCurrency(topThree[1].achievedAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Margin Profit
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 1st Place (Gold) - Center */}
            {topThree[0] && (
                <Card className="border-yellow-200 bg-gradient-to-b from-yellow-50 to-white relative overflow-hidden order-1 md:order-2 shadow-lg scale-105 z-10">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Trophy className="w-16 h-16 text-yellow-600" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                    </div>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 border-yellow-400 shadow-sm">
                            <Trophy className="w-8 h-8 text-yellow-600" />
                        </div>
                        <CardTitle className="text-lg font-medium text-yellow-800 line-clamp-1">
                            {topThree[0].userName}
                        </CardTitle>
                        <p className="text-xs text-yellow-600 capitalize font-medium">{topThree[0].division}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-2xl font-bold text-yellow-700">
                            {formatCurrency(topThree[0].achievedAmount)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1 font-medium">
                            Total Margin Profit
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 3rd Place (Bronze) - Right */}
            {topThree[2] && (
                <Card className="border-orange-200 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden order-3 md:mt-4">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Award className="w-16 h-16 text-orange-600" />
                    </div>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 border-orange-300">
                            <span className="text-xl font-bold text-orange-600">3</span>
                        </div>
                        <CardTitle className="text-sm font-medium text-orange-800 line-clamp-1">
                            {topThree[2].userName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{topThree[2].division}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-lg font-bold text-orange-700">
                            {formatCurrency(topThree[2].achievedAmount)}
                        </p>
                        <p className="text-xs text-orange-800/60 mt-1">
                            Margin Profit
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
