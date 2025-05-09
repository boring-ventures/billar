"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useMaintenanceRecords } from "@/hooks/use-maintenance"
import { useState } from "react"
import { format } from "date-fns"
import Link from "next/link"

export default function MaintenanceRecordsPage() {
  const { data: maintenanceRecords = [], isLoading } = useMaintenanceRecords() || {};
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter records by search query with defensive programming
  const filteredRecords = Array.isArray(maintenanceRecords) 
    ? maintenanceRecords.filter((record: any) => {
        if (!record) return false;
        const searchLower = searchQuery.toLowerCase();
        return (
          (record.table?.name || "").toLowerCase().includes(searchLower) ||
          (record.description || "").toLowerCase().includes(searchLower)
        );
      })
    : [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maintenance Records</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search records..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRecords && filteredRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record: any) => (
                  <TableRow key={record?.id || Math.random()}>
                    <TableCell>{record?.table?.name || 'Unknown Table'}</TableCell>
                    <TableCell>
                      {record?.maintenanceAt 
                        ? format(new Date(record.maintenanceAt), 'yyyy-MM-dd') 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{record?.description || 'No description'}</TableCell>
                    <TableCell>
                      ${record?.cost 
                          ? parseFloat(record.cost).toFixed(2) 
                          : '0.00'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/maintenance/records/${record?.id || ''}`}>
                        <Button variant="ghost" size="sm" disabled={!record?.id}>
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No maintenance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 