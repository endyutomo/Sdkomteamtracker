import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyActivity } from '@/types';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityChartProps {
  activities: DailyActivity[];
}

export function ActivityChart({ activities }: ActivityChartProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const count = activities.filter(a => 
      isWithinInterval(new Date(a.date), { start: dayStart, end: dayEnd })
    ).length;

    return {
      day: format(date, 'EEE', { locale: id }),
      date: format(date, 'd MMM', { locale: id }),
      aktivitas: count,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Aktivitas 7 Hari Terakhir</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="aktivitas" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="Aktivitas"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
