import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

export interface ImportResult {
    success: number;
    skipped: number;
    errors: string[];
}

export function useExportImport() {

    // ==================== EXPORT FUNCTIONS ====================

    const exportToXLSX = useCallback((data: Record<string, any>[], filename: string, sheetName: string = 'Data') => {
        if (data.length === 0) {
            toast.error('Tidak ada data untuk di-export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row =>
                String(row[key] || '').length
            )))
        }));
        worksheet['!cols'] = colWidths;

        const finalFilename = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        XLSX.writeFile(workbook, finalFilename);
        toast.success(`File ${finalFilename} berhasil di-export`);
    }, []);

    const exportToCSV = useCallback((data: Record<string, any>[], filename: string) => {
        if (data.length === 0) {
            toast.error('Tidak ada data untuk di-export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const finalFilename = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`File ${finalFilename} berhasil di-export`);
    }, []);

    const exportToJSON = useCallback((data: Record<string, any>[], filename: string) => {
        if (data.length === 0) {
            toast.error('Tidak ada data untuk di-export');
            return;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const finalFilename = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`File ${finalFilename} berhasil di-export`);
    }, []);

    // ==================== IMPORT/PARSE FUNCTIONS ====================

    const parseXLSX = useCallback(async (file: File): Promise<Record<string, any>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData as Record<string, any>[]);
                } catch (error) {
                    reject(new Error('Gagal membaca file Excel'));
                }
            };

            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsArrayBuffer(file);
        });
    }, []);

    const parseCSV = useCallback(async (file: File): Promise<Record<string, any>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result as string;
                    const workbook = XLSX.read(data, { type: 'string' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData as Record<string, any>[]);
                } catch (error) {
                    reject(new Error('Gagal membaca file CSV'));
                }
            };

            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    }, []);

    const parseJSON = useCallback(async (file: File): Promise<Record<string, any>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result as string;
                    const jsonData = JSON.parse(data);

                    if (Array.isArray(jsonData)) {
                        resolve(jsonData);
                    } else {
                        reject(new Error('File JSON harus berisi array'));
                    }
                } catch (error) {
                    reject(new Error('Gagal membaca file JSON'));
                }
            };

            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    }, []);

    const parseFile = useCallback(async (file: File): Promise<Record<string, any>[]> => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'xlsx':
            case 'xls':
                return parseXLSX(file);
            case 'csv':
                return parseCSV(file);
            case 'json':
                return parseJSON(file);
            default:
                throw new Error('Format file tidak didukung. Gunakan xlsx, csv, atau json.');
        }
    }, [parseXLSX, parseCSV, parseJSON]);

    // ==================== VALIDATION HELPER ====================

    const validateRequiredFields = useCallback((
        data: Record<string, any>[],
        requiredFields: string[]
    ): { valid: Record<string, any>[]; invalid: string[] } => {
        const valid: Record<string, any>[] = [];
        const invalid: string[] = [];

        data.forEach((row, index) => {
            const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0);

            if (missingFields.length > 0) {
                invalid.push(`Baris ${index + 1}: Field ${missingFields.join(', ')} kosong`);
            } else {
                valid.push(row);
            }
        });

        return { valid, invalid };
    }, []);

    return {
        // Export functions
        exportToXLSX,
        exportToCSV,
        exportToJSON,
        // Import/parse functions
        parseFile,
        parseXLSX,
        parseCSV,
        parseJSON,
        // Validation
        validateRequiredFields,
    };
}
