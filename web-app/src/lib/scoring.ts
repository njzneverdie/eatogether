export const RANK_WEIGHTS: Record<1 | 2 | 3, number> = {
  1: 3,
  2: 2,
  3: 1,
}

export function calcScore(votes: Array<{ rank: 1 | 2 | 3 }>): number {
  return votes.reduce((sum, v) => sum + RANK_WEIGHTS[v.rank], 0)
}
