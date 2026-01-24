/**
 * Format seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format duration between two timestamps
 */
export const formatDuration = (start: string, end: string | null): string => {
  if (!end) return "Unknown";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  return `${minutes}m`;
};

/**
 * Format date to relative string (Today, Yesterday, or MM/DD)
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) return "Today";
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Get shortened workout name (first 2 characters)
 */
export const getWorkoutNameShort = (name: string | null): string | null => {
  if (!name) return null;
  return name.length >= 2 ? name.substring(0, 2) : name;
};



