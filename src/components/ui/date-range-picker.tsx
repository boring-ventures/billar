"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type { DateRange };

interface DateRangePickerProps {
  value?: DateRange | undefined;
  onChange?: (date: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango",
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  // Pre-defined ranges
  const handleSelectPredefined = (range: DateRange) => {
    setDate(range);
    onChange?.(range);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="border-b p-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Rangos rápidos</h4>
              <div className="flex flex-wrap gap-1 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    handleSelectPredefined({
                      from: today,
                      to: today,
                    });
                  }}
                >
                  Hoy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    handleSelectPredefined({
                      from: yesterday,
                      to: yesterday,
                    });
                  }}
                >
                  Ayer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const from = new Date(today);
                    from.setDate(from.getDate() - 7);
                    handleSelectPredefined({
                      from,
                      to: today,
                    });
                  }}
                >
                  Últimos 7 días
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const from = new Date(today);
                    from.setDate(from.getDate() - 30);
                    handleSelectPredefined({
                      from,
                      to: today,
                    });
                  }}
                >
                  Últimos 30 días
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const from = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    );
                    const to = new Date(
                      today.getFullYear(),
                      today.getMonth() + 1,
                      0
                    );
                    handleSelectPredefined({
                      from,
                      to,
                    });
                  }}
                >
                  Este mes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const from = new Date(
                      today.getFullYear(),
                      today.getMonth() - 1,
                      1
                    );
                    const to = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      0
                    );
                    handleSelectPredefined({
                      from,
                      to,
                    });
                  }}
                >
                  Mes anterior
                </Button>
              </div>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              onChange?.(selectedDate);
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
