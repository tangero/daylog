import { Activity } from "@/types/activity";

const API_BASE = "/api";

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE}/activities`);
  if (!response.ok) throw new Error("Failed to fetch activities");
  const activities = await response.json();
  return activities.map((activity: any) => ({
    ...activity,
    tags: JSON.parse(activity.tags),
  }));
}

export async function createActivity(activity: Activity): Promise<void> {
  const response = await fetch(`${API_BASE}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activity),
  });
  if (!response.ok) throw new Error("Failed to create activity");
}

export async function updateActivity(activity: Activity): Promise<void> {
  const response = await fetch(`${API_BASE}/activities`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activity),
  });
  if (!response.ok) throw new Error("Failed to update activity");
}

export async function deleteActivity(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/activities`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("Failed to delete activity");
}

export async function login(email: string, password: string): Promise<any> {
  const response = await fetch(`${API_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Invalid credentials");
  return response.json();
}
