-- Add column to store advanced time slots selection
-- When populated, this overrides the basic earliest_time/latest_time range
ALTER TABLE public.events 
ADD COLUMN advanced_time_slots jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.events.advanced_time_slots IS 'JSON object mapping time slot keys (YYYY-MM-DDTHH:mm) to boolean. When set, only true slots are available for selection.';