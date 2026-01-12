import { useMemo, useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, TrendingUp, Users, Briefcase, Layers, Calendar } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, getWeek, format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TeamActivityStatsProps {
    activities: DailyActivity[];
    allProfiles: Profile[];
}

export function TeamActivityStats({ activities, allProfiles }: TeamActivityStatsProps) {
    const [filterType, setFilterType] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedWeek, setSelectedWeek] = useState(1); // 1-5

    const availableYears = useMemo(() => {
        const years = activities.map(a => new Date(a.date).getFullYear());
        return [...new Set(years)].sort((a, b) => b - a);
    }, [activities]);

    const stats = useMemo(() => {
        let filteredActivities = activities;

        // Apply Time Filter
        if (filterType === 'yearly') {
            const start = startOfYear(new Date(selectedYear, 0, 1));
            const end = endOfYear(new Date(selectedYear, 0, 1));
            filteredActivities = activities.filter(a =>
                isWithinInterval(new Date(a.date), { start, end })
            );
        } else if (filterType === 'monthly') {
            const start = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
            const end = endOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
            filteredActivities = activities.filter(a =>
                isWithinInterval(new Date(a.date), { start, end })
            );
        } else if (filterType === 'weekly') {
            // Calculate start/end of the N-th week of the selected month
            const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
            // Adjust to start of the week for the 1st of month
            const approximateDate = new Date(selectedYear, selectedMonth - 1, 1 + (selectedWeek - 1) * 7);
            const start = startOfWeek(approximateDate, { weekStartsOn: 1 }); // Monday start
            const end = endOfWeek(approximateDate, { weekStartsOn: 1 });

            filteredActivities = activities.filter(a =>
                isWithinInterval(new Date(a.date), { start, end })
            );
        }

        // Filter out attendance records from productivity stats
        filteredActivities = filteredActivities.filter(a =>
            !['sick', 'permission', 'time_off', 'wfh'].includes(a.activityType)
        );

        const totalActivities = filteredActivities.length;
        if (totalActivities === 0) return [];

        // Group by personName since activity stores personName directly
        // Ideally we relate by userId but legacy data might only have personName
        const personStats = activities.reduce((acc, activity) => {
            const name = activity.personName;

            // Only count if this specific activity is in the filtered list
            // Optimization: The 'filteredActivities' array is already filtered.
            // But 'activities.reduce' iterates over ALL. 
            // Better logic: Iterate over 'filteredActivities' instead of 'activities'.
            return acc;
        }, {} as Record<string, { name: string; count: number; division: string; lastActivity: Date }>);

        // Correct logic: Reduce filteredActivities
        const filteredPersonStats = filteredActivities.reduce((acc, activity) => {
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

        return Object.values(filteredPersonStats)
            .map(stat => ({
                ...stat,
                percentage: (stat.count / totalActivities) * 100,
            }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    }, [activities, allProfiles, filterType, selectedYear, selectedMonth, selectedWeek]);

    if (stats.length === 0 && activities.length === 0) return null; // Only filtering by activities global

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
                                Tidak ada data aktivitas untuk periode ini.
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Statistik Performa Tim
                    </CardTitle>
                    <div className="flex bg-muted/20 p-1 rounded-lg">
                        <Button
                            variant={filterType === 'weekly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('weekly')}
                            className="text-xs"
                        >
                            Mingguan
                        </Button>
                        <Button
                            variant={filterType === 'monthly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('monthly')}
                            className="text-xs"
                        >
                            Bulanan
                        </Button>
                        <Button
                            variant={filterType === 'yearly' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('yearly')}
                            className="text-xs"
                        >
                            Tahunan
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {/* Year Selector */}
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.length > 0 ? (
                                availableYears.map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>

                    {/* Month Selector */}
                    {(filterType === 'monthly' || filterType === 'weekly') && (
                        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...Array(12)].map((_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {format(new Date(selectedYear, i, 1), 'MMMM', { locale: id })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Week Selector */}
                    {filterType === 'weekly' && (
                        <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Minggu" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map(w => (
                                    <SelectItem key={w} value={w.toString()}>Minggu ke-{w}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
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
