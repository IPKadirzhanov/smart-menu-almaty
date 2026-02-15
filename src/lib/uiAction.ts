export interface UIActionPayload {
  action: string;
  [key: string]: any;
}

export function extractUIAction(text: string): UIActionPayload | null {
  const regex = /<UI_ACTION>([\s\S]*?)<\/UI_ACTION>/;
  const match = text.match(regex);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}
