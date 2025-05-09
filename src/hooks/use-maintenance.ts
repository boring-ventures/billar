import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// Generic fetch function with improved error handling
async function apiFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    
    return response.json();
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    // Return empty data structure instead of throwing
    return { data: [] };
  }
}

// GET hook for all maintenance records with defensive programming
export function useMaintenanceRecords() {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: () => apiFetch('/api/maintenance').then(res => res.data || []),
  });
}

// GET hook for a specific maintenance record with defensive programming
export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => id ? apiFetch(`/api/maintenance/${id}`).then(res => res.data || null) : null,
    enabled: !!id, // Only fetch if ID is provided
  });
}

// POST hook for creating a new maintenance record
export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate maintenance queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

// PUT hook for updating a maintenance record
export function useUpdateMaintenance(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiFetch(`/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

// DELETE hook for removing a maintenance record
export function useDeleteMaintenance(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiFetch(`/api/maintenance/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      // Invalidate maintenance queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

// Hook for maintenance statistics with defensive programming
export function useMaintenanceStats() {
  const { data: maintenanceRecords, isLoading } = useMaintenanceRecords();
  
  // Ensure we always have a valid array to work with
  const safeRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
  
  if (isLoading || safeRecords.length === 0) {
    return {
      upcomingCount: 0,
      totalRecords: 0,
      totalCost: 0,
      tablesInMaintenance: 0,
      isLoading,
    };
  }
  
  const now = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(now.getDate() + 7);
  
  // Calculate statistics with defensive null checks
  const upcoming = safeRecords.filter((record: any) => {
    if (!record.maintenanceAt) return false;
    const maintenanceDate = new Date(record.maintenanceAt);
    return maintenanceDate > now && maintenanceDate <= oneWeekFromNow;
  });
  
  const currentlyInMaintenance = safeRecords.filter((record: any) => {
    if (!record.maintenanceAt) return false;
    const maintenanceDate = new Date(record.maintenanceAt);
    return maintenanceDate.toDateString() === now.toDateString();
  });
  
  // Get unique table IDs currently in maintenance with null checks
  const uniqueTablesInMaintenance = new Set(
    currentlyInMaintenance
      .filter((record: any) => record.tableId)
      .map((record: any) => record.tableId)
  );
  
  // Calculate total cost with defensive handling of null/undefined values
  const totalCost = safeRecords.reduce(
    (sum: number, record: any) => sum + (record.cost ? parseFloat(record.cost) : 0),
    0
  );
  
  return {
    upcomingCount: upcoming.length,
    totalRecords: safeRecords.length,
    totalCost,
    tablesInMaintenance: uniqueTablesInMaintenance.size,
    isLoading: false,
  };
}

// Hook for maintenance costs with period filtering and defensive programming
export function useMaintenanceCosts(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const { data: maintenanceRecords, isLoading } = useMaintenanceRecords();
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [averageCost, setAverageCost] = useState(0);
  
  useEffect(() => {
    // Ensure we always have a valid array to work with
    const safeRecords = Array.isArray(maintenanceRecords) ? maintenanceRecords : [];
    
    if (safeRecords.length === 0) {
      setFilteredRecords([]);
      setTotalCost(0);
      setAverageCost(0);
      return;
    }
    
    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on selected period
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    // Filter records by date with null checks
    const filtered = safeRecords.filter((record: any) => {
      if (!record.maintenanceAt) return false;
      const maintenanceDate = new Date(record.maintenanceAt);
      return maintenanceDate >= startDate && maintenanceDate <= now;
    });
    
    setFilteredRecords(filtered);
    
    // Calculate costs with defensive handling
    const total = filtered.reduce(
      (sum: number, record: any) => sum + (record.cost ? parseFloat(record.cost) : 0),
      0
    );
    
    setTotalCost(total);
    setAverageCost(filtered.length > 0 ? total / filtered.length : 0);
  }, [maintenanceRecords, period]);
  
  return {
    records: filteredRecords || [],
    totalCost,
    averageCost,
    count: (filteredRecords || []).length,
    isLoading,
  };
} 