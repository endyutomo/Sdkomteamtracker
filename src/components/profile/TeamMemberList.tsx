import { useState, useEffect } from 'react';
import { Profile, DivisionType } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, User, Briefcase, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberListProps {
  profiles: Profile[];
  isManager: boolean;
  onUpdate: (id: string, updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => void;
  onDelete: (id: string) => void;
}

const divisionConfig: Record<DivisionType, { label: string; color: string; icon: any }> = {
  sales: { label: 'Sales', color: 'bg-blue-100 text-blue-800', icon: Users },
  presales: { label: 'Presales', color: 'bg-green-100 text-green-800', icon: Briefcase },
  manager: { label: 'Manager', color: 'bg-purple-100 text-purple-800', icon: User },
};

export function TeamMemberList({ profiles, isManager, onUpdate, onDelete }: TeamMemberListProps) {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editDivision, setEditDivision] = useState<DivisionType>('sales');
  const [superadminIds, setSuperadminIds] = useState<string[]>([]);

  // Fetch superadmin IDs
  useEffect(() => {
    const fetchSuperadmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'superadmin');
      if (data) {
        setSuperadminIds(data.map((r) => r.user_id));
      }
    };
    fetchSuperadmins();
  }, []);

  const isUserSuperadmin = (userId: string) => superadminIds.includes(userId);

  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile);
    setEditName(profile.name);
    setEditJabatan(profile.jabatan || '');
    setEditDivision(profile.division);
  };

  const handleSaveEdit = () => {
    if (!editingProfile || !editName.trim()) return;
    onUpdate(editingProfile.id, {
      name: editName.trim(),
      jabatan: editJabatan.trim(),
      division: editDivision,
    });
    setEditingProfile(null);
  };

  const groupedProfiles = {
    manager: profiles.filter(p => p.division === 'manager'),
    sales: profiles.filter(p => p.division === 'sales'),
    presales: profiles.filter(p => p.division === 'presales'),
  };

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada anggota tim yang terdaftar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedProfiles).map(([division, members]) => {
          if (members.length === 0) return null;
          const config = divisionConfig[division as DivisionType];
          const Icon = config.icon;

          return (
            <Card key={division}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.label} ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                          <User className="h-5 w-5 text-primary" />
                          {isUserSuperadmin(profile.user_id) && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                              <Shield className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{profile.name}</p>
                            {isUserSuperadmin(profile.user_id) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px]">
                                    <Shield className="h-2.5 w-2.5 mr-1" />
                                    Superadmin
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="text-xs">Administrator sistem dengan akses penuh</span>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {profile.jabatan || 'Tidak ada jabatan'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bergabung: {format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: id })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                        {isManager && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Anggota Tim</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus {profile.name}? Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(profile.id)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Anggota Tim</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jabatan">Jabatan</Label>
              <Input
                id="edit-jabatan"
                value={editJabatan}
                onChange={(e) => setEditJabatan(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-division">Divisi</Label>
              <Select value={editDivision} onValueChange={(val) => setEditDivision(val as DivisionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="presales">Presales</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
