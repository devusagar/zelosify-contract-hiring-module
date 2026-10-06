// Deterministic Matching & Scoring Engine

export const calculateDeterministicScore = (
  candidateExp: number,
  minExp: number,
  maxExp: number | null,
  candidateSkills: string[],
  requiredSkills: string[],
  candidateLocation: string,
  jobLocation: string
) => {
  // 1. Experience Logic
  let experienceMatchScore = 0;
  if (candidateExp < minExp) {
    experienceMatchScore = 0;
  } else if (candidateExp >= minExp && (maxExp === null || candidateExp <= maxExp)) {
    experienceMatchScore = 1;
  } else if (maxExp !== null && candidateExp > maxExp) {
    experienceMatchScore = 0.8;
  }

  // 2. Skill Match Logic
  const requiredLower = requiredSkills.map(s => s.trim().toLowerCase());
  const candidateLower = candidateSkills.map(s => s.trim().toLowerCase());
  const overlap = candidateLower.filter(skill => requiredLower.includes(skill)).length;
  const skillMatchScore = requiredLower.length > 0 ? (overlap / requiredLower.length) : 0;

  // 3. Location Match Logic
  let locationMatchScore = 0;
  const cLoc = candidateLocation.trim().toLowerCase();
  const jLoc = jobLocation?.trim().toLowerCase() || "";
  
  if (cLoc === 'remote' || jLoc === 'remote') {
    locationMatchScore = 1; // Remote match
  } else if (cLoc === jLoc) {
    locationMatchScore = 1; // Exact match
  } else {
    locationMatchScore = 0.5; // Onsite mismatch
  }

  // 4. Final Score Formula (MANDATORY)
  const finalScore = (0.5 * skillMatchScore) + (0.3 * experienceMatchScore) + (0.2 * locationMatchScore);

  return {
    skillMatchScore,
    experienceMatchScore,
    locationMatchScore,
    finalScore
  };
};