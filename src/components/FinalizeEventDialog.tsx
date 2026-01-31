import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Mail, Download, AlertTriangle } from "lucide-react";
import { format, parseISO, addMinutes } from "date-fns";
import { downloadICalFile, generateMailtoLink, type ICalEvent } from "@/lib/ical";

interface FinalizeEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    description?: string;
    dateOptions: string[];
    earliestTime: string;
    latestTime: string;
    timeIncrement: number;
  };
  prefillSlot?: { date: string; time: string } | null;
  onFinalize: (date: string, startTime: string, endTime: string) => Promise<void>;
}

export const FinalizeEventDialog = ({
  open,
  onOpenChange,
  event,
  prefillSlot,
  onFinalize,
}: FinalizeEventDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(prefillSlot?.date || "");
  const [selectedStartTime, setSelectedStartTime] = useState<string>(prefillSlot?.time || "");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"select" | "confirm">("select");

  // Update state when prefillSlot changes
  React.useEffect(() => {
    if (prefillSlot) {
      setSelectedDate(prefillSlot.date);
      setSelectedStartTime(prefillSlot.time);
      // Auto-set end time to next slot
      const slots = generateTimeSlots();
      const startIndex = slots.indexOf(prefillSlot.time);
      if (startIndex !== -1 && startIndex < slots.length - 1) {
        setSelectedEndTime(slots[startIndex + 1]);
      }
    }
  }, [prefillSlot]);

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [startHour, startMin] = event.earliestTime.split(':').map(Number);
    const [endHour, endMin] = event.latestTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    let currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, event.timeIncrement);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleFinalize = async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return;
    
    setIsLoading(true);
    try {
      await onFinalize(selectedDate, selectedStartTime, selectedEndTime);
      setStep("confirm");
    } catch (error) {
      console.error("Failed to finalize:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadIcal = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return;
    
    const icalEvent: ICalEvent = {
      title: event.title,
      description: event.description,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
    };
    
    downloadICalFile(icalEvent);
  };

  const handleSendEmail = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return;
    
    const icalEvent: ICalEvent = {
      title: event.title,
      description: event.description,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
    };
    
    const mailtoLink = generateMailtoLink(icalEvent);
    window.open(mailtoLink, '_blank');
  };

  const resetAndClose = () => {
    setStep("select");
    setSelectedDate("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    onOpenChange(false);
  };

  const isValid = selectedDate && selectedStartTime && selectedEndTime;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            {step === "select" ? "Finalize Event" : "Event Confirmed!"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" 
              ? "Select the final date and time for this event. Once confirmed, no one else can join."
              : "The event has been locked. Share the details with participants."
            }
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <div className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  This action cannot be undone. The event will be closed and no additional responses will be accepted.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="date">Select date</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a date" />
                </SelectTrigger>
                <SelectContent>
                  {event.dateOptions.map((date) => (
                    <SelectItem key={date} value={date}>
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start time</Label>
                <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endTime">End time</Label>
                <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter(time => !selectedStartTime || time > selectedStartTime)
                      .map((time) => (
                        <SelectItem key={time} value={time}>
                          {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetAndClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={!isValid || isLoading}
                className="flex-1"
              >
                {isLoading ? "Confirming..." : "Confirm & Close Event"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDate && format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedStartTime && format(new Date(`2000-01-01T${selectedStartTime}`), 'h:mm a')} - {selectedEndTime && format(new Date(`2000-01-01T${selectedEndTime}`), 'h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleDownloadIcal}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download calendar file (.ics)
              </Button>
              
              <Button
                onClick={handleSendEmail}
                variant="outline"
                className="w-full justify-start"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email participants
              </Button>
            </div>

            <Button onClick={resetAndClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
