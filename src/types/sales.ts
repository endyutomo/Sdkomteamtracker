export type PeriodType = 'monthly' | 'quarterly' | 'yearly';

export interface SalesTarget {
  id: string;
  userId: string;
  periodType: PeriodType;
  periodYear: number;
  periodMonth?: number | null;
  periodQuarter?: number | null;
  targetAmount: number;
  userName?: string;
  achievedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesRecord {
  id: string;
  userId: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalAmount: number;
  marginAmount?: number;
  marginPercentage?: number;
  userName?: string;
  closingDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesSummary {
  totalSales: number;
  monthlyTarget: number;
  quarterlyTarget: number;
  yearlyTarget: number;
  monthlyAchievement: number;
  quarterlyAchievement: number;
  yearlyAchievement: number;
}
