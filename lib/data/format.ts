export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function firstParagraph(value: string | null | undefined, fallback = "No details yet."): string {
  const text = value?.trim();

  if (!text) {
    return fallback;
  }

  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}
