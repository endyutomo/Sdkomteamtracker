import { useState, useRef } from 'react';
import { DailyActivity, ActivityType, ActivityCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useExportImport } from '@/hooks/useExportImport';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

interface ImportActivitiesDialogProps {
    open: boolean;
    onClose: () => void;
    onImport: (activities: Omit<DailyActivity, 'id' | 'createdAt' | 'userId'>[]) => Promise<{ success: number; skipped: number }>;
    existingActivities: DailyActivity[];
}

interface ParsedActivity {
    date: Date;
    category: ActivityCategory;
    personId: string;
    personName: string;
    activityType: ActivityType;
    customerName: string;
    project?: string;
    opportunity?: string;
    notes: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    isDuplicate?: boolean;
}

const activityTypeMap: Record<string, ActivityType> = {
    'kunjungan': 'visit',
    'visit': 'visit',
    'telepon': 'call',
    'call': 'call',
    'email': 'email',
    'meeting': 'meeting',
    'lainnya': 'other',
    'other': 'other',
    'closing': 'closing',
    'sakit': 'sick',
    'sick': 'sick',
    'ijin': 'permission',
    'izin': 'permission',
    'permission': 'permission',
    'cuti': 'time_off',
    'time_off': 'time_off',
    'wfh': 'wfh',
    'standby': 'standby',
    'pengiriman': 'pengiriman',
};

const categoryMap: Record<string, ActivityCategory> = {
    'sales': 'sales',
    'presales': 'presales',
    'kurir': 'logistic',
    'logistic': 'logistic',
    'backoffice': 'backoffice',
};

export function ImportActivitiesDialog({ open, onClose, onImport, existingActivities }: ImportActivitiesDialogProps) {
    const [parsedData, setParsedData] = useState<ParsedActivity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { parseFile } = useExportImport();

    const resetState = () => {
        setParsedData([]);
        setIsLoading(false);
        setIsImporting(false);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const parseDate = (value: any): Date | null => {
        if (!value) return null;

        // If it's already a Date
        if (value instanceof Date) return value;

        // If it's a string
        if (typeof value === 'string') {
            // Try parsing common formats
            const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd MMM yyyy', 'dd MMM yy'];
            for (const fmt of formats) {
                try {
                    const parsed = parse(value, fmt, new Date(), { locale: id });
                    if (!isNaN(parsed.getTime())) return parsed;
                } catch { }
            }
            // Try native parsing
            const date = new Date(value);
            if (!isNaN(date.getTime())) return date;
        }

        // Excel serial date
        if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) return date;
        }

        return null;
    };

    const checkDuplicate = (activity: ParsedActivity): boolean => {
        return existingActivities.some(existing =>
            format(new Date(existing.date), 'yyyy-MM-dd') === format(activity.date, 'yyyy-MM-dd') &&
            existing.personName?.toLowerCase() === activity.personName?.toLowerCase() &&
            existing.customerName?.toLowerCase() === activity.customerName?.toLowerCase() &&
            existing.activityType === activity.activityType
        );
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setImportResult(null);

        try {
            const rawData = await parseFile(file);

            const parsed: ParsedActivity[] = rawData.map(row => {
                // Try to get date from various possible column names
                const dateValue = row['Tanggal'] || row['tanggal'] || row['Date'] || row['date'];
                const date = parseDate(dateValue);

                if (!date) {
                    throw new Error(`Tanggal tidak valid: ${dateValue}`);
                }

                // Get category
                const categoryValue = String(row['Kategori'] || row['kategori'] || row['Category'] || row['category'] || 'sales').toLowerCase();
                const category = categoryMap[categoryValue] || 'sales';

                // Get activity type
                const typeValue = String(row['Tipe Aktivitas'] || row['tipe_aktivitas'] || row['Type'] || row['type'] || row['activityType'] || 'other').toLowerCase();
                const activityType = activityTypeMap[typeValue] || 'other';

                const activity: ParsedActivity = {
                    date,
                    category,
                    personId: row['Person ID'] || row['personId'] || '',
                    personName: row['Nama Person'] || row['personName'] || row['Person'] || '',
                    activityType,
                    customerName: row['Nama Customer'] || row['customerName'] || row['Customer'] || '',
                    project: row['Project'] || row['project'] || undefined,
                    opportunity: row['Opportunity'] || row['opportunity'] || undefined,
                    notes: row['Catatan'] || row['notes'] || row['Notes'] || '',
                    locationName: row['Nama Lokasi'] || row['locationName'] || row['Location'] || undefined,
                    latitude: parseFloat(row['Latitude'] || row['latitude']) || undefined,
                    longitude: parseFloat(row['Longitude'] || row['longitude']) || undefined,
                };

                activity.isDuplicate = checkDuplicate(activity);
                return activity;
            });

            setParsedData(parsed);

            const duplicateCount = parsed.filter(p => p.isDuplicate).length;
            if (duplicateCount > 0) {
                toast.info(`${duplicateCount} data duplikat terdeteksi (akan di-skip)`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal membaca file');
            setParsedData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        const newActivities = parsedData.filter(p => !p.isDuplicate);

        if (newActivities.length === 0) {
            toast.info('Tidak ada data baru untuk di-import');
            return;
        }

        setIsImporting(true);

        try {
            const result = await onImport(newActivities.map(a => ({
                date: a.date,
                category: a.category,
                personId: a.personId,
                personName: a.personName,
                activityType: a.activityType,
                customerName: a.customerName,
                project: a.project,
                opportunity: a.opportunity,
                notes: a.notes,
                locationName: a.locationName,
                latitude: a.latitude,
                longitude: a.longitude,
            })));

            setImportResult(result);
            toast.success(`${result.success} aktivitas berhasil di-import`);
        } catch (error: any) {
            toast.error(error.message || 'Gagal import data');
        } finally {
            setIsImporting(false);
        }
    };

    const newDataCount = parsedData.filter(p => !p.isDuplicate).length;
    const duplicateCount = parsedData.filter(p => p.isDuplicate).length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Import Aktivitas
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden space-y-4">
                    {/* File Upload */}
                    <div className="flex items-center gap-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv,.json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isImporting}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Pilih File
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Format: xlsx, csv, atau json
                        </span>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Membaca file...</span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && !importResult && (
                        <>
                            <div className="flex items-center gap-4">
                                <Badge variant="default">{newDataCount} data baru</Badge>
                                {duplicateCount > 0 && (
                                    <Badge variant="secondary">{duplicateCount} duplikat (skip)</Badge>
                                )}
                            </div>

                            <ScrollArea className="h-[400px] rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[40px]">Status</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Person</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Kategori</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((activity, index) => (
                                            <TableRow
                                                key={index}
                                                className={activity.isDuplicate ? 'opacity-50 bg-muted/30' : ''}
                                            >
                                                <TableCell>
                                                    {activity.isDuplicate ? (
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell>{format(activity.date, 'dd MMM yy', { locale: id })}</TableCell>
                                                <TableCell>{activity.personName}</TableCell>
                                                <TableCell>{activity.activityType}</TableCell>
                                                <TableCell>{activity.customerName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {activity.category}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <div className="text-center">
                                <p className="text-lg font-semibold">Import Selesai</p>
                                <p className="text-muted-foreground">
                                    {importResult.success} berhasil, {importResult.skipped} di-skip
                                </p>
                            </div>
                            <Button onClick={handleClose}>Tutup</Button>
                        </div>
                    )}
                </div>

                {parsedData.length > 0 && !importResult && (
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                            Batal
                        </Button>
                        <Button onClick={handleImport} disabled={isImporting || newDataCount === 0} className="gap-2">
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Mengimport...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Import {newDataCount} Data
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
