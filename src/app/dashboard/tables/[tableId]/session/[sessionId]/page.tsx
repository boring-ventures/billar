"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ActiveSession } from "@/components/sessions/active-session";
import { SessionGuide } from "@/components/sessions/session-guide";
import { useSessions } from "@/hooks/use-sessions";

export default function ActiveSessionPage({
  params,
}: {
  params: Promise<{ tableId: string; sessionId: string }>;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");
  const [tableId, setTableId] = useState<string>("");
  const { fetchSessionById, activeSession, isLoading } = useSessions();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setSessionId(resolvedParams.sessionId);
      setTableId(resolvedParams.tableId);
    };

    loadParams();
  }, [params]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionById(sessionId);
    }
  }, [sessionId, fetchSessionById]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/tables/${tableId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Active Session"
          description="Manage current billiard table session"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActiveSession sessionId={sessionId} initialData={activeSession} />
        </div>
        <div>
          <SessionGuide />
        </div>
      </div>
    </div>
  );
}
