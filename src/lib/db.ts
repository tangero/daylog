import { openDB, type DBSchema } from "idb";
import { Activity } from "@/types/activity";

interface DayLogDB extends DBSchema {
  activities: {
    key: string;
    value: Activity;
    indexes: { "by-timestamp": string };
  };
}

const DB_NAME = "daylog-db";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<DayLogDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("activities", { keyPath: "id" });
      store.createIndex("by-timestamp", "timestamp");
    },
  });
};

export const loadActivities = async (): Promise<Activity[]> => {
  try {
    const db = await initDB();
    const activities = await db.getAllFromIndex("activities", "by-timestamp");
    return activities.reverse(); // newest first
  } catch (error) {
    console.error("Error loading activities:", error);
    return [];
  }
};

export const saveActivity = async (activity: Activity): Promise<void> => {
  try {
    const db = await initDB();
    await db.put("activities", activity);
  } catch (error) {
    console.error("Error saving activity:", error);
  }
};

export const deleteActivity = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete("activities", id);
  } catch (error) {
    console.error("Error deleting activity:", error);
  }
};

export const updateActivity = async (activity: Activity): Promise<void> => {
  try {
    const db = await initDB();
    await db.put("activities", activity);
  } catch (error) {
    console.error("Error updating activity:", error);
  }
};

// Export pro kompatibilitu se starým kódem
export const saveActivities = async (activities: Activity[]): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction("activities", "readwrite");
    await Promise.all([
      ...activities.map((activity) => tx.store.put(activity)),
      tx.done,
    ]);
  } catch (error) {
    console.error("Error saving activities:", error);
  }
};
