import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ArrowLeft, Plus, X } from "lucide-react";
import { format, addDays } from "date-fns";

const CreateEvent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: searchParams.get('title') || '',
    description: '',
    dateOptions: [] as Date[],
    earliestTime: '09:00',
    latestTime: '17:00',
    timeIncrement: '30',
    weekStartDay: '0'
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarOpened, setCalendarOpened] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(d => 
      format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (dateExists) {
      // Remove date if already selected
      const filtered = selectedDates.filter(d => 
        format(d, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')
      );
      setSelectedDates(filtered);
      setFormData(prev => ({
        ...prev,
        dateOptions: filtered
      }));
    } else {
      // Add date if not selected
      setSelectedDates([...selectedDates, date]);
      setFormData(prev => ({
        ...prev,
        dateOptions: [...prev.dateOptions, date]
      }));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    const filtered = selectedDates.filter(d => 
      format(d, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
    );
    setSelectedDates(filtered);
    setFormData(prev => ({
      ...prev,
      dateOptions: filtered
    }));
  };

  const addQuickDates = (type: 'today' | 'tomorrow' | 'week') => {
    const today = new Date();
    let datesToAdd: Date[] = [];

    switch (type) {
      case 'today':
        datesToAdd = [today];
        break;
      case 'tomorrow':
        datesToAdd = [addDays(today, 1)];
        break;
      case 'week':
        datesToAdd = Array.from({ length: 8 }, (_, i) => addDays(today, i));
        break;
    }

    // Filter out dates that already exist and add new ones
    const existingDateStrings = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
    const newDates = datesToAdd.filter(date => 
      !existingDateStrings.includes(format(date, 'yyyy-MM-dd'))
    );
    
    const updatedDates = [...selectedDates, ...newDates];
    setSelectedDates(updatedDates);
    setFormData(prev => ({
      ...prev,
      dateOptions: updatedDates
    }));
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || selectedDates.length === 0) return;

    try {
      // TODO: Create event in Supabase
      const eventId = 'temp-id'; // Will be replaced with actual Supabase creation
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const isValid = formData.title.trim() && selectedDates.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Create event</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event name *</Label>
                <Input
                  id="title"
                  placeholder="Team meeting, dinner plans..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Time settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="earliest">Earliest time</Label>
                  <Input
                    id="earliest"
                    type="time"
                    value={formData.earliestTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, earliestTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="latest">Latest time</Label>
                  <Input
                    id="latest"
                    type="time"
                    value={formData.latestTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, latestTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="increment">Time increment</Label>
                  <Select value={formData.timeIncrement} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, timeIncrement: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weekstart">Week starts on</Label>
                  <Select value={formData.weekStartDay} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, weekStartDay: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select dates *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick date options */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickDates('today')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickDates('tomorrow')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuickDates('week')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Next 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!calendarOpened) {
                      setCalendarOpened(true);
                    }
                    setShowCalendar(!showCalendar);
                  }}
                >
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Pick dates
                </Button>
              </div>

              {/* Calendar picker */}
              {(showCalendar || calendarOpened) && (
                <div className="border border-border rounded-md p-4">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      console.log('Calendar onSelect triggered with:', dates);
                      if (dates) {
                        console.log('Setting selected dates to:', dates);
                        setSelectedDates(dates);
                        setFormData(prev => ({
                          ...prev,
                          dateOptions: dates
                        }));
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    weekStartsOn={formData.weekStartDay === '0' ? 0 : 1}
                    className="rounded-md pointer-events-auto"
                  />
                </div>
              )}

              {/* Selected dates */}
              {selectedDates.length > 0 && (
                <div>
                  <Label>Selected dates ({selectedDates.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-accent px-3 py-1 rounded-md text-sm"
                      >
                        {format(date, 'MMM d, yyyy')}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDate(date)}
                          className="h-auto p-0 w-4 h-4"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Button */}
          <Button 
            onClick={handleCreateEvent}
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Create event
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;