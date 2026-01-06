import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';

interface TeamDetailDialogProps {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
}

export function TeamDetailDialog({ open, onClose, profiles }: TeamDetailDialogProps) {
  const salesProfiles = profiles.filter(p => p.division === 'sales');
  const presalesProfiles = profiles.filter(p => p.division === 'presales');
  const managerProfiles = profiles.filter(p => p.division === 'manager');

  const getDivisionLabel = (division: string) => {
    switch (division) {
      case 'sales': return 'Sales';
      case 'presales': return 'Presales';
      case 'manager': return 'Manager';
      default: return division;
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'sales': return 'bg-primary/10 text-primary border-primary/20';
      case 'presales': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'manager': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const ProfileCard = ({ profile }: { profile: Profile }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{profile.name}</p>
        <p className="text-sm text-muted-foreground truncate">{profile.jabatan || 'Tidak ada jabatan'}</p>
      </div>
      <Badge variant="outline" className={getDivisionColor(profile.division)}>
        {getDivisionLabel(profile.division)}
      </Badge>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Tim ({profiles.length} anggota)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manager Section */}
          {managerProfiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Manager ({managerProfiles.length})
              </h3>
              <div className="space-y-2">
                {managerProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {/* Sales Section */}
          {salesProfiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Sales ({salesProfiles.length})
              </h3>
              <div className="space-y-2">
                {salesProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {/* Presales Section */}
          {presalesProfiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Presales ({presalesProfiles.length})
              </h3>
              <div className="space-y-2">
                {presalesProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {profiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada anggota tim terdaftar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
