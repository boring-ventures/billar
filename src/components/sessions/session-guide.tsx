"use client";

import {
  HelpCircle,
  PlayCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function SessionGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Session Management Guide
        </CardTitle>
        <CardDescription>How to manage billiard table sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                Starting a Session
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>
                  Sessions can only be started when a table has the status{" "}
                  <span className="font-semibold">AVAILABLE</span>.
                </p>
                <p>To start a session:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Navigate to the table details page</li>
                  <li>
                    Click the{" "}
                    <span className="font-semibold">Start Session</span> button
                    in the top right
                  </li>
                  <li>
                    The table status will automatically change to{" "}
                    <span className="font-semibold">OCCUPIED</span>
                  </li>
                  <li>
                    You'll be redirected to the active session management page
                  </li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Managing Active Sessions
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>
                  During an active session, you can monitor the time elapsed and
                  estimated cost.
                </p>
                <p>The session management page provides:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Real-time timer showing session duration</li>
                  <li>
                    Current cost calculation based on the table's hourly rate
                  </li>
                  <li>Options to end or cancel the session when finished</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completing a Session
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>
                  When a customer is finished, you should end the session to
                  record the usage and fees.
                </p>
                <p>To complete a session:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Click the <span className="font-semibold">End Session</span>{" "}
                    button on the active session page
                  </li>
                  <li>Confirm the action in the dialog that appears</li>
                  <li>
                    The system will:
                    <ul className="list-disc pl-4 mt-1">
                      <li>Calculate the final cost based on duration</li>
                      <li>Record the session as COMPLETED</li>
                      <li>Change the table status back to AVAILABLE</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Cancelling a Session
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>
                  If a session needs to be stopped without charging the
                  customer, you can cancel it.
                </p>
                <p>To cancel a session:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Click the{" "}
                    <span className="font-semibold">Cancel Session</span> button
                    on the active session page
                  </li>
                  <li>Confirm the cancellation</li>
                  <li>
                    The system will mark the session as CANCELLED and set the
                    table back to AVAILABLE
                  </li>
                  <li>No charges will be recorded for cancelled sessions</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
