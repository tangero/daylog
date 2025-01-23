import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityInputProps {
  onSubmit?: (activity: string) => void;
  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string;
}

const ActivityInput = ({
  onSubmit = () => {},
  placeholder = "22 Jan 2025 8:00 30m Testing the #daylog app",
  disabled = false,
  defaultValue = "",
}: ActivityInputProps) => {
  const [activity, setActivity] = useState(defaultValue);

  React.useEffect(() => {
    setActivity(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activity.trim()) {
      onSubmit(activity);
      setActivity("");
    }
  };

  return (
    <Card className="p-4 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder={placeholder}
                className="flex-1"
                disabled={disabled}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Format: [Date] [Time] [Duration] [Activity] [#Tags]</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button type="submit" disabled={disabled || !activity.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Log
        </Button>
      </form>
    </Card>
  );
};

export default ActivityInput;
