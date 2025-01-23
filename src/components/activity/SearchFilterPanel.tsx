import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface SearchFilterPanelProps {
  onSearch?: (query: string) => void;
  onTagSelect?: (tag: string) => void;
  popularTags?: string[];
}

const SearchFilterPanel = ({
  onSearch = () => {},
  onTagSelect = () => {},
  popularTags = [
    "#work",
    "#personal",
    "#meeting",
    "#exercise",
    "#reading",
    "#coding",
    "#family",
    "#health",
  ],
}: SearchFilterPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="w-full p-4 bg-white border rounded-lg shadow-sm">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search activities..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      <div className="mt-4 text-sm text-muted-foreground mb-2">
        Most used tags:
      </div>
      <ScrollArea className="h-16">
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => onTagSelect(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchFilterPanel;
