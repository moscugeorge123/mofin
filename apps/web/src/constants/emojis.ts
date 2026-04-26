import emojiData from "unicode-emoji-json/data-by-emoji.json"

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

export const AVAILABLE_EMOJIS = Object.entries(
  emojiData as Record<string, { name: string; skin_tone_support: boolean }>
)
  .filter(([, data]) => !data.name.includes("skin tone"))
  .map(([emoji, data]) => ({
    emoji,
    name: toTitleCase(data.name),
  }))
