import { useState } from "react";
import { format, parseISO, addMinutes } from "date-fns";

interface Event {
  dateOptions: string[];
  earliestTime: string;
  latestTime: string;
  timeIncrement: number;
  advancedTimeSlots?: Record<string, boolean>;
}

interface Response {
  participantName: string;
  availability: Record<string, boolean>;
}

interface Props {
  event: Event;
  responses: Response[];
  userResponse: Response | null;
  isEditing: boolean;
  isFinalizing?: boolean;
  onAvailabilityChange: (timeSlot: string, available: boolean) => void;
  onFinalizeSlotClick?: (date: string, time: string) => void;
}

export const AvailabilityGrid = ({ 
  event, 
  responses, 
  userResponse, 
  isEditing, 
  isFinalizing = false,
  onAvailabilityChange,
  onFinalizeSlotClick,
}: Props) => {
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);

  // Check if a time slot is allowed based on advanced time slots
  const isSlotAllowed = (date: string, time: string): boolean => {
    // If no advanced time slots configured, all slots within range are allowed
    if (!event.advancedTimeSlots || Object.keys(event.advancedTimeSlots).length === 0) {
      return true;
    }
    // Check if this specific slot is marked as available in advanced config
    const slotKey = `${date}T${time}`;
    return event.advancedTimeSlots[slotKey] === true;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMin] = event.earliestTime.split(':').map(Number);
    const [endHour, endMin] = event.latestTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, event.timeIncrement);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate consensus for each time slot
  const getConsensusLevel = (date: string, time: string) => {
    const timeSlotKey = `${date}T${time}`;
    const availableCount = responses.filter(r => r.availability[timeSlotKey]).length;
    const total = responses.length;
    
    if (total === 0) return 0;
    return availableCount / total;
  };

  const getConsensusColor = (level: number) => {
    if (level === 0) return 'bg-unavailable';
    if (level <= 0.25) return 'bg-consensus-1';
    if (level <= 0.5) return 'bg-consensus-2';
    if (level <= 0.75) return 'bg-consensus-3';
    if (level < 1) return 'bg-consensus-4';
    return 'bg-consensus-max';
  };

  const isUserAvailable = (date: string, time: string) => {
    if (!userResponse) return false;
    const timeSlotKey = `${date}T${time}`;
    return userResponse.availability[timeSlotKey] || false;
  };

  const handleMouseDown = (date: string, time: string, event: React.MouseEvent) => {
    if (!isEditing) return;
    
    event.preventDefault();
    setDragStarted(true);
    
    const timeSlotKey = `${date}T${time}`;
    const currentlyAvailable = isUserAvailable(date, time);
    
    setIsDragging(true);
    setDragMode(currentlyAvailable ? 'deselect' : 'select');
    onAvailabilityChange(timeSlotKey, !currentlyAvailable);
  };

  const handleMouseEnter = (date: string, time: string) => {
    if (!isEditing || !isDragging || !dragMode) return;
    
    const timeSlotKey = `${date}T${time}`;
    const currentlyAvailable = isUserAvailable(date, time);
    const shouldBeAvailable = dragMode === 'select';
    
    if (currentlyAvailable !== shouldBeAvailable) {
      onAvailabilityChange(timeSlotKey, shouldBeAvailable);
    }
  };

  const handleMouseUp = () => {
    if (dragStarted) {
      // Small delay to prevent click event from firing after drag
      setTimeout(() => {
        setDragStarted(false);
      }, 50);
    }
    setIsDragging(false);
    setDragMode(null);
  };

  const handleClick = (date: string, time: string, event: React.MouseEvent) => {
    if (!isEditing || dragStarted) {
      event.preventDefault();
      return;
    }
    
    const timeSlotKey = `${date}T${time}`;
    const currentlyAvailable = isUserAvailable(date, time);
    onAvailabilityChange(timeSlotKey, !currentlyAvailable);
  };

  return (
    <div className="overflow-x-auto">
      <div 
        className="grid gap-1 min-w-max select-none"
        style={{ 
          gridTemplateColumns: `80px repeat(${event.dateOptions.length}, minmax(120px, 1fr))` 
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header row */}
        <div></div>
        {event.dateOptions.map((date, index) => (
          <div key={index} className="text-center font-medium p-2 bg-muted rounded text-sm">
            {format(parseISO(date), 'MMM d')}
            <div className="text-xs text-muted-foreground">
              {format(parseISO(date), 'EEE')}
            </div>
          </div>
        ))}

        {/* Time rows */}
        {timeSlots.map((time) => (
          <div key={time} className="contents">
            {/* Time label */}
            <div className="text-right text-sm text-time-label py-1 pr-2 font-medium">
              {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
            </div>
            
            {/* Time slot cells */}
            {event.dateOptions.map((date) => {
              const allowed = isSlotAllowed(date, time);
              
              // Skip rendering slots that aren't allowed by advanced config
              if (!allowed) {
                return (
                  <div
                    key={`${date}-${time}`}
                    className="h-8 bg-muted/20 border border-dashed border-grid-border/50 rounded"
                    title="Not available for this event"
                  />
                );
              }
              
              const consensusLevel = getConsensusLevel(date, time);
              const userAvailable = isUserAvailable(date, time);
              const canEdit = isEditing;
              
              return (
                <div
                  key={`${date}-${time}`}
                  className={`
                    h-8 border border-grid-border rounded cursor-pointer transition-all
                    ${canEdit ? 'hover:bg-grid-hover' : ''}
                    ${userAvailable && canEdit ? 'ring-2 ring-foreground ring-inset' : ''}
                    ${getConsensusColor(consensusLevel)}
                  `}
                  onMouseDown={(e) => handleMouseDown(date, time, e)}
                  onMouseEnter={() => handleMouseEnter(date, time)}
                  onClick={(e) => handleClick(date, time, e)}
                  title={
                    responses.length > 0 
                      ? `${Math.round(consensusLevel * 100)}% available (${Math.round(consensusLevel * responses.length)}/${responses.length})`
                      : canEdit 
                        ? 'Click to toggle availability'
                        : 'No responses yet'
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-unavailable border border-grid-border rounded"></div>
          <span className="text-muted-foreground">No one</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-consensus-2 border border-grid-border rounded"></div>
          <span className="text-muted-foreground">Some available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-consensus-max border border-grid-border rounded"></div>
          <span className="text-muted-foreground">Everyone available</span>
        </div>
        {isEditing && (
          <div className="flex items-center gap-2 ml-4">
            <div className="w-4 h-4 bg-primary/20 border-2 border-foreground rounded"></div>
            <span className="text-muted-foreground">Your availability</span>
          </div>
        )}
      </div>
      
    </div>
  );
};