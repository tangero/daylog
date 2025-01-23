import { Activity } from "@/types/activity";

const STORAGE_KEY = "daylog_activities";

export const loadActivities = (): Activity[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading activities:", error);
    return [];
  }
};

export const saveActivities = (activities: Activity[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error("Error saving activities:", error);
  }
};
