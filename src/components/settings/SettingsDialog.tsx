import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeMode, ThemeColor } from '@/hooks/useTheme';
import { Profile, DivisionType } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { User, Lock, Palette, Eye, EyeOff } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdateProfile: (id: string, updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

export function SettingsDialog({ open, onClose, profile, onUpdateProfile }: SettingsDialogProps) {
  const { updatePassword, user } = useAuth();
  const { mode, color, setMode, setColor } = useTheme();

  // Profile state
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setJabatan(profile.jabatan || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    await onUpdateProfile(profile.id, {
      name: name.trim(),
      jabatan: jabatan.trim() || null,
    });
    toast.success('Profile berhasil diperbarui');
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error('Password baru tidak boleh kosong');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password berhasil diubah');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const themeColors: { value: ThemeColor; label: string; preview: string }[] = [
    { value: 'green', label: 'Hijau Tua', preview: 'bg-[hsl(160,35%,15%)]' },
    { value: 'teal', label: 'Toska', preview: 'bg-[hsl(174,72%,35%)]' },
    { value: 'blue', label: 'Biru', preview: 'bg-[hsl(220,70%,35%)]' },
    { value: 'purple', label: 'Ungu', preview: 'bg-[hsl(280,70%,35%)]' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengaturan</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Tema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Jabatan"
              />
            </div>
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Input value={profile?.division || ''} disabled className="bg-muted capitalize" />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Simpan Profile
            </Button>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={passwordLoading} className="w-full">
              {passwordLoading ? 'Menyimpan...' : 'Ubah Password'}
            </Button>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Mode Tampilan</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as ThemeMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Terang</SelectItem>
                  <SelectItem value="dark">Gelap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warna Tema</Label>
              <div className="grid grid-cols-2 gap-2">
                {themeColors.map((themeColor) => (
                  <button
                    key={themeColor.value}
                    onClick={() => setColor(themeColor.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      color === themeColor.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${themeColor.preview}`} />
                    <span className="text-sm font-medium">{themeColor.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
