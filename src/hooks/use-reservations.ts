"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { TableReservation } from "@prisma/client";

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
  customer: {
    id: string;
    name: string;
    email: string;
  };
  table: {
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
  reservationCount: number;
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

export function useReservations() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reservation Operations
  const fetchReservations = useCallback(async (searchQuery?: string) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append("query", searchQuery);
      }
      
      const response = await fetch(`/api/reservations?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reservations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createReservation = useCallback(
    async (reservationData: ReservationFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservationData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Reservation created successfully",
          });
          await fetchReservations();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create reservation",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating reservation:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchReservations, toast]
  );

  const updateReservation = useCallback(
    async (
      reservationId: string,
      reservationData: Partial<ReservationFormValues>
    ) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/reservations/${reservationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservationData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Reservation updated successfully",
          });
          await fetchReservations();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update reservation",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating reservation:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchReservations, toast]
  );

  const deleteReservation = useCallback(
    async (reservationId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/reservations/${reservationId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Reservation deleted successfully",
          });
          await fetchReservations();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete reservation",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting reservation:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchReservations, toast]
  );

  // Customer Operations
  const fetchCustomers = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        const response = await fetch(
          `/api/reservations/customers?${queryParams.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch customers",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createCustomer = useCallback(
    async (customerData: CustomerFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/reservations/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(customerData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Customer created successfully",
          });
          await fetchCustomers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create customer",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating customer:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCustomers, toast]
  );

  const updateCustomer = useCallback(
    async (customerId: string, customerData: Partial<CustomerFormValues>) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(
          `/api/reservations/customers/${customerId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(customerData),
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Customer updated successfully",
          });
          await fetchCustomers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update customer",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating customer:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCustomers, toast]
  );

  const deleteCustomer = useCallback(
    async (customerId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(
          `/api/reservations/customers/${customerId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Customer deleted successfully",
          });
          await fetchCustomers();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete customer",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCustomers, toast]
  );

  return {
    reservations,
    customers,
    isLoading,
    isSubmitting,
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
