import { format, addMinutes } from "date-fns";
import { useState, useCallback, useRef, useEffect } from "react";

interface Props {
  selectedDates: Date[];
  earliestTime: string;
  latestTime: string;
  timeIncrement: number;
  selectedTimeSlots: Record<string, boolean>;
  onTimeSlotChange: (timeSlot: string, selected: boolean) => void;
}

export const AdvancedTimeGrid = ({
  selectedDates,
  earliestTime,
  latestTime,
  timeIncrement,
  selectedTimeSlots,
  onTimeSlotChange,
}: Props) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<boolean | null>(null); // true = selecting, false = deselecting
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle mouse up anywhere to end drag
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseDown = useCallback((date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${dateStr}T${time}`;
    const newState = !selectedTimeSlots[key];
    
    setIsDragging(true);
    setDragMode(newState);
    onTimeSlotChange(key, newState);
  }, [selectedTimeSlots, onTimeSlotChange]);

  const handleMouseEnter = useCallback((date: Date, time: string) => {
    if (!isDragging || dragMode === null) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${dateStr}T${time}`;
    
    // Only change if different from drag mode
    if (selectedTimeSlots[key] !== dragMode) {
      onTimeSlotChange(key, dragMode);
    }
  }, [isDragging, dragMode, selectedTimeSlots, onTimeSlotChange]);
  // Generate time slots
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [startHour, startMin] = earliestTime.split(':').map(Number);
    const [endHour, endMin] = latestTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, timeIncrement);
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  const isSelected = useCallback((date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${dateStr}T${time}`;
    return selectedTimeSlots[key] || false;
  }, [selectedTimeSlots]);

  if (selectedDates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Select dates above to configure time slots for each day.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click and drag across time slots to quickly select or deselect availability options. Selected slots will be available for participants to choose from.
      </p>
      
      <div className="overflow-x-auto">
        <div 
          ref={gridRef}
          className="grid gap-1 min-w-max select-none"
          style={{ 
            gridTemplateColumns: `80px repeat(${sortedDates.length}, minmax(100px, 1fr))` 
          }}
        >
          {/* Header row */}
          <div></div>
          {sortedDates.map((date, index) => (
            <div key={index} className="text-center font-medium p-2 bg-muted rounded text-sm">
              {format(date, 'MMM d')}
              <div className="text-xs text-muted-foreground">
                {format(date, 'EEE')}
              </div>
            </div>
          ))}

          {/* Time rows */}
          {timeSlots.map((time) => (
            <div key={time} className="contents">
              {/* Time label */}
              <div className="text-right text-sm text-muted-foreground py-1 pr-2 font-medium">
                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
              </div>
              
              {/* Time slot cells */}
              {sortedDates.map((date) => {
                const selected = isSelected(date, time);
                
                return (
                  <div
                    key={`${format(date, 'yyyy-MM-dd')}-${time}`}
                    className={`
                      h-8 border border-border rounded cursor-pointer transition-colors
                      hover:bg-accent
                      ${selected ? 'bg-primary/20 ring-2 ring-primary ring-inset' : 'bg-muted/30'}
                    `}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(date, time);
                    }}
                    onMouseEnter={() => handleMouseEnter(date, time)}
                    title={selected ? 'Click or drag to remove' : 'Click or drag to add'}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 border border-border rounded"></div>
          <span className="text-muted-foreground">Not available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/20 border-2 border-primary rounded"></div>
          <span className="text-muted-foreground">Available for selection</span>
        </div>
      </div>
    </div>
  );
};
