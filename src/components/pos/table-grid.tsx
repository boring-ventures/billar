"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Table {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  hourlyRate: number;
  durationInHours?: number;
  endSession?: boolean;
  currentSession?: {
    id: string;
    startTime: string;
    endTime?: string;
    orderCount: number;
    totalTime?: number;
    totalCost?: number;
  };
}

interface TableGridProps {
  tables: Table[];
  onTableSelect: (table: Table) => void;
}

export function TableGrid({ tables, onTableSelect }: TableGridProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [duration, setDuration] = useState<string>("1:00");
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  const getStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleStartSession = (table: Table) => {
    const [hours, minutes] = duration.split(":").map(Number);
    const totalHours = hours + (minutes / 60);
    if (totalHours > 0) {
      onTableSelect({ ...table, durationInHours: totalHours });
    }
    setSelectedTable(null);
  };

  const handleEndSession = (table: Table) => {
    onTableSelect({ ...table, endSession: true });
    setShowSessionDetails(false);
    setSelectedTable(null);
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const durationOptions = [
    "0:30", "1:00", "1:30", "2:00", "2:30", "3:00", "3:30", "4:00", "4:30", "5:00"
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card
          key={table.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Table {table.number}</h3>
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(table.status)}`}
            />
          </div>
          {table.currentSession && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Session: {table.currentSession.id}</p>
              <p>Orders: {table.currentSession.orderCount}</p>
              {table.currentSession.totalTime !== undefined && (
                <p>Time: {formatTime(table.currentSession.totalTime)}</p>
              )}
              {table.currentSession.totalCost !== undefined && (
                <p>Cost: ${table.currentSession.totalCost.toFixed(2)}</p>
              )}
              {table.currentSession.endTime && (
                <p>Ends: {new Date(table.currentSession.endTime).toLocaleTimeString()}</p>
              )}
            </div>
          )}
          <div className="mt-2">
            {table.status === "available" ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setSelectedTable(table)}
                  >
                    Start Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Table Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select
                        value={duration}
                        onValueChange={setDuration}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option} hours
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Hourly Rate: ${table.hourlyRate.toFixed(2)}</p>
                      <p>Total Cost: ${(table.hourlyRate * (parseFloat(duration.split(":")[0]) + parseInt(duration.split(":")[1]) / 60)).toFixed(2)}</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleStartSession(table)}
                    >
                      Start Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setSelectedTable(table)}
                  >
                    View Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Session Details - Table {table.number}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Session ID</Label>
                          <p className="text-sm text-muted-foreground">
                            {table.currentSession?.id}
                          </p>
                        </div>
                        <div>
                          <Label>Start Time</Label>
                          <p className="text-sm text-muted-foreground">
                            {table.currentSession?.startTime && 
                              formatDateTime(table.currentSession.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Current Time</Label>
                          <p className="text-sm text-muted-foreground">
                            {table.currentSession?.totalTime !== undefined && 
                              formatTime(table.currentSession.totalTime)}
                          </p>
                        </div>
                        <div>
                          <Label>Current Cost</Label>
                          <p className="text-sm text-muted-foreground">
                            ${table.currentSession?.totalCost?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {table.currentSession?.endTime && (
                        <div>
                          <Label>Scheduled End Time</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(table.currentSession.endTime)}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label>Orders</Label>
                        <p className="text-sm text-muted-foreground">
                          {table.currentSession?.orderCount} orders
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">End Session</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to end this session? This action cannot be undone.
                              {table.currentSession?.endTime && (
                                <p className="mt-2 text-sm font-medium">
                                  Note: This session was scheduled to end at{" "}
                                  {new Date(table.currentSession.endTime).toLocaleTimeString()}
                                </p>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleEndSession(table)}>
                              End Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 