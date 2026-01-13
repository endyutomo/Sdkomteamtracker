import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesTarget, SalesRecord, PeriodType } from '@/types/sales';
import { toast } from 'sonner';

interface UseSalesOptions {
  onActivityCreated?: () => void;
}

export function useSales(options?: UseSalesOptions) {
  const onActivityCreatedRef = useRef(options?.onActivityCreated);
  onActivityCreatedRef.current = options?.onActivityCreated;

  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [salesProfiles, setSalesProfiles] = useState<Array<{ userId: string; name: string; division: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, division');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    const map = (data || []).reduce((acc: Record<string, string>, p) => {
      acc[p.user_id] = p.name;
      return acc;
    }, {});
    setProfileMap(map);

    // Set current user profile
    if (user) {
      const currentProfile = data?.find(p => p.user_id === user.id);
      setUserProfile(currentProfile);
    }

    // Set sales profiles (only sales division users)
    const salesList = (data || []).filter(p => p.division === 'sales').map(p => ({
      userId: p.user_id,
      name: p.name,
      division: p.division,
    }));
    setSalesProfiles(salesList);
  }, [user]);

  const fetchTargets = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sales_targets')
      .select('*')
      .order('period_year', { ascending: false });

    if (error) {
      console.error('Error fetching targets:', error);
      return;
    }

    setTargets(
      data.map((t) => ({
        id: t.id,
        userId: t.user_id,
        periodType: t.period_type as PeriodType,
        periodYear: t.period_year,
        periodMonth: t.period_month,
        periodQuarter: t.period_quarter,
        targetAmount: Number(t.target_amount),
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
      }))
    );
  }, [user]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;

    // Fetch sales records
    const { data: salesData, error: salesError } = await supabase
      .from('sales_records')
      .select('*')
      .order('closing_date', { ascending: false });

    if (salesError) {
      console.error('Error fetching records:', salesError);
      toast.error(`Gagal mengambil data penjualan: ${salesError.message}`);
      return;
    }

    setRecords(
      (salesData || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        customerName: r.customer_name,
        productName: r.product_name,
        quantity: r.quantity,
        unitPrice: Number(r.unit_price),
        costPrice: Number(r.cost_price || 0),
        otherExpense: Number(r.other_expense || 0),
        totalAmount: Number(r.total_amount),
        marginAmount: r.margin_amount ? Number(r.margin_amount) : undefined,
        marginPercentage: r.margin_percentage ? Number(r.margin_percentage) : undefined,
        closingDate: new Date(r.closing_date),
        notes: r.notes,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }))
    );
  }, [user]);

  const isManager = useMemo(() => userProfile?.division === 'manager', [userProfile]);

  // Enriched targets with achievement and userName
  const enrichedTargets = useMemo(() => {
    return targets.map(target => {
      const achievements = records.filter(record => {
        if (record.userId !== target.userId) return false;

        const date = record.closingDate;
        const recordYear = date.getFullYear();
        const recordMonth = date.getMonth() + 1;
        const recordQuarter = Math.ceil(recordMonth / 3);

        if (recordYear !== target.periodYear) return false;

        if (target.periodType === 'monthly' && recordMonth !== target.periodMonth) return false;
        if (target.periodType === 'quarterly' && recordQuarter !== target.periodQuarter) return false;

        return true;
      });

      const achievedAmount = achievements.reduce((sum, r) => sum + (r.marginAmount || 0), 0);

      return {
        ...target,
        userName: profileMap[target.userId] || 'Unknown',
        achievedAmount
      };
    });
  }, [targets, records, profileMap]);

  // Enriched records with userName
  const enrichedRecords = useMemo(() => {
    return records.map(record => ({
      ...record,
      userName: profileMap[record.userId] || 'Unknown'
    }));
  }, [records, profileMap]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchProfiles(), fetchTargets(), fetchRecords()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchProfiles, fetchTargets, fetchRecords]);

  const addTarget = async (
    periodType: PeriodType,
    periodYear: number,
    targetAmount: number,
    periodMonth?: number,
    periodQuarter?: number,
    targetUserId?: string,
    targetId?: string
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sales_targets')
      .upsert(
        {
          id: targetId,
          user_id: targetUserId || user.id,
          period_type: periodType,
          period_year: periodYear,
          period_month: periodMonth || null,
          period_quarter: periodQuarter || null,
          target_amount: targetAmount,
        },
        {
          onConflict: targetId ? 'id' : 'user_id,period_type,period_year,period_month,period_quarter',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error adding/updating target:', error);
      toast.error('Gagal menyimpan target');
      return;
    }

    toast.success('Target berhasil disimpan');
    await fetchTargets();
    return data;
  };

  const deleteTarget = async (id: string) => {
    const { error } = await supabase
      .from('sales_targets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting target:', error);
      toast.error('Gagal menghapus target');
      return;
    }

    toast.success('Target berhasil dihapus');
    await fetchTargets();
  };

  const addRecord = async (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    otherExpense: number;
    closingDate: Date;
    notes?: string;
  }) => {
    if (!user) return;

    const totalAmount = record.quantity * record.unitPrice;

    const { data, error } = await supabase
      .from('sales_records')
      .insert({
        user_id: user.id,
        customer_name: record.customerName,
        product_name: record.productName,
        quantity: record.quantity,
        unit_price: record.unitPrice,
        cost_price: record.costPrice,
        other_expense: record.otherExpense,
        total_amount: totalAmount,
        closing_date: record.closingDate.toISOString().split('T')[0],
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding record:', error);
      toast.error(`Gagal menyimpan penjualan: ${error.message}`);
      return;
    }

    // Auto-create activity with type 'closing'
    const userName = profileMap[user.id] || 'Unknown';
    const activityNotes = `Closing: ${record.productName} - Qty: ${record.quantity}`;

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        date: record.closingDate.toISOString().split('T')[0],
        category: 'sales',
        person_id: user.id,
        person_name: userName,
        activity_type: 'closing' as any,
        customer_name: record.customerName,
        notes: activityNotes,
        // Store sales_record_id in notes for linking
      });

    if (activityError) {
      console.error('Error creating closing activity:', activityError);
      // Don't fail the whole operation, just log it
    } else {
      // Notify that activity was created so other hooks can refresh
      onActivityCreatedRef.current?.();
    }

    toast.success('Penjualan berhasil dicatat');
    await fetchRecords();
    return data;
  };



  const updateRecord = async (
    id: string,
    record: {
      customerName: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      otherExpense: number;
      closingDate: Date;
      notes?: string;
    },
    originalCustomerName?: string,
    originalClosingDate?: Date
  ) => {
    if (!user) return;

    const totalAmount = record.quantity * record.unitPrice;

    const { error } = await supabase
      .from('sales_records')
      .update({
        customer_name: record.customerName,
        product_name: record.productName,
        quantity: record.quantity,
        unit_price: record.unitPrice,
        cost_price: record.costPrice,
        other_expense: record.otherExpense,
        total_amount: totalAmount,
        closing_date: record.closingDate.toISOString().split('T')[0],
        notes: record.notes || null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating record:', error);
      toast.error(`Gagal mengupdate penjualan: ${error.message}`);
      return;
    }

    // Update linked activity
    const searchCustomer = originalCustomerName || record.customerName;
    const searchDate = originalClosingDate
      ? originalClosingDate.toISOString().split('T')[0]
      : record.closingDate.toISOString().split('T')[0];

    const userName = profileMap[user.id] || 'Unknown';
    const activityNotes = `Closing: ${record.productName} - Qty: ${record.quantity}`;

    await supabase
      .from('activities')
      .update({
        date: record.closingDate.toISOString().split('T')[0],
        customer_name: record.customerName,
        notes: activityNotes,
      })
      .eq('user_id', user.id)
      .eq('customer_name', searchCustomer)
      .eq('date', searchDate)
      .eq('activity_type', 'closing');

    toast.success('Penjualan berhasil diupdate');
    await fetchRecords();
  };


  const deleteRecord = async (id: string, customerName?: string, closingDate?: Date) => {
    // First get the record to find linked activity
    const recordToDelete = records.find(r => r.id === id);

    const { error } = await supabase.from('sales_records').delete().eq('id', id);

    if (error) {
      console.error('Error deleting record:', error);
      toast.error('Gagal menghapus penjualan');
      return;
    }

    // Delete linked activity
    if (recordToDelete && user) {
      await supabase
        .from('activities')
        .delete()
        .eq('user_id', user.id)
        .eq('customer_name', recordToDelete.customerName)
        .eq('date', recordToDelete.closingDate.toISOString().split('T')[0])
        .eq('activity_type', 'closing');
    }

    toast.success('Penjualan berhasil dihapus');
    await fetchRecords();
  };


  const getTargetForPeriod = (
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ) => {
    const matchingTargets = enrichedTargets.filter(
      (t) =>
        t.periodType === periodType &&
        t.periodYear === year &&
        (periodType === 'monthly' ? t.periodMonth === month : true) &&
        (periodType === 'quarterly' ? t.periodQuarter === quarter : true)
    );

    if (matchingTargets.length === 0) return undefined;

    if (isManager) {
      // Aggregate for manager
      const totalAmount = matchingTargets.reduce((sum, t) => sum + t.targetAmount, 0);
      return {
        ...matchingTargets[0],
        targetAmount: totalAmount,
        isAggregate: true
      };
    }

    // Return current user's target or the first one if not manager
    return matchingTargets.find(t => t.userId === user?.id) || matchingTargets[0];
  };

  const getSalesForPeriod = (
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ) => {
    return enrichedRecords.filter((r) => {
      const date = r.closingDate;
      const recordYear = date.getFullYear();
      const recordMonth = date.getMonth() + 1;
      const recordQuarter = Math.ceil(recordMonth / 3);

      if (recordYear !== year) return false;

      if (periodType === 'monthly' && month) {
        return recordMonth === month;
      }
      if (periodType === 'quarterly' && quarter) {
        return recordQuarter === quarter;
      }
      return periodType === 'yearly';
    });
  };

  // Get sales team report for manager
  const getSalesTeamReport = useCallback((
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ) => {
    return salesProfiles.map(sales => {
      // Find target for this sales and period
      const target = enrichedTargets.find(t =>
        t.userId === sales.userId &&
        t.periodType === periodType &&
        t.periodYear === year &&
        (periodType === 'monthly' ? t.periodMonth === month : true) &&
        (periodType === 'quarterly' ? t.periodQuarter === quarter : true)
      );

      // Filter records for this sales and period
      const salesRecords = enrichedRecords.filter(r => {
        if (r.userId !== sales.userId) return false;
        const date = r.closingDate;
        const recordYear = date.getFullYear();
        const recordMonth = date.getMonth() + 1;
        const recordQuarter = Math.ceil(recordMonth / 3);

        if (recordYear !== year) return false;
        if (periodType === 'monthly' && recordMonth !== month) return false;
        if (periodType === 'quarterly' && recordQuarter !== quarter) return false;
        return true;
      });

      const achievedAmount = salesRecords.reduce((sum, r) => sum + (r.marginAmount || 0), 0);
      const targetAmount = target?.targetAmount || 0;
      const achievementPercentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

      return {
        userId: sales.userId,
        userName: sales.name,
        division: sales.division,
        targetAmount,
        achievedAmount,
        achievementPercentage,
        records: salesRecords,
      };
    });
  }, [salesProfiles, enrichedTargets, enrichedRecords]);

  // Get list of years that have data
  const getAvailableYears = useCallback(() => {
    const yearsFromRecords = enrichedRecords.map(r => r.closingDate.getFullYear());
    const yearsFromTargets = enrichedTargets.map(t => t.periodYear);
    const allYears = [...new Set([...yearsFromRecords, ...yearsFromTargets])];
    return allYears.sort((a, b) => b - a); // Sort descending
  }, [enrichedRecords, enrichedTargets]);

  // Get monthly trend data for a specific year
  const getMonthlyTrend = useCallback((year: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    return months.map((monthName, index) => {
      const month = index + 1;

      // Get records for this month
      const monthRecords = enrichedRecords.filter(r => {
        const recordYear = r.closingDate.getFullYear();
        const recordMonth = r.closingDate.getMonth() + 1;
        return recordYear === year && recordMonth === month;
      });

      // Calculate totals
      const totalSales = monthRecords.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalMargin = monthRecords.reduce((sum, r) => sum + (r.marginAmount || 0), 0);
      const transactionCount = monthRecords.length;

      // Get target for this month
      const target = enrichedTargets.find(t =>
        t.periodType === 'monthly' &&
        t.periodYear === year &&
        t.periodMonth === month
      );

      return {
        month: monthName,
        monthNumber: month,
        sales: totalSales,
        margin: totalMargin,
        target: target?.targetAmount || 0,
        transactions: transactionCount,
        achievement: target?.targetAmount ? (totalMargin / target.targetAmount) * 100 : 0,
      };
    });
  }, [enrichedRecords, enrichedTargets]);

  return {
    targets: enrichedTargets,
    records: enrichedRecords,
    salesProfiles,
    isManager,
    loading,
    addTarget,
    deleteTarget,
    addRecord,
    updateRecord,
    deleteRecord,
    getTargetForPeriod,
    getSalesForPeriod,
    getSalesTeamReport,
    getAvailableYears,
    getMonthlyTrend,
    refetch: () => Promise.all([fetchProfiles(), fetchTargets(), fetchRecords()]),
  };
}
