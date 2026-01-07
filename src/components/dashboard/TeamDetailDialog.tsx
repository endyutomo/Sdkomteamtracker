import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, User, Mail, ArrowLeft, Briefcase, Building2 } from 'lucide-react';
import { Profile } from '@/hooks/useProfile';

interface TeamDetailDialogProps {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  isManager?: boolean;
}

export function TeamDetailDialog({ open, onClose, profiles, isManager = false }: TeamDetailDialogProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  
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

  const handleClose = () => {
    setSelectedProfile(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedProfile(null);
  };

  const ProfileCard = ({ profile }: { profile: Profile }) => (
    <button
      type="button"
      onClick={() => isManager && setSelectedProfile(profile)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 text-left transition-all ${
        isManager 
          ? 'hover:bg-muted hover:border-primary/30 cursor-pointer' 
          : 'cursor-default'
      }`}
      disabled={!isManager}
    >
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
    </button>
  );

  const ProfileDetailView = ({ profile }: { profile: Profile }) => (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pb-4 border-b border-border">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
          <User className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{profile.name}</h3>
        <Badge variant="outline" className={`mt-2 ${getDivisionColor(profile.division)}`}>
          {getDivisionLabel(profile.division)}
        </Badge>
      </div>

      {/* Profile Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Jabatan</p>
            <p className="font-medium text-foreground">{profile.jabatan || 'Tidak ada jabatan'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Divisi</p>
            <p className="font-medium text-foreground">{getDivisionLabel(profile.division)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Bergabung sejak</p>
            <p className="font-medium text-foreground">
              {new Date(profile.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedProfile ? `Profil ${selectedProfile.name}` : `Data Tim (${profiles.length} anggota)`}
          </DialogTitle>
          <DialogDescription>
            {selectedProfile 
              ? 'Detail informasi anggota tim' 
              : isManager 
                ? 'Klik nama anggota untuk melihat detail profil' 
                : 'Daftar anggota tim'}
          </DialogDescription>
        </DialogHeader>

        {selectedProfile ? (
          <ProfileDetailView profile={selectedProfile} />
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}