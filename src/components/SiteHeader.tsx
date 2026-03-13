import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

const SiteHeader = () => {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">we.rsvp</h1>
          </Link>
          <div className="text-sm text-muted-foreground flex flex-col items-end">
            <span>
              <Link to="/privacy" className="text-primary hover:underline">Privacy-first</Link> group scheduling
            </span>
            <div className="flex gap-2 text-xs">
              <Link to="/how-to-use" className="text-primary hover:underline">
                How to use →
              </Link>
              <Link to="/compare" className="text-primary hover:underline">
                See how we compare →
              </Link>
            </div>
            <Link to="/feedback" className="text-primary hover:underline text-xs">
              Submit feedback →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
