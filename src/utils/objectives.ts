// Utility for normalizing campaign objective labels
const objectiveSynonyms: Record<string, string> = {
  "Interações": "Engajamento",
  "Engagement": "Engajamento",
  "Engajamento": "Engajamento", // canonical form
};

export function normalizeObjective(objective: string): string {
  return objectiveSynonyms[objective] || objective;
}

export function getDistinctObjectives(objectives: string[]): string[] {
  const normalized = objectives.map(normalizeObjective);
  return [...new Set(normalized)];
}