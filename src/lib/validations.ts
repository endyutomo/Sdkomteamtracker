import { z } from 'zod';

// Person validation
export const personSchema = z.object({
  name: z.string().trim().min(1, 'Nama harus diisi').max(200, 'Nama maksimal 200 karakter'),
  role: z.enum(['sales', 'presales', 'other'], { required_error: 'Role harus dipilih' }),
});

// Activity validation
export const activitySchema = z.object({
  date: z.date(),
  category: z.enum(['sales', 'presales']),
  personId: z.string().min(1, 'Person harus dipilih'),
  personName: z.string().trim().min(1, 'Nama person harus diisi').max(200),
  activityType: z.enum(['visit', 'call', 'email', 'meeting', 'other']),
  customerName: z.string().trim().min(1, 'Nama customer harus diisi').max(200, 'Nama customer maksimal 200 karakter'),
  project: z.string().trim().max(200).optional(),
  opportunity: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter'),
  collaboration: z.object({
    division: z.enum(['presales', 'other']),
    personId: z.string().optional(),
    personName: z.string().trim().max(200),
  }).optional().nullable(),
  photos: z.array(z.string()).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  locationName: z.string().trim().max(500).optional().nullable(),
  reminderAt: z.date().optional().nullable(),
});

// Profile validation
export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama harus diisi').max(200, 'Nama maksimal 200 karakter'),
  division: z.enum(['sales', 'presales', 'manager']),
  jabatan: z.string().trim().max(100, 'Jabatan maksimal 100 karakter').optional().nullable(),
});

// Company settings validation
export const companySettingsSchema = z.object({
  name: z.string().trim().min(1, 'Nama perusahaan harus diisi').max(200, 'Nama maksimal 200 karakter'),
  address: z.string().trim().max(500, 'Alamat maksimal 500 karakter').optional().nullable(),
  phone: z.string().trim().max(20, 'Nomor telepon maksimal 20 karakter').optional().nullable(),
  email: z.string().trim().email('Format email tidak valid').max(255).optional().nullable().or(z.literal('')),
  logo_url: z.string().url('URL logo tidak valid').max(1000).optional().nullable(),
});

// Type exports
export type PersonInput = z.infer<typeof personSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
