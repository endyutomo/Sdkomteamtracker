import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Briefcase, Users, Activity } from 'lucide-react';

interface ActivityAnalyticsProps {
    getMonthlyActivityTrend: (year: number) => Array<{
        month: string;
        sales: number;
        presales: number;
        total: number;
    }>;
    selectedYear: number;
}

export function ActivityAnalytics({ getMonthlyActivityTrend, selectedYear }: ActivityAnalyticsProps) {
    const data = getMonthlyActivityTrend(selectedYear);
    const totalActivities = data.reduce((sum, item) => sum + item.total, 0);
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
    const totalPresales = data.reduce((sum, item) => sum + item.presales, 0);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Aktivitas {selectedYear}</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActivities}</div>
                        <p className="text-xs text-muted-foreground">aktivitas tercatat</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktivitas Sales</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSales}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalActivities > 0 ? ((totalSales / totalActivities) * 100).toFixed(1) : 0}% dari total
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktivitas Presales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPresales}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalActivities > 0 ? ((totalPresales / totalActivities) * 100).toFixed(1) : 0}% dari total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Trend Aktivitas Bulanan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="month" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="presales" name="Presales" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
