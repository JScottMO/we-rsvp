import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Image } from "lucide-react";
import { Link } from "react-router-dom";
import profCLogo from "@/assets/prof-c-logo.png";
import buyMeCoffeeLogo from "@/assets/buymeacoffee.png";

const ScreenshotPlaceholder = ({ number, caption }: { number: number; caption: string }) => (
  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 bg-muted/30 flex flex-col items-center justify-center gap-2 my-4">
    <Image className="w-12 h-12 text-muted-foreground/50" />
    <p className="text-sm font-bold text-muted-foreground">Screenshot {number}</p>
    <p className="text-sm text-muted-foreground text-center">{caption}</p>
  </div>
);

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">we.rsvp</h1>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
                Compare
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">How to Use we.rsvp</h1>
          <p className="text-xl text-muted-foreground">
            A complete guide to scheduling meetings without the hassle
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
            <ul className="grid md:grid-cols-2 gap-2 text-sm">
              <li><a href="#creating-event" className="text-primary hover:underline">1. Creating an Event</a></li>
              <li><a href="#date-selection" className="text-primary hover:underline">2. Selecting Dates</a></li>
              <li><a href="#time-settings" className="text-primary hover:underline">3. Time Settings (Basic & Advanced)</a></li>
              <li><a href="#sharing" className="text-primary hover:underline">4. Sharing Your Event</a></li>
              <li><a href="#responding" className="text-primary hover:underline">5. Responding to an Event</a></li>
              <li><a href="#heatmap" className="text-primary hover:underline">6. Reading the Availability Heatmap</a></li>
              <li><a href="#editing" className="text-primary hover:underline">7. Editing or Removing Your Response</a></li>
              <li><a href="#finalizing" className="text-primary hover:underline">8. Finalizing an Event</a></li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 1: Creating an Event */}
        <section id="creating-event" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">1. Creating an Event</h2>
          <p className="text-muted-foreground mb-4">
            Getting started is simple. From the homepage, enter a name for your event and click "Get started". 
            You'll be taken to the event creation page where you can add more details.
          </p>
          <ScreenshotPlaceholder number={1} caption="Homepage with event name input field and 'Get started' button" />
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Event Details</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Event Title:</strong> Give your event a clear, descriptive name (e.g., "Team Offsite Planning", "Dinner with Friends")</li>
            <li><strong>Description (Optional):</strong> Add any additional context your participants might need, like location, agenda, or special instructions</li>
          </ul>
          <ScreenshotPlaceholder number={2} caption="Event creation form showing title, description fields, and date calendar" />
        </section>

        {/* Section 2: Date Selection */}
        <section id="date-selection" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">2. Selecting Dates</h2>
          <p className="text-muted-foreground mb-4">
            Use the interactive calendar to select which dates you want to offer for your event. 
            Click on individual dates to toggle them, or click and drag to select a range of dates.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Selected dates appear highlighted in the calendar</li>
            <li>You can select dates across multiple weeks or months</li>
            <li>Click a selected date again to deselect it</li>
            <li>Use the "Week starts on" dropdown to change whether weeks begin on Sunday or Monday</li>
          </ul>
          <ScreenshotPlaceholder number={3} caption="Calendar with multiple dates selected, showing the 'Week starts on' dropdown" />
        </section>

        {/* Section 3: Time Settings */}
        <section id="time-settings" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">3. Time Settings</h2>
          <p className="text-muted-foreground mb-4">
            we.rsvp offers two modes for setting available times: <strong>Basic</strong> and <strong>Advanced</strong>.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">Basic Mode (Default)</h3>
          <p className="text-muted-foreground mb-4">
            In Basic mode, you set a single time range that applies to all selected dates. Configure:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li><strong>Earliest Time:</strong> The earliest time slot participants can select</li>
            <li><strong>Latest Time:</strong> The latest time slot participants can select</li>
            <li><strong>Time Increment:</strong> How granular the time slots are (15 min, 30 min, 1 hour, etc.)</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Basic time settings showing earliest/latest time dropdowns and time increment selector" />

          <h3 className="text-lg font-semibold mt-6 mb-2">Advanced Mode</h3>
          <p className="text-muted-foreground mb-4">
            Advanced mode lets you specify exactly which time slots are available for each date. 
            This is perfect when different days have different availability windows.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Toggle to "Advanced" using the mode switch</li>
            <li>Set your overall earliest and latest times (this defines the grid boundaries)</li>
            <li>Click individual time slots on each date to enable or disable them</li>
            <li>Click and drag to select multiple slots at once</li>
            <li>Only enabled slots will be shown to participants</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Advanced time grid showing different time slots enabled for different dates" />
        </section>

        {/* Section 4: Sharing */}
        <section id="sharing" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">4. Sharing Your Event</h2>
          <p className="text-muted-foreground mb-4">
            Once you create your event, you'll be taken to the event page with a unique shareable link. This is how participants will access your event.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Click the <strong>"Share"</strong> button in the top-right corner to copy the event URL to your clipboard</li>
            <li>If no one has responded yet, you'll also see a welcome card with a quick <strong>"click here to copy the link"</strong> shortcut</li>
            <li>Share the link via email, messaging apps, or any other channel</li>
            <li>Anyone with the link can respond—no account needed</li>
            <li>The link contains encryption keys, so participants' names are protected</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Event page showing the 'Share' button and welcome card with copy link shortcut" />
          
          <div className="bg-accent/50 rounded-lg p-4 mt-4">
            <p className="text-sm text-accent-foreground">
              <strong>Privacy Note:</strong> The event link contains encryption information. 
              Participant names are encrypted and can only be read by those who have the full link.
            </p>
          </div>
        </section>

        {/* Section 5: Responding */}
        <section id="responding" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">5. Responding to an Event</h2>
          <p className="text-muted-foreground mb-4">
            When you receive an event link, click it to open the event page. Here's how to add your availability:
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Step 1: Enter Your Name</h3>
          <p className="text-muted-foreground mb-4">
            Click the <strong>"Join event"</strong> button next to the Availability heading. In the dialog that appears, enter your name and optionally add a password to protect your response from being edited by others. Then click <strong>"Continue"</strong>.
          </p>
          <ScreenshotPlaceholder caption="Screenshot: Join event dialog with name and optional password fields, and Continue button" />

          <h3 className="text-lg font-semibold mt-6 mb-2">Step 2: Mark Your Availability</h3>
          <p className="text-muted-foreground mb-4">
            Use the availability grid to indicate when you're free:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Click individual time slots to toggle them</li>
            <li>Click and drag to select multiple slots at once</li>
            <li>Your selected slots are outlined in black</li>
            <li>Green shading shows where others are also available</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Availability grid with some time slots selected (outlined in black with green shading)" />

          <h3 className="text-lg font-semibold mt-6 mb-2">Step 3: Save Your Response</h3>
          <p className="text-muted-foreground mb-4">
            Click <strong>"Save response"</strong> to submit your availability. Your response will immediately appear in the participant list and be reflected in the heatmap.
          </p>
          <ScreenshotPlaceholder caption="Screenshot: 'Save response', 'Finalize event', and 'Cancel' buttons below the availability grid" />
        </section>

        {/* Section 6: Heatmap */}
        <section id="heatmap" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">6. Reading the Availability Heatmap</h2>
          <p className="text-muted-foreground mb-4">
            The heatmap provides a visual overview of everyone's availability at a glance:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li><strong>Darker green:</strong> More participants are available at that time</li>
            <li><strong>Lighter green:</strong> Fewer participants are available</li>
            <li><strong>Hover over a slot:</strong> See exactly who is available during that time</li>
            <li>The participant list on the right side shows everyone who has responded</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Heatmap view showing green intensity varying by availability, with hover tooltip showing participant names" />
        </section>

        {/* Section 7: Editing */}
        <section id="editing" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">7. Editing or Removing Your Response</h2>
          <p className="text-muted-foreground mb-4">
            Need to update your availability? Here's how:
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Editing Your Response</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Click the <strong>"Join event"</strong> button again and enter your name (it will change to <strong>"Edit response"</strong> if you've already responded)</li>
            <li>If you set a password, you'll need to enter it</li>
            <li>Update your time selections and click <strong>"Save response"</strong></li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: 'Edit response' button in the Availability card header" />

          <h3 className="text-lg font-semibold mt-6 mb-2">Removing Your Response</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>While editing, click <strong>"Cancel"</strong> to remove your response entirely</li>
            <li>If you set a password, you'll need to confirm with your password</li>
            <li>Your response will be permanently deleted from the event</li>
          </ul>
        </section>

        {/* Section 8: Finalizing */}
        <section id="finalizing" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">8. Finalizing an Event</h2>
          <p className="text-muted-foreground mb-4">
            Once you've found the best time, you can finalize your event to lock in the chosen date and time:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>First, <strong>join the event</strong> by clicking "Join event" and entering your name</li>
            <li>Click the <strong>"Finalize event"</strong> button that appears below the grid</li>
            <li><strong>Click directly on a time slot</strong> in the grid to select the final date and time</li>
            <li>A confirmation dialog will appear — review the selection and confirm</li>
            <li>Download an iCal file or share the finalized event via email</li>
            <li>The event will be marked as finalized and no more responses will be accepted</li>
          </ul>
          <ScreenshotPlaceholder caption="Screenshot: Finalize mode showing 'Click a time slot on the grid to select the final time' prompt" />
          
          <div className="bg-accent/50 rounded-lg p-4 mt-4">
            <p className="text-sm text-accent-foreground">
              <strong>Auto-Cleanup:</strong> Finalized events are automatically deleted after 7 days to protect everyone's privacy. 
              Make sure to download the calendar invite before then!
            </p>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b pb-2">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">For Organizers</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Offer more date options for better flexibility</li>
                  <li>Use Advanced mode for complex schedules</li>
                  <li>Add a clear description with any requirements</li>
                  <li>Wait for all expected responses before finalizing</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">For Participants</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Mark all times you're available, not just preferred times</li>
                  <li>Use a password to protect your response</li>
                  <li>Update your response if your schedule changes</li>
                  <li>Check back before the event to see the final time</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Attribution Footer */}
        <div className="flex items-center justify-center gap-6 bg-muted rounded-lg p-4 w-fit mx-auto">
          <a 
            href="https://christiansonjs.com/links/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={profCLogo} 
              alt="Prof C Logo" 
              className="w-12 h-12"
            />
          </a>
          <a 
            href="https://buymeacoffee.com/profc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={buyMeCoffeeLogo} 
              alt="Buy me a coffee" 
              className="h-10"
            />
          </a>
        </div>
      </main>
    </div>
  );
};

export default HowToUse;
