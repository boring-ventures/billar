"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, X, FileText, ClipboardList, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSessions } from "@/hooks/use-sessions";
import { formatCost } from "@/lib/format-duration";
import { Input } from "@/components/ui/input";
import { SessionStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionGuide } from "@/components/sessions/session-guide";

export default function SessionsPage() {
  const router = useRouter();
  const { sessions, fetchSessions, isLoading } = useSessions();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Group sessions by status
  const activeSessions = sessions.filter(
    (session) => session.status === "ACTIVE"
  );
  const completedSessions = sessions.filter(
    (session) => session.status === "COMPLETED"
  );
  const cancelledSessions = sessions.filter(
    (session) => session.status === "CANCELLED"
  );

  const getFilteredSessions = () => {
    let filtered = sessions;

    // Apply status filter based on tab
    if (activeTab === "active") {
      filtered = activeSessions;
    } else if (activeTab === "completed") {
      filtered = completedSessions;
    } else if (activeTab === "cancelled") {
      filtered = cancelledSessions;
    }

    // Apply search filter to table name if query exists
    if (searchQuery) {
      filtered = filtered.filter((session) =>
        session.table?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Clock className="h-4 w-4 text-green-500" />;
      case "COMPLETED":
        return <Check className="h-4 w-4 text-blue-500" />;
      case "CANCELLED":
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Session Management"
        description="Track and manage all billiard table sessions"
      />

      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Active Sessions
            </CardTitle>
            <CardDescription>Currently running sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeSessions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Total Sessions Today
            </CardTitle>
            <CardDescription>All sessions started today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              Session Reports
            </CardTitle>
            <CardDescription>View and generate reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeSessions.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedSessions.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledSessions.length})
              </TabsTrigger>
            </TabsList>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Sessions</CardTitle>
                    <CardDescription>
                      Manage table usage and billing
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Search by table name..."
                    className="max-w-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading sessions...
                  </p>
                ) : filteredSessions.length === 0 ? (
                  <div className="rounded-md border p-8 text-center">
                    <p className="text-muted-foreground mb-6">
                      {sessions.length === 0
                        ? "No sessions found. Start a session from an available table."
                        : "No sessions match the current filters."}
                    </p>
                    {sessions.length === 0 && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/tables")}
                        className="mx-auto"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Go to Tables
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSessions.map((session) => {
                          const isActive = session.status === "ACTIVE";
                          const duration = isActive
                            ? "In progress"
                            : session.endedAt
                              ? formatDuration(
                                  new Date(session.startedAt),
                                  new Date(session.endedAt)
                                )
                              : "-";

                          return (
                            <TableRow
                              key={session.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                {session.table?.name || "Unknown Table"}
                              </TableCell>
                              <TableCell>
                                {new Date(session.startedAt).toLocaleString()}
                              </TableCell>
                              <TableCell>{duration}</TableCell>
                              <TableCell>
                                {session.staff
                                  ? `${session.staff.firstName || ""} ${
                                      session.staff.lastName || ""
                                    }`.trim() || "Staff"
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                ${formatCost(session.totalCost)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="flex items-center w-fit gap-1"
                                >
                                  {getStatusIcon(session.status)}
                                  {session.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isActive && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/tables/${session.tableId}/session/${session.id}`
                                      )
                                    }
                                  >
                                    Manage
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </div>

        <div>
          <SessionGuide />
        </div>
      </div>
    </div>
  );
}

function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
