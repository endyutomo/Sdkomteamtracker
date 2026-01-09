export type PersonRole = 'sales' | 'presales' | 'other';

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  createdAt: Date;
}

export type ActivityType = 'visit' | 'call' | 'email' | 'meeting' | 'other';

export interface CollaborationPerson {
  personId?: string;
  personName: string;
  division: 'sales' | 'presales' | 'manager' | 'other';
  bookedAt?: Date; // Tanggal booking kolaborator
}

export interface Collaboration {
  division: 'presales' | 'other';
  personId?: string;
  personName: string;
  collaborators?: CollaborationPerson[];
}

export type ActivityCategory = 'sales' | 'presales';

export interface DailyActivity {
  id: string;
  userId: string;
  date: Date;
  category: ActivityCategory;
  personId: string;
  personName: string;
  activityType: ActivityType | ActivityType[]; // Support single or multiple activity types
  customerName: string | string[]; // Support single or multiple customers
  project?: string;
  opportunity?: string;
  notes: string;
  collaboration?: Collaboration;
  photos?: string[]; // Base64 encoded photos for visit activity
  latitude?: number;
  longitude?: number;
  locationName?: string;
  reminderAt?: Date | null;
  createdAt: Date;
}
