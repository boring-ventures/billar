import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// Generic fetch function
async function apiFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  
  return response.json();
}

// GET hook for all maintenance records
export function useMaintenanceRecords() {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: () => apiFetch('/api/maintenance').then(res => res.data || []),
  });
}

// GET hook for a specific maintenance record
export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => id ? apiFetch(`/api/maintenance/${id}`).then(res => res.data) : null,
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
    }).then(res => res.data),
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
    }).then(res => res.data),
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

// Hook for maintenance statistics
export function useMaintenanceStats() {
  const { data: maintenanceRecords, isLoading } = useMaintenanceRecords();
  
  if (isLoading || !maintenanceRecords) {
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
  
  // Calculate statistics
  const upcoming = maintenanceRecords.filter((record: any) => {
    const maintenanceDate = new Date(record.maintenanceAt);
    return maintenanceDate > now && maintenanceDate <= oneWeekFromNow;
  });
  
  const currentlyInMaintenance = maintenanceRecords.filter((record: any) => {
    const maintenanceDate = new Date(record.maintenanceAt);
    return maintenanceDate.toDateString() === now.toDateString();
  });
  
  // Get unique table IDs currently in maintenance
  const uniqueTablesInMaintenance = new Set(
    currentlyInMaintenance.map((record: any) => record.tableId)
  );
  
  // Calculate total cost
  const totalCost = maintenanceRecords.reduce(
    (sum: number, record: any) => sum + (record.cost ? parseFloat(record.cost) : 0),
    0
  );
  
  return {
    upcomingCount: upcoming.length,
    totalRecords: maintenanceRecords.length,
    totalCost,
    tablesInMaintenance: uniqueTablesInMaintenance.size,
    isLoading: false,
  };
}

// Hook for maintenance costs with period filtering
export function useMaintenanceCosts(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const { data: maintenanceRecords, isLoading } = useMaintenanceRecords();
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [averageCost, setAverageCost] = useState(0);
  
  useEffect(() => {
    if (!maintenanceRecords) {
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
    
    // Filter records by date
    const filtered = maintenanceRecords.filter((record: any) => {
      const maintenanceDate = new Date(record.maintenanceAt);
      return maintenanceDate >= startDate && maintenanceDate <= now;
    });
    
    setFilteredRecords(filtered);
    
    // Calculate costs
    const total = filtered.reduce(
      (sum: number, record: any) => sum + (record.cost ? parseFloat(record.cost) : 0),
      0
    );
    
    setTotalCost(total);
    setAverageCost(filtered.length > 0 ? total / filtered.length : 0);
  }, [maintenanceRecords, period]);
  
  return {
    records: filteredRecords,
    totalCost,
    averageCost,
    count: filteredRecords.length,
    isLoading,
  };
} 