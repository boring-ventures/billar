"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELED"
  | "COMPLETED";

export type Reservation = {
  id: string;
  customerId: string;
  tableId: string;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  table?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  reservationCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ReservationFormValues = {
  customerId: string;
  tableId: string;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  notes?: string;
};

export type CustomerFormValues = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
};

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

// GET hook for all reservations with defensive programming
export function useReservations(query?: string) {
        const queryParams = new URLSearchParams();
  if (query) {
    queryParams.append("query", query);
  }
  
  return useQuery({
    queryKey: ['reservations', query],
    queryFn: () => apiFetch(`/api/reservations?${queryParams.toString()}`).then(res => res.data || []),
  });
}

// GET hook for a specific reservation with defensive programming
export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn: () => id ? apiFetch(`/api/reservations/${id}`).then(res => res.data || null) : null,
    enabled: !!id, // Only fetch if ID is provided
  });
}

// POST hook for creating a new reservation
export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ReservationFormValues) => apiFetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate reservations queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// PATCH hook for updating a reservation
export function useUpdateReservation(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ReservationFormValues>) => apiFetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// DELETE hook for removing a reservation
export function useDeleteReservation(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiFetch(`/api/reservations/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      // Invalidate reservations queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// Customer hooks
// GET hook for all customers with defensive programming
export function useCustomers(query?: string) {
        const queryParams = new URLSearchParams();
  if (query) {
    queryParams.append("query", query);
  }
  
  return useQuery({
    queryKey: ['customers', query],
    queryFn: () => apiFetch(`/api/reservations/customers?${queryParams.toString()}`).then(res => res.data || []),
  });
}

// GET hook for a specific customer with defensive programming
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => id ? apiFetch(`/api/reservations/customers/${id}`).then(res => res.data || null) : null,
    enabled: !!id, // Only fetch if ID is provided
  });
}

// POST hook for creating a new customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CustomerFormValues) => apiFetch('/api/reservations/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate customers queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// PATCH hook for updating a customer
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<CustomerFormValues>) => apiFetch(`/api/reservations/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.data || {}),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// DELETE hook for removing a customer
export function useDeleteCustomer(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiFetch(`/api/reservations/customers/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      // Invalidate customers queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Hook for reservation statistics with defensive programming
export function useReservationStats() {
  const { data: reservationsData, isLoading } = useReservations();
  
  // Ensure we always have a valid array to work with
  const safeReservations = Array.isArray(reservationsData) ? reservationsData : [];
  
  if (isLoading || safeReservations.length === 0) {
    return {
      pendingCount: 0,
      confirmedCount: 0,
      canceledCount: 0,
      completedCount: 0,
      totalCount: 0,
      isLoading,
    };
  }
  
  const now = new Date();
  
  // Calculate counts with defensive null checks
  const pendingCount = safeReservations.filter(
    (reservation) => reservation?.status === "PENDING"
  ).length;
  
  const confirmedCount = safeReservations.filter(
    (reservation) => reservation?.status === "CONFIRMED"
  ).length;
  
  const canceledCount = safeReservations.filter(
    (reservation) => reservation?.status === "CANCELED"
  ).length;
  
  const completedCount = safeReservations.filter(
    (reservation) => reservation?.status === "COMPLETED"
  ).length;

  return {
    pendingCount,
    confirmedCount,
    canceledCount,
    completedCount,
    totalCount: safeReservations.length,
    isLoading: false,
  };
}
