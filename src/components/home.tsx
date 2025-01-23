import React, { useState, useEffect } from "react";
import ActivityInput from "./activity/ActivityInput";
import SearchFilterPanel from "./activity/SearchFilterPanel";
import ActivityFeed from "./activity/ActivityFeed";
import Header from "./layout/Header";
import { parseActivity } from "@/lib/parseActivity";
import {
  loadActivities,
  saveActivities,
  saveActivity,
  deleteActivity,
  updateActivity,
} from "@/lib/db";
import { Activity } from "@/types/activity";

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities().then(setActivities);
  }, []);

  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  const [initialActivities] = useState<Activity[]>([
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
  ]);

  // Initialize localStorage with sample data if empty
  useEffect(() => {
    if (activities.length === 0) {
      setActivities(initialActivities);
    }
  }, []);

  const handleActivitySubmit = (activityText: string) => {
    const parsed = parseActivity(activityText);
    const newActivity: Activity = {
      id: Date.now().toString(),
      timestamp: parsed.timestamp.toISOString(),
      displayTimestamp: parsed.timestamp
        .toLocaleString()
        .replace(/:\d{2}(?=\s|$)/, ""),
      duration: parsed.duration,
      action: parsed.action,
      tags: parsed.tags,
    };
    saveActivity(newActivity).then(() => {
      setActivities([newActivity, ...activities]);
    });
  };

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const handleEditActivity = (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (activity) {
      // Reconstruct the original input string
      const date = new Date(activity.timestamp);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      const reconstructedInput = `${day}.${month}. ${hours}:${minutes} ${activity.duration} ${activity.action} ${activity.tags.join(" ")}`;

      setEditingActivity({
        ...activity,
        action: reconstructedInput, // Store the full reconstructed string
      });
    }
  };

  const handleUpdateActivity = (activityText: string) => {
    if (editingActivity) {
      const parsed = parseActivity(activityText);
      const updatedActivities = activities.map((activity) =>
        activity.id === editingActivity.id
          ? {
              ...activity,
              timestamp: parsed.timestamp.toISOString(),
              displayTimestamp: parsed.timestamp
                .toLocaleString()
                .replace(/:\d{2}(?=\s|$)/, ""),
              duration: parsed.duration,
              action: parsed.action,
              tags: parsed.tags,
            }
          : activity,
      );
      const updatedActivity = updatedActivities.find(
        (a) => a.id === editingActivity.id,
      );
      if (updatedActivity) {
        updateActivity(updatedActivity).then(() => {
          setActivities(updatedActivities);
        });
      }
      setEditingActivity(null);
    }
  };

  const handleDeleteActivity = (id: string) => {
    deleteActivity(id).then(() => {
      setActivities(activities.filter((activity) => activity.id !== id));
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedTag(null);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
    setSearchQuery("");
  };

  const getPopularTags = () => {
    const tagCount: { [key: string]: number } = {};

    activities.forEach((activity) => {
      activity.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  };

  // Sort activities by timestamp (newest first) and then filter
  const sortedAndFilteredActivities = [...activities]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .filter((activity) => {
      if (selectedTag) {
        return activity.tags.includes(selectedTag);
      }
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          activity.action.toLowerCase().includes(searchLower) ||
          activity.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <ActivityInput
            onSubmit={
              editingActivity ? handleUpdateActivity : handleActivitySubmit
            }
            placeholder="22 Jan 2025 8:00 30m Testing the #daylog app"
            defaultValue={editingActivity?.action}
          />

          <SearchFilterPanel
            onSearch={handleSearch}
            onTagSelect={handleTagSelect}
            popularTags={getPopularTags()}
          />

          <div className="h-[600px]">
            <ActivityFeed
              activities={sortedAndFilteredActivities}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onTagClick={handleTagSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
