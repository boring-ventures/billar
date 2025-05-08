"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportData {
  totalProducts: number
  lowStockItems: number
  totalValue: number
  stockMovements: {
    purchases: number
    sales: number
    adjustments: number
  }
  topProducts: Array<{
    name: string
    quantity: number
    value: number
  }>
}

export function InventoryReports() {
  const [reportType, setReportType] = useState("DAILY")
  const [date, setDate] = useState<Date>()
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    stockMovements: {
      purchases: 0,
      sales: 0,
      adjustments: 0,
    },
    topProducts: [],
  })

  const handleGenerateReport = async () => {
    // TODO: Implement report generation logic
  }

  const handleExportReport = () => {
    // TODO: Implement report export logic
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Inventory Reports</h3>
        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily Report</SelectItem>
              <SelectItem value="WEEKLY">Weekly Report</SelectItem>
              <SelectItem value="MONTHLY">Monthly Report</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly Report</SelectItem>
              <SelectItem value="ANNUAL">Annual Report</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerateReport}>Generate Report</Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(reportData.totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Purchases:</span>
                <span>{reportData.stockMovements.purchases}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales:</span>
                <span>{reportData.stockMovements.sales}</span>
              </div>
              <div className="flex justify-between">
                <span>Adjustments:</span>
                <span>{reportData.stockMovements.adjustments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.topProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {product.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(product.value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 