import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, CheckCircle, XCircle, Search, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

interface LocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData | undefined) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS');
      toast.error('Browser tidak mendukung GPS');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'id',
              },
            }
          );
          
          const data = await response.json();
          const locationName = data.display_name || `${latitude}, ${longitude}`;
          
          onChange({
            latitude,
            longitude,
            locationName,
          });
          
          toast.success('Lokasi berhasil diambil');
        } catch {
          // If geocoding fails, just use coordinates
          onChange({
            latitude,
            longitude,
            locationName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
          toast.success('Lokasi berhasil diambil (tanpa nama alamat)');
        }
        
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        let errorMessage = 'Gagal mengambil lokasi';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Izinkan akses lokasi di browser Anda.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia';
            break;
          case err.TIMEOUT:
            errorMessage = 'Waktu pengambilan lokasi habis';
            break;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const searchAddress = async () => {
    if (!manualAddress.trim()) {
      toast.error('Masukkan alamat terlebih dahulu');
      return;
    }

    setSearchLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=5&countrycodes=id`,
        {
          headers: {
            'Accept-Language': 'id',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.length === 0) {
        setError('Alamat tidak ditemukan. Coba kata kunci lain.');
        toast.error('Alamat tidak ditemukan');
      } else {
        setSearchResults(data);
      }
    } catch {
      setError('Gagal mencari alamat. Coba lagi.');
      toast.error('Gagal mencari alamat');
    }
    
    setSearchLoading(false);
  };

  const selectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    onChange({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      locationName: result.display_name,
    });
    setSearchResults([]);
    setManualAddress('');
    toast.success('Lokasi berhasil dipilih');
  };

  const clearLocation = () => {
    onChange(undefined);
    setSearchResults([]);
    setManualAddress('');
  };

  const openInMaps = () => {
    if (value) {
      window.open(
        `https://www.google.com/maps?q=${value.latitude},${value.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Label className="font-medium">Lokasi Check-in</Label>
      </div>

      {!value ? (
        <Tabs defaultValue="gps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gps" className="gap-1.5">
              <Navigation className="h-3.5 w-3.5" />
              GPS
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Cari Alamat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gps" className="space-y-2 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengambil lokasi...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Ambil Lokasi Saat Ini
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Pastikan GPS aktif untuk akurasi lokasi
            </p>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-3 mt-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ketik alamat atau nama tempat..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchAddress();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchAddress}
                disabled={searchLoading}
                size="icon"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-border">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground line-clamp-2">
                        {result.display_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Ketik alamat lengkap atau nama tempat, lalu tekan cari
            </p>
          </TabsContent>
          
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-2">
              <XCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </Tabs>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Lokasi Tercatat</p>
              <p className="text-xs text-muted-foreground break-words mt-1">
                {value.locationName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Koordinat: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInMaps}
              className="flex-1 gap-1"
            >
              <MapPin className="h-3 w-3" />
              Lihat di Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearLocation}
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              Hapus
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Pastikan GPS aktif untuk akurasi lokasi
      </p>
    </div>
  );
}