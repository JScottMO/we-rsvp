import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

function getTimezoneOffset(tz: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (!offsetPart) return 0;
    const match = offsetPart.value.match(/GMT([+-]?\d+(?::\d+)?)?/);
    if (!match) return 0;
    if (!match[1]) return 0;
    const [h, m] = match[1].split(":").map(Number);
    return (h || 0) * 60 + (Math.sign(h || 0)) * (m || 0);
  } catch {
    return 0;
  }
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getTimezoneLabel(tz: string): string {
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

interface TzEntry {
  id: string;
  label: string;
  offset: number;
  offsetStr: string;
}

function buildTimezoneList(): TzEntry[] {
  const tzNames = Intl.supportedValuesOf("timeZone");
  const entries: TzEntry[] = tzNames.map((tz) => {
    const offset = getTimezoneOffset(tz);
    return {
      id: tz,
      label: getTimezoneLabel(tz),
      offset,
      offsetStr: formatOffset(offset),
    };
  });
  entries.sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
  return entries;
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export const TimezoneSelector = ({ value, onChange }: TimezoneSelectorProps) => {
  const allTimezones = useMemo(() => buildTimezoneList(), []);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return allTimezones;
    const q = search.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.id.toLowerCase().includes(q) ||
        tz.offsetStr.toLowerCase().includes(q)
    );
  }, [allTimezones, search]);

  const selectedEntry = allTimezones.find((tz) => tz.id === value);

  return (
    <div>
      <Label>Timezone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start font-normal"
          >
            <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
            {selectedEntry
              ? `(${selectedEntry.offsetStr}) ${selectedEntry.label}`
              : "Select timezone..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <Input
              placeholder="Search timezone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[280px]">
            <div className="p-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground p-2 text-center">
                  No timezone found.
                </p>
              )}
              {filtered.map((tz) => (
                <button
                  key={tz.id}
                  onClick={() => {
                    onChange(tz.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left",
                    value === tz.id && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      value === tz.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground font-mono text-xs w-[72px] flex-shrink-0">
                    {tz.offsetStr}
                  </span>
                  <span className="truncate">{tz.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
