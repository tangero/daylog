import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ActivityEntry from "./ActivityEntry";
import { Activity } from "@/types/activity";

interface ActivityFeedProps {
  activities?: Activity[];
  onEditActivity?: (id: string) => void;
  onDeleteActivity?: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

const ActivityFeed = ({
  activities = [
    {
      id: "1",
      timestamp: new Date().toISOString(),
      displayTimestamp: new Date()
        .toLocaleString()
        .replace(/:\d{2}(?=\s|$)/, ""),
      duration: "30m",
      action: "Working on project documentation",
      tags: ["#work", "#documentation"],
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      displayTimestamp: new Date(Date.now() - 3600000)
        .toLocaleString()
        .replace(/:\d{2}(?=\s|$)/, ""),
      duration: "1h",
      action: "Team meeting about new features",
      tags: ["#meeting", "#planning"],
    },
  ],
  onEditActivity = () => {},
  onDeleteActivity = () => {},
  onTagClick = () => {},
}: ActivityFeedProps) => {
  return (
    <div className="w-full h-full bg-gray-50 p-4">
      <ScrollArea className="h-full">
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityEntry
              key={activity.id}
              timestamp={activity.timestamp}
              displayTimestamp={activity.displayTimestamp}
              duration={activity.duration}
              action={activity.action}
              tags={activity.tags}
              onEdit={() => onEditActivity(activity.id)}
              onDelete={() => onDeleteActivity(activity.id)}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityFeed;
