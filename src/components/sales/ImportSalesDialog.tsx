import { useState, useRef } from 'react';
import { SalesRecord } from '@/types/sales';
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
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useExportImport } from '@/hooks/useExportImport';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

interface ImportSalesDialogProps {
    open: boolean;
    onClose: () => void;
    onImport: (records: Array<{
        customerName: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        costPrice: number;
        otherExpense: number;
        closingDate: Date;
        notes?: string;
    }>) => Promise<{ success: number; skipped: number }>;
    existingRecords: SalesRecord[];
}

interface ParsedRecord {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    otherExpense: number;
    closingDate: Date;
    notes?: string;
    isDuplicate?: boolean;
}

export function ImportSalesDialog({ open, onClose, onImport, existingRecords }: ImportSalesDialogProps) {
    const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
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
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
            const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd MMM yyyy'];
            for (const fmt of formats) {
                try {
                    const parsed = parse(value, fmt, new Date(), { locale: id });
                    if (!isNaN(parsed.getTime())) return parsed;
                } catch { }
            }
            const date = new Date(value);
            if (!isNaN(date.getTime())) return date;
        }
        if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    };

    const checkDuplicate = (record: ParsedRecord): boolean => {
        return existingRecords.some(existing =>
            format(new Date(existing.closingDate), 'yyyy-MM-dd') === format(record.closingDate, 'yyyy-MM-dd') &&
            existing.customerName?.toLowerCase() === record.customerName?.toLowerCase() &&
            existing.productName?.toLowerCase() === record.productName?.toLowerCase()
        );
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setImportResult(null);

        try {
            const rawData = await parseFile(file);

            const parsed: ParsedRecord[] = rawData.map(row => {
                const dateValue = row['Tanggal Closing'] || row['closingDate'] || row['Tanggal'] || row['date'];
                const date = parseDate(dateValue);

                if (!date) {
                    throw new Error(`Tanggal tidak valid: ${dateValue}`);
                }

                const record: ParsedRecord = {
                    customerName: row['Nama Customer'] || row['customerName'] || row['Customer'] || '',
                    productName: row['Nama Produk'] || row['productName'] || row['Product'] || '',
                    quantity: Number(row['Qty'] || row['quantity'] || row['Quantity'] || 0),
                    unitPrice: Number(row['Harga Jual'] || row['unitPrice'] || row['Price'] || 0),
                    costPrice: Number(row['Harga Modal'] || row['costPrice'] || row['Cost'] || 0),
                    otherExpense: Number(row['Biaya Lain'] || row['otherExpense'] || 0),
                    closingDate: date,
                    notes: row['Catatan'] || row['notes'] || undefined,
                };

                record.isDuplicate = checkDuplicate(record);
                return record;
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
        const newRecords = parsedData.filter(p => !p.isDuplicate);

        if (newRecords.length === 0) {
            toast.info('Tidak ada data baru untuk di-import');
            return;
        }

        setIsImporting(true);

        try {
            const result = await onImport(newRecords);
            setImportResult(result);
            toast.success(`${result.success} penjualan berhasil di-import`);
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
                        Import Data Penjualan
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden space-y-4">
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
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Harga</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((record, index) => (
                                            <TableRow
                                                key={index}
                                                className={record.isDuplicate ? 'opacity-50 bg-muted/30' : ''}
                                            >
                                                <TableCell>
                                                    {record.isDuplicate ? (
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    )}
                                                </TableCell>
                                                <TableCell>{format(record.closingDate, 'dd MMM yy', { locale: id })}</TableCell>
                                                <TableCell>{record.customerName}</TableCell>
                                                <TableCell>{record.productName}</TableCell>
                                                <TableCell>{record.quantity}</TableCell>
                                                <TableCell>Rp {record.unitPrice.toLocaleString('id-ID')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </>
                    )}

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
