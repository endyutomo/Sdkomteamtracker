export type PersonRole = 'sales' | 'presales' | 'other';

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  createdAt: Date;
}

export type ActivityType = 'visit' | 'call' | 'email' | 'meeting' | 'other';

export interface Collaboration {
  division: 'presales' | 'other';
  personId?: string;
  personName: string;
}

export interface DailyActivity {
  id: string;
  date: Date;
  salesPersonId: string;
  salesPersonName: string;
  activityType: ActivityType;
  customerName: string;
  notes: string;
  collaboration?: Collaboration;
  createdAt: Date;
}
