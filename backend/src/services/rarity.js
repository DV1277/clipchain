/**
 * Calculate combined rarity score from Gemini and TwelveLabs analyses.
 * Gemini provides a direct rarity estimate; TwelveLabs provides confidence
 * about what the event is. Gemini rarity is weighted higher.
 */
function calculateRarityScore(geminiAnalysis, twelvelabsAnalysis) {
  const geminiScore = geminiAnalysis?.rarity_score ?? 5;
  const geminiConfidence = geminiAnalysis?.confidence ?? 0.5;
  const twelvelabsConfidence = twelvelabsAnalysis?.confidence ?? 0.5;

  // Weighted combination: Gemini rarity 70%, TwelveLabs confidence 30%
  const score = geminiScore * 0.7 + twelvelabsConfidence * 10 * 0.3;
  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

/**
 * Calculate SOL bounty from rarity score.
 * Formula: SOL = rarity² × 0.025 × demand
 */
function calculateBounty(rarityScore, demandCoeff = 1.0) {
  return Math.round(rarityScore * rarityScore * 0.025 * demandCoeff * 100) / 100;
}

module.exports = { calculateRarityScore, calculateBounty };
