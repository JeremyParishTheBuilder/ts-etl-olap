const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const COMPACT_DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;

const TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(?:\s*(Z|[+-]\d{2}:?\d{2}))?$/;

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function isValidDateValue(value: string): boolean {
  let match = DATE_PATTERN.exec(value);

  if (!match) {
    match = COMPACT_DATE_PATTERN.exec(value);
  }

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return isValidCalendarDate(year, month, day);
}

export function isValidTimestampValue(value: string): boolean {
  const match = TIMESTAMP_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7];
  const timezone = match[8];

  if (!isValidCalendarDate(year, month, day)) {
    return false;
  }

  if (hour < 0 || hour > 23) {
    return false;
  }

  if (minute < 0 || minute > 59) {
    return false;
  }

  if (second < 0 || second > 59) {
    return false;
  }

  if (fraction !== undefined && fraction.length > 6) {
    return false;
  }

  if (timezone !== undefined && timezone !== "Z") {
    const timezoneMatch = /^([+-])(\d{2}):?(\d{2})$/.exec(timezone);

    if (!timezoneMatch) {
      return false;
    }

    const timezoneHour = Number(timezoneMatch[2]);
    const timezoneMinute = Number(timezoneMatch[3]);

    if (timezoneHour > 23 || timezoneMinute > 59) {
      return false;
    }
  }

  return true;
}

export function normalizeDate(value: string): string {
  if (!isValidDateValue(value)) {
    throw new Error(`Invalid DATE value: ${value}`);
  }

  const compactMatch = COMPACT_DATE_PATTERN.exec(value);

  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  return value;
}

export function normalizeTimestamp(value: string): string {
  if (!isValidTimestampValue(value)) {
    throw new Error(`Invalid TIMESTAMP value: ${value}`);
  }

  const match = TIMESTAMP_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid TIMESTAMP value: ${value}`);
  }

  const year = match[1];
  const month = match[2];
  const day = match[3];
  const hour = match[4];
  const minute = match[5];
  const second = match[6];
  const fraction = match[7];
  const timezone = match[8];

  let result = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

  if (fraction !== undefined) {
    result += `.${fraction}`;
  }

  if (timezone !== undefined) {
    if (timezone === "Z") {
      result += "Z";
    } else {
      const normalizedTimezone = timezone.replace(
        /^([+-]\d{2})(\d{2})$/,
        "$1:$2",
      );

      result += normalizedTimezone;
    }
  }

  return result;
}
