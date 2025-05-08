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
import { useInventoryReport } from "@/hooks/use-inventory"
import { useToast } from "@/components/ui/use-toast"

export function InventoryReports() {
  const [reportType, setReportType] = useState("DAILY")
  const [date, setDate] = useState<Date>()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Format date for API call
  const formattedDate = date ? format(date, "yyyy-MM-dd") : ""
  
  // Query inventory report data using React Query
  const { 
    data: reportResponse, 
    isLoading, 
    refetch,
    isError,
    error
  } = useInventoryReport(
    reportType, 
    formattedDate
  )
  
  // Extract report data from response
  const reportData = reportResponse?.data || {
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    stockMovements: {
      purchases: 0,
      sales: 0,
      adjustments: 0,
    },
    topProducts: [],
    dateRange: {
      start: "",
      end: ""
    },
    reportType: ""
  }

  const handleGenerateReport = async () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      })
      return
    }
    
    setIsGenerating(true)
    try {
      await refetch()
      toast({
        title: "Success",
        description: "Report generated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportReport = () => {
    if (!reportResponse?.data) {
      toast({
        title: "Error",
        description: "No report data to export",
        variant: "destructive",
      })
      return
    }
    
    // Create CSV content
    const csvContent = [
      `Inventory Report - ${reportType}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Report Period: ${reportData.dateRange.start ? new Date(reportData.dateRange.start).toLocaleDateString() : ''} to ${reportData.dateRange.end ? new Date(reportData.dateRange.end).toLocaleDateString() : ''}`,
      '',
      'Overview',
      `Total Products,${reportData.totalProducts}`,
      `Low Stock Items,${reportData.lowStockItems}`,
      `Total Value,$${reportData.totalValue.toFixed(2)}`,
      '',
      'Stock Movements',
      `Purchases,${reportData.stockMovements.purchases}`,
      `Sales,${reportData.stockMovements.sales}`,
      `Adjustments,${reportData.stockMovements.adjustments}`,
      '',
      'Top Products',
      'Name,Quantity,Value',
      ...reportData.topProducts.map(p => `${p.name},${p.quantity},$${p.value.toFixed(2)}`)
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `inventory-report-${reportType.toLowerCase()}-${formattedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          <Button 
            onClick={handleGenerateReport} 
            disabled={!date || isGenerating || isLoading}
          >
            {isGenerating || isLoading ? "Generating..." : "Generate Report"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={!reportResponse?.data}
          >
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
            {reportData.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product data available.</p>
            ) : (
              reportData.topProducts.map((product) => (
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 