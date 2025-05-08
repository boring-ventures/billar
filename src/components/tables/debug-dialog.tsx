"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TableDialog } from "@/components/tables/table-dialog";

export function DebugTableDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [counter, setCounter] = useState(0);
  
  // Log when dialog opens/closes
  useEffect(() => {
    console.log(`Debug: Dialog is now ${isDialogOpen ? 'open' : 'closed'}`);
  }, [isDialogOpen]);
  
  // Render counter to track component re-renders
  useEffect(() => {
    console.log(`Debug: DebugDialog render count: ${counter}`);
  }, [counter]);
  
  const handleOpenDialog = () => {
    console.log("Debug: Opening dialog");
    setIsDialogOpen(true);
    setCounter(c => c + 1);
  };
  
  const handleDialogChange = (open: boolean) => {
    console.log(`Debug: Dialog state changing to ${open}`);
    setIsDialogOpen(open);
    setCounter(c => c + 1);
  };
  
  const handleSuccess = () => {
    console.log("Debug: Success callback called");
    setIsDialogOpen(false);
    setCounter(c => c + 1);
  };
  
  return (
    <div className="bg-amber-100 border border-amber-300 p-4 rounded-lg my-4">
      <h3 className="font-bold mb-2">Dialog Debug Panel</h3>
      <p className="text-sm mb-2">Render count: {counter}</p>
      <div className="flex gap-2">
        <Button onClick={handleOpenDialog}>
          Open Debug Dialog
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => setIsDialogOpen(false)}
        >
          Force Close Dialog
        </Button>
      </div>
      
      <TableDialog
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        onSuccess={handleSuccess}
      />
    </div>
  );
} 