import { useState } from "react";
import { format, parseISO, addMinutes } from "date-fns";

interface Event {
  dateOptions: string[];
  earliestTime: string;
  latestTime: string;
  timeIncrement: number;
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
  onAvailabilityChange: (timeSlot: string, available: boolean) => void;
}

export const AvailabilityGrid = ({ 
  event, 
  responses, 
  userResponse, 
  isEditing, 
  onAvailabilityChange 
}: Props) => {
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleCellInteraction = (date: string, time: string, isMouseDown: boolean = false) => {
    if (!isEditing) return;
    
    const timeSlotKey = `${date}T${time}`;
    const currentlyAvailable = isUserAvailable(date, time);
    
    if (isMouseDown) {
      // Start dragging
      setIsDragging(true);
      setDragMode(currentlyAvailable ? 'deselect' : 'select');
      onAvailabilityChange(timeSlotKey, !currentlyAvailable);
    } else if (isDragging && dragMode) {
      // Continue dragging
      const shouldBeAvailable = dragMode === 'select';
      if (currentlyAvailable !== shouldBeAvailable) {
        onAvailabilityChange(timeSlotKey, shouldBeAvailable);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const handleClick = (date: string, time: string) => {
    if (!isEditing || isDragging) return;
    
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
              const consensusLevel = getConsensusLevel(date, time);
              const userAvailable = isUserAvailable(date, time);
              const canEdit = isEditing;
              
              return (
                <div
                  key={`${date}-${time}`}
                  className={`
                    h-8 border border-grid-border rounded cursor-pointer transition-all
                    ${canEdit ? 'hover:bg-grid-hover' : ''}
                    ${userAvailable && canEdit ? 'ring-2 ring-primary ring-inset' : ''}
                    ${getConsensusColor(consensusLevel)}
                  `}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCellInteraction(date, time, true);
                  }}
                  onMouseEnter={() => handleCellInteraction(date, time)}
                  onClick={() => handleClick(date, time)}
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
            <div className="w-4 h-4 bg-primary/20 border-2 border-primary rounded"></div>
            <span className="text-muted-foreground">Your availability</span>
          </div>
        )}
      </div>
      
      {isEditing && (
        <p className="text-xs text-muted-foreground mt-2">
          Click and drag to mark your availability. Green shows when others are free.
        </p>
      )}
    </div>
  );
};