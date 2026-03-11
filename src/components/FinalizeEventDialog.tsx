import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  selectedDate: string;
  selectedTime: string;
  onFinalize: (date: string, startTime: string, endTime: string) => Promise<void>;
}

export const FinalizeEventDialog = ({
  open,
  onOpenChange,
  event,
  selectedDate,
  selectedTime,
  onFinalize,
}: FinalizeEventDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"confirm" | "done">("confirm");

  // Calculate end time as one increment after selected time
  const endTime = format(
    addMinutes(new Date(`2000-01-01T${selectedTime}`), event.timeIncrement),
    'HH:mm'
  );

  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      await onFinalize(selectedDate, selectedTime, endTime);
      setStep("done");
    } catch (error) {
      console.error("Failed to finalize:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadIcal = () => {
    const icalEvent: ICalEvent = {
      title: event.title,
      description: event.description,
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTime,
    };
    downloadICalFile(icalEvent);
  };

  const handleSendEmail = () => {
    const icalEvent: ICalEvent = {
      title: event.title,
      description: event.description,
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTime,
    };
    const mailtoLink = generateMailtoLink(icalEvent);
    window.open(mailtoLink, '_blank');
  };

  const resetAndClose = () => {
    setStep("confirm");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            {step === "confirm" ? "Finalize Event" : "Event Confirmed!"}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm"
              ? "Confirm the final date and time for this event."
              : "The event has been locked. Share the details with participants."
            }
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')} – {format(new Date(`2000-01-01T${endTime}`), 'h:mm a')}
              </p>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <div className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  This action cannot be undone. The event will be closed and no additional responses will be accepted.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetAndClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleFinalize} disabled={isLoading} className="flex-1">
                {isLoading ? "Confirming..." : "Confirm & Close Event"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')} – {format(new Date(`2000-01-01T${endTime}`), 'h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleDownloadIcal} variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download calendar file (.ics)
              </Button>
              <Button onClick={handleSendEmail} variant="outline" className="w-full justify-start">
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
