const emojiRegex = /[\p{Extended_Pictographic}]/gu;

export function sanitizeSpeechText(input: string): string {
  let text = input ?? "";

  // Strip fenced and inline code blocks
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]+`/g, " ");

  // Replace markdown links with the label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove markdown control characters and bullets
  text = text.replace(/[*_~>#`]/g, " ");

  // Remove stray HTML tags
  text = text.replace(/<\/?[^>]+>/g, " ");

  // Remove emojis / pictographs
  text = text.replace(emojiRegex, " ");

  // Collapse multiple whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text || " ";
}
