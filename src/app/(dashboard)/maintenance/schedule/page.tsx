"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { useCreateMaintenance } from "@/hooks/use-maintenance"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export default function ScheduleMaintenancePage() {
  const router = useRouter();
  const createMaintenance = useCreateMaintenance();
  const { toast } = useToast();
  
  const [tableId, setTableId] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  
  // Fetch tables for the dropdown
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await fetch('/api/tables');
      const data = await response.json();
      return data.data || [];
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableId || !maintenanceDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a table and maintenance date"
      });
      return;
    }
    
    try {
      await createMaintenance.mutateAsync({
        tableId,
        maintenanceAt: maintenanceDate,
        description,
        cost: cost ? parseFloat(cost) : null,
      });
      
      toast({
        title: "Success",
        description: "Maintenance scheduled successfully"
      });
      router.push("/maintenance/records");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to schedule maintenance"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schedule Maintenance</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Maintenance Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table">Select Table</Label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesLoading ? (
                      <SelectItem value="loading" disabled>Loading tables...</SelectItem>
                    ) : tables && tables.length > 0 ? (
                      tables.map((table: any) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No tables available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Maintenance Date</Label>
                <Input 
                  type="date" 
                  id="date" 
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter maintenance description..."
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost</Label>
              <Input 
                type="number" 
                id="cost" 
                placeholder="Enter estimated cost"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                step="0.01"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/maintenance")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMaintenance.isPending}
              >
                {createMaintenance.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Maintenance"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 