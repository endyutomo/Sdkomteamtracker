import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface SalesAnalyticsProps {
    getMonthlyTrend: (year: number) => Array<{
        month: string;
        monthNumber: number;
        sales: number;
        margin: number;
        target: number;
        transactions: number;
        achievement: number;
    }>;
    getAvailableYears: () => number[];
    formatCurrency: (value: number) => string;
}

export function SalesAnalytics({ getMonthlyTrend, getAvailableYears, formatCurrency }: SalesAnalyticsProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [compareYear, setCompareYear] = useState(currentYear - 1);

    const availableYears = getAvailableYears();
    const years = availableYears.length > 0 ? availableYears : [currentYear];

    // Ensure selected years are valid
    const validYear = years.includes(selectedYear) ? selectedYear : years[0] || currentYear;
    const validCompareYear = years.includes(compareYear) ? compareYear : (years[1] || currentYear - 1);

    const currentData = getMonthlyTrend(validYear);
    const compareData = getMonthlyTrend(validCompareYear);

    // Combine data for comparison chart
    const comparisonData = currentData.map((item, index) => ({
        month: item.month,
        [`Margin ${validYear}`]: item.margin,
        [`Margin ${validCompareYear}`]: compareData[index]?.margin || 0,
        [`Target ${validYear}`]: item.target,
    }));

    // Calculate yearly totals
    const yearlyTotal = currentData.reduce((sum, m) => sum + m.margin, 0);
    const yearlyTarget = currentData.reduce((sum, m) => sum + m.target, 0);
    const yearlySales = currentData.reduce((sum, m) => sum + m.sales, 0);
    const yearlyTransactions = currentData.reduce((sum, m) => sum + m.transactions, 0);
    const yearlyAchievement = yearlyTarget > 0 ? (yearlyTotal / yearlyTarget) * 100 : 0;

    // Compare with previous year
    const prevYearlyTotal = compareData.reduce((sum, m) => sum + m.margin, 0);
    const growthPercentage = prevYearlyTotal > 0 ? ((yearlyTotal - prevYearlyTotal) / prevYearlyTotal) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tahun:</span>
                    <Select value={validYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Bandingkan dengan:</span>
                    <Select value={validCompareYear.toString()} onValueChange={(v) => setCompareYear(Number(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Margin {validYear}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(yearlyTotal)}</div>
                        <p className={`text-xs ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(1)}% vs {validCompareYear}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(yearlySales)}</div>
                        <p className="text-xs text-muted-foreground">{yearlyTransactions} transaksi</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Target Tahunan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(yearlyTarget)}</div>
                        <p className="text-xs text-muted-foreground">
                            {yearlyTarget > 0 ? `${yearlyAchievement.toFixed(1)}% tercapai` : 'Belum diset'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Bulanan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(yearlyTotal / 12)}</div>
                        <p className="text-xs text-muted-foreground">margin per bulan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Pencapaian per Bulan ({validYear})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="month" className="text-xs" />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                                    className="text-xs"
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    labelFormatter={(label) => `Bulan ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="margin" name="Margin" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" name="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Line Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Perbandingan {validYear} vs {validCompareYear}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="month" className="text-xs" />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                                    className="text-xs"
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={`Margin ${validYear}`}
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ fill: '#22c55e' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={`Margin ${validCompareYear}`}
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: '#94a3b8' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
