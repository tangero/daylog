export interface Activity {
  id: string;
  timestamp: string; // ISO string for sorting
  displayTimestamp: string; // Formatted string for display
  duration: string;
  action: string;
  tags: string[];
}
