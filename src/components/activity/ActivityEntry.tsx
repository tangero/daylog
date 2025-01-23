import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock } from "lucide-react";

interface ActivityEntryProps {
  timestamp?: string;
  displayTimestamp?: string;
  duration?: string;
  action?: string;
  tags?: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  onTagClick?: (tag: string) => void;
}

const ActivityEntry = ({
  displayTimestamp = new Date().toLocaleString().replace(/:\d{2}(?=\s|$)/, ""),
  duration = "30m",
  action = "Default activity",
  tags = ["#default", "#activity"],
  onEdit = () => {},
  onDelete = () => {},
  onTagClick = () => {},
}: ActivityEntryProps) => {
  return (
    <Card className="p-4 mb-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center text-gray-500 shrink-0">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{displayTimestamp}</span>
          </div>
          <Badge variant="secondary" className="text-sm shrink-0">
            {duration}
          </Badge>
          <p className="text-gray-800 truncate">{action}</p>
          <div className="flex gap-2 overflow-x-auto">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActivityEntry;
