import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, CheckCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DailyActivity } from '@/types';
import { toast } from 'sonner';

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
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

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

  const viewDateBookings = getBookingDetailsForDate(viewDate);
  const isViewDateBooked = isDateBooked(viewDate);

  const handleSelectAvailableDate = () => {
    if (!isViewDateBooked) {
      onDateSelect(viewDate);
      toast.success(`Tanggal ${format(viewDate, 'PPP', { locale: id })} dipilih untuk aktivitas`);
      setOpen(false);
    }
  };

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
            selected={viewDate}
            onSelect={(date) => {
              if (date) {
                setViewDate(date);
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
                const booked = isDateBooked(date);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {booked && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive" />
                    )}
                  </div>
                );
              },
            }}
          />
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive/50" />
              <span className="text-muted-foreground">Sudah dibooking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/50" />
              <span className="text-muted-foreground">Tersedia</span>
            </div>
          </div>

          {/* Selected date info panel */}
          <div className={cn(
            "p-3 rounded-lg border",
            isViewDateBooked ? "bg-destructive/10 border-destructive/30" : "bg-primary/10 border-primary/30"
          )}>
            <p className="text-sm font-medium mb-2">
              {format(viewDate, 'EEEE, dd MMMM yyyy', { locale: id })}
            </p>
            
            {isViewDateBooked ? (
              <div className="space-y-2">
                <Badge variant="destructive" className="text-xs">
                  Sudah dibooking
                </Badge>
                <div className="space-y-2 mt-2">
                  {viewDateBookings.map((activity) => (
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
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Tersedia untuk booking</span>
                </div>
                <Button 
                  onClick={handleSelectAvailableDate}
                  className="w-full"
                  size="sm"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Gunakan Tanggal Ini
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
