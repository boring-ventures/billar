import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ActiveSession } from "@/components/sessions/active-session";
import { SessionGuide } from "@/components/sessions/session-guide";

export default function ActiveSessionPage({
  params,
}: {
  params: { tableId: string; sessionId: string };
}) {
  const { tableId, sessionId } = params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href={`/tables/${tableId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader
          title="Active Session"
          description="Manage current billiard table session"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActiveSession sessionId={sessionId} />
        </div>
        <div>
          <SessionGuide />
        </div>
      </div>
    </div>
  );
}
