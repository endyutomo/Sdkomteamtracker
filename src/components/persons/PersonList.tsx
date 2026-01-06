import { Person, PersonRole } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { User, Briefcase, Users2, Trash2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PersonListProps {
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (person: Person) => void;
}

const roleIcons = {
  sales: Briefcase,
  presales: Users2,
  other: User,
};

const roleLabels = {
  sales: 'Sales',
  presales: 'Presales',
  other: 'Lainnya',
};

const roleColors = {
  sales: 'bg-primary/10 text-primary border-primary/20',
  presales: 'bg-info/10 text-info border-info/20',
  other: 'bg-muted text-muted-foreground border-muted',
};

export function PersonList({ persons, onDelete, onEdit }: PersonListProps) {
  if (persons.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
        <Users2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Belum Ada Data Person</h3>
        <p className="text-muted-foreground">
          Tambahkan data sales, presales, atau anggota tim lainnya
        </p>
      </div>
    );
  }

  const groupedPersons = {
    sales: persons.filter(p => p.role === 'sales'),
    presales: persons.filter(p => p.role === 'presales'),
    other: persons.filter(p => p.role === 'other'),
  };

  return (
    <div className="space-y-6">
      {(['sales', 'presales', 'other'] as PersonRole[]).map((role) => {
        const rolePersons = groupedPersons[role];
        if (rolePersons.length === 0) return null;
        
        const Icon = roleIcons[role];
        
        return (
          <div key={role} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">{roleLabels[role]}</h3>
              <Badge variant="secondary" className="ml-auto">
                {rolePersons.length}
              </Badge>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rolePersons.map((person, index) => (
                <div
                  key={person.id}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-elevated animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${roleColors[role]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Bergabung {format(new Date(person.createdAt), 'd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(person)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus {person.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Data person ini akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(person.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
