"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, History, AlertCircle, DollarSign } from "lucide-react"
import { useMaintenanceStats } from "@/hooks/use-maintenance"
import { Skeleton } from "@/components/ui/skeleton";

export default function MaintenancePage() {
  const { 
    upcomingCount = 0, 
    totalRecords = 0, 
    totalCost = 0, 
    tablesInMaintenance = 0, 
    isLoading 
  } = useMaintenanceStats() || {}; // Apply defensive pattern with default empty object

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
        <Link href="/maintenance/schedule">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{upcomingCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Scheduled for next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Records</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalRecords}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All time maintenance activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${(totalCost || 0).toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total cost this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables in Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{tablesInMaintenance}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently under maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/maintenance/schedule">
            <Card className="hover:bg-accent cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Schedule New Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Schedule maintenance for a table
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/maintenance/records">
            <Card className="hover:bg-accent cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">View Maintenance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage maintenance history
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/maintenance/costs">
            <Card className="hover:bg-accent cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Maintenance Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track and analyze maintenance expenses
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
} 