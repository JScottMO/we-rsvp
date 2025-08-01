import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Users, User } from "lucide-react";

interface Response {
  id: string;
  participantName: string;
  availability: Record<string, boolean>;
  updatedAt: string;
}

interface Props {
  responses: Response[];
}

export const ParticipantList = ({ responses }: Props) => {
  const getAvailabilityCount = (response: Response) => {
    return Object.values(response.availability).filter(Boolean).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participants ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No responses yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Share the link to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => {
              const availableSlots = getAvailabilityCount(response);
              const totalSlots = Object.keys(response.availability).length;
              
              return (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {response.participantName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(response.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {availableSlots > 0 ? (
                        `${availableSlots} slots`
                      ) : (
                        'Not available'
                      )}
                    </Badge>
                    {totalSlots > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round((availableSlots / totalSlots) * 100)}% free
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};