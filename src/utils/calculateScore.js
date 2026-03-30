export const calculateScore = (hoursWorked, mood) => {
  const moodWeights = {
    great: 1.2,
    good: 1.0,
    okay: 0.8,
    struggling: 0.6
  }

  const weight = moodWeights[mood] || 1.0;
  
  // Base score: 8 hours = 10 points
  const baseScore = (hoursWorked / 8) * 10;
  const rawScore = baseScore * weight;
  
  // Cap at 10.0 and round to 1 decimal place
  const finalScore = Math.min(10, Math.round(rawScore * 10) / 10);
  
  return finalScore;
}
