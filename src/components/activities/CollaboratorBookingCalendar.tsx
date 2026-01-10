import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DailyActivity } from '@/types';

interface CollaboratorBookingCalendarProps {
  collaboratorId: string;
  collaboratorName: string;
  allActivities: DailyActivity[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function CollaboratorBookingCalendar({
  collaboratorId,
  collaboratorName,
  allActivities,
  selectedDate,
  onDateSelect,
}: CollaboratorBookingCalendarProps) {
  const [open, setOpen] = useState(false);

  // Get all booked dates for this collaborator
  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    
    allActivities.forEach(activity => {
      // Check if this collaborator is booked in this activity
      const isBooked = activity.collaboration?.collaborators?.some(
        collab => collab.personId === collaboratorId
      ) || activity.collaboration?.personId === collaboratorId;
      
      if (isBooked) {
        dates.push(new Date(activity.date));
      }
    });
    
    return dates;
  }, [allActivities, collaboratorId]);

  // Get booking details for a specific date
  const getBookingDetailsForDate = (date: Date) => {
    return allActivities.filter(activity => {
      const isBooked = activity.collaboration?.collaborators?.some(
        collab => collab.personId === collaboratorId
      ) || activity.collaboration?.personId === collaboratorId;
      
      return isBooked && isSameDay(new Date(activity.date), date);
    });
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(d => isSameDay(d, date));
  };

  const selectedDateBookings = getBookingDetailsForDate(selectedDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="text-xs">Lihat Jadwal</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Jadwal {collaboratorName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateSelect(date);
              }
            }}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              booked: bookedDates,
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: 'hsl(var(--destructive) / 0.2)',
                color: 'hsl(var(--destructive))',
                fontWeight: 'bold',
              },
            }}
            components={{
              DayContent: ({ date }) => {
                const isBooked = isDateBooked(date);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {isBooked && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive" />
                    )}
                  </div>
                );
              },
            }}
          />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive/50" />
              <span className="text-muted-foreground">Sudah dibooking</span>
            </div>
          </div>

          {selectedDateBookings.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Booking pada {format(selectedDate, 'PPP', { locale: id })}:
              </p>
              <div className="space-y-2">
                {selectedDateBookings.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="text-sm p-2 bg-background rounded border"
                  >
                    <p className="font-medium">{activity.customerName}</p>
                    {activity.project && (
                      <p className="text-xs text-muted-foreground">
                        Project: {activity.project}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {activity.activityType === 'visit' ? 'Kunjungan' :
                       activity.activityType === 'call' ? 'Telepon' :
                       activity.activityType === 'email' ? 'Email' :
                       activity.activityType === 'meeting' ? 'Meeting' : 'Lainnya'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDateBookings.length === 0 && (
            <div className="text-center p-4 text-muted-foreground text-sm">
              <p>Tidak ada booking pada {format(selectedDate, 'PPP', { locale: id })}</p>
              <p className="text-xs mt-1">Kolaborator tersedia pada tanggal ini</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
