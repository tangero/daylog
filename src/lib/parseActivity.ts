interface ParsedActivity {
  timestamp: Date;
  duration: string;
  action: string;
  tags: string[];
}

export function parseActivity(input: string): ParsedActivity {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Extract hashtags
  const tags: string[] = [];
  const textWithoutTags = input
    .replace(/#\w+/g, (match) => {
      tags.push(match);
      return "";
    })
    .trim();

  // Regular expressions for date and time patterns
  const datePatternMonthName =
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+(\d{4}))?/;
  const datePatternNumeric = /(\d{1,2})\.(\d{1,2})\.(?:(\d{4})|)/;
  const timePattern = /(\d{1,2}:\d{2})/;
  const durationPattern = /(\d+m|\d+h(?:\s*\d+m)?)/;

  let remainingText = textWithoutTags;
  let timestamp = new Date();
  let duration = "0m";

  // Parse date and initialize timestamp
  const dateMatchMonthName = remainingText.match(datePatternMonthName);
  const dateMatchNumeric = remainingText.match(datePatternNumeric);

  if (dateMatchMonthName) {
    const day = parseInt(dateMatchMonthName[1]);
    const monthStr = dateMatchMonthName[2];
    const year = dateMatchMonthName[3]
      ? parseInt(dateMatchMonthName[3])
      : currentYear;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames.indexOf(monthStr);

    if (month !== -1) {
      timestamp = new Date(year, month, day);
      timestamp.setHours(0, 0, 0, 0);
    }

    remainingText = remainingText.replace(dateMatchMonthName[0], "").trim();
  } else if (dateMatchNumeric) {
    const day = parseInt(dateMatchNumeric[1]);
    const month = parseInt(dateMatchNumeric[2]) - 1; // Months are 0-based
    const year = dateMatchNumeric[3]
      ? parseInt(dateMatchNumeric[3])
      : currentYear;

    timestamp = new Date(year, month, day);
    timestamp.setHours(0, 0, 0, 0);

    remainingText = remainingText.replace(dateMatchNumeric[0], "").trim();
  }

  // Parse time after date is set
  const timeMatch = remainingText.match(timePattern);
  if (timeMatch) {
    const [hours, minutes] = timeMatch[1].split(":").map(Number);
    timestamp.setHours(hours, minutes, 0, 0);
    remainingText = remainingText.replace(timeMatch[0], "").trim();
  }

  // Parse duration
  const durationMatch = remainingText.match(durationPattern);
  if (durationMatch) {
    duration = durationMatch[1];
    remainingText = remainingText.replace(durationMatch[0], "").trim();
  }

  // The remaining text is the action
  const action = remainingText;

  return {
    timestamp,
    duration,
    action,
    tags,
  };
}
