// utils/tournaments.js

// Calcula edad para poder usarla en otros lados si quieres
export function getAgeFromDob(dob) {
  if (!dob) return null;
  const t = Date.parse(dob);
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function computeWithRules(player, rules) {
  // Puntos manuales desde matchHistory (points) + manualPoints acumulado
  const fromEvents = (player.matchHistory || []).reduce(
    (sum, m) => sum + (m.points || 0),
    0
  );

  const manualPoints =
    typeof player.manualPoints === "number"
      ? player.manualPoints
      : fromEvents;

  // Extra por win/loss (si quieres usarlo)
  const wins = player.wins || 0;
  const losses = player.losses || 0;
  const basePoints =
    wins * (rules?.winPoints ?? 0) +
    losses * (rules?.lossPoints ?? 0);

  const totalMatches = (player.matchHistory || []).length;
  const winPct = totalMatches
    ? Math.round((wins / totalMatches) * 1000) / 10
    : 0;

  const points = manualPoints + basePoints;

  return {
    ...player,
    points,
    tournamentPoints: manualPoints,
    basePoints,
    winPct,
    total: totalMatches,
  };
}
