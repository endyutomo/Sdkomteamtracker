import { useMemo } from 'react';
import { DailyActivity, Person } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Users, Briefcase, Layers } from 'lucide-react';

interface TeamActivityStatsProps {
    activities: DailyActivity[];
    allProfiles: Profile[];
}

export function TeamActivityStats({ activities, allProfiles }: TeamActivityStatsProps) {
    const stats = useMemo(() => {
        const totalActivities = activities.length;
        if (totalActivities === 0) return [];

        // Group by personName since activity stores personName directly
        // Ideally we relate by userId but legacy data might only have personName
        const personStats = activities.reduce((acc, activity) => {
            const name = activity.personName;
            if (!acc[name]) {
                // Find profile to get division/avatar info
                const profile = allProfiles.find(p => p.name === name);
                acc[name] = {
                    name,
                    count: 0,
                    division: profile?.division || activity.category || 'unknown',
                    lastActivity: activity.date,
                };
            }
            acc[name].count += 1;
            // Keep most recent date
            if (new Date(activity.date) > new Date(acc[name].lastActivity)) {
                acc[name].lastActivity = activity.date;
            }
            return acc;
        }, {} as Record<string, { name: string; count: number; division: string; lastActivity: Date }>);

        return Object.values(personStats)
            .map(stat => ({
                ...stat,
                percentage: (stat.count / totalActivities) * 100,
            }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    }, [activities, allProfiles]);

    if (stats.length === 0) return null;

    const renderTable = (filteredStats: typeof stats) => (
        <div className="rounded-md border bg-background">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] text-center">Rank</TableHead>
                        <TableHead>Anggota Tim</TableHead>
                        <TableHead className="text-center">Aktivitas</TableHead>
                        <TableHead className="w-[40%]">Persentase</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredStats.map((stat, index) => (
                        <TableRow key={stat.name}>
                            <TableCell className="text-center font-medium">
                                {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 mx-auto" />}
                                {index === 1 && <Medal className="h-4 w-4 text-gray-400 mx-auto" />}
                                {index === 2 && <Award className="h-4 w-4 text-amber-600 mx-auto" />}
                                {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{stat.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{stat.name}</span>
                                        <Badge variant="outline" className="w-fit text-[10px] h-4 px-1">
                                            {stat.division.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">
                                {stat.count}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Progress value={stat.percentage} className="h-2" />
                                    <span className="text-xs text-muted-foreground w-12 border rounded px-1 text-center bg-muted/50">
                                        {stat.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {filteredStats.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Tidak ada data untuk divisi ini
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Statistik Performa Tim
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="all" className="gap-2">
                            <Layers className="h-4 w-4" />
                            Semua
                        </TabsTrigger>
                        <TabsTrigger value="sales" className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Sales
                        </TabsTrigger>
                        <TabsTrigger value="presales" className="gap-2">
                            <Users className="h-4 w-4" />
                            Presales
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        {renderTable(stats)}
                    </TabsContent>
                    <TabsContent value="sales">
                        {renderTable(stats.filter(s => s.division === 'sales'))}
                    </TabsContent>
                    <TabsContent value="presales">
                        {renderTable(stats.filter(s => s.division === 'presales'))}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
