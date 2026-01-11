import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesTarget, SalesRecord, PeriodType } from '@/types/sales';
import { toast } from 'sonner';

export function useSales() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

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

    const { data, error } = await supabase
      .from('sales_records')
      .select('*')
      .order('closing_date', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      return;
    }

    setRecords(
      data.map((r) => ({
        id: r.id,
        userId: r.user_id,
        customerName: r.customer_name,
        productName: r.product_name,
        quantity: r.quantity,
        unitPrice: Number(r.unit_price),
        totalAmount: Number(r.total_amount),
        closingDate: new Date(r.closing_date),
        notes: r.notes,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }))
    );
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchTargets(), fetchRecords()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchTargets, fetchRecords]);

  const addTarget = async (
    periodType: PeriodType,
    periodYear: number,
    targetAmount: number,
    periodMonth?: number,
    periodQuarter?: number
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sales_targets')
      .upsert(
        {
          user_id: user.id,
          period_type: periodType,
          period_year: periodYear,
          period_month: periodMonth || null,
          period_quarter: periodQuarter || null,
          target_amount: targetAmount,
        },
        {
          onConflict: 'user_id,period_type,period_year,period_month,period_quarter',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error adding target:', error);
      toast.error('Gagal menyimpan target');
      return;
    }

    toast.success('Target berhasil disimpan');
    await fetchTargets();
    return data;
  };

  const addRecord = async (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
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
      closingDate: Date;
      notes?: string;
    }
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

    toast.success('Penjualan berhasil diupdate');
    await fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('sales_records').delete().eq('id', id);

    if (error) {
      console.error('Error deleting record:', error);
      toast.error('Gagal menghapus penjualan');
      return;
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
    return targets.find(
      (t) =>
        t.periodType === periodType &&
        t.periodYear === year &&
        (periodType === 'monthly' ? t.periodMonth === month : true) &&
        (periodType === 'quarterly' ? t.periodQuarter === quarter : true)
    );
  };

  const getSalesForPeriod = (
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ) => {
    return records.filter((r) => {
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

  return {
    targets,
    records,
    loading,
    addTarget,
    addRecord,
    updateRecord,
    deleteRecord,
    getTargetForPeriod,
    getSalesForPeriod,
    refetch: () => Promise.all([fetchTargets(), fetchRecords()]),
  };
}
