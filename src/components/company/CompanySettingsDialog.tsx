import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Upload, X, Loader2 } from 'lucide-react';
import { CompanySettings, useCompanySettings } from '@/hooks/useCompanySettings';

interface CompanySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: CompanySettings | null;
  onUpdate: (updates: Partial<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
}

export function CompanySettingsDialog({ open, onClose, settings, onUpdate, uploadLogo }: CompanySettingsDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setLogoUrl(settings.logo_url);
    }
  }, [settings, open]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran logo maksimal 2MB');
      return;
    }

    setUploading(true);
    const url = await uploadLogo(file);
    if (url) {
      setLogoUrl(url);
      // Auto-save logo immediately after upload
      await onUpdate({ logo_url: url });
    }
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      logo_url: logoUrl,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pengaturan Perusahaan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo Perusahaan</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg object-contain border border-border bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Mengupload...' : 'Upload Logo'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Maksimal 2MB. Format: JPG, PNG</p>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label>Nama Perusahaan</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama perusahaan"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat perusahaan"
              rows={2}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor telepon"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email perusahaan"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
