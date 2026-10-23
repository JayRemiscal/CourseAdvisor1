/**
 * ============================================================================
 * MAMDANI FUZZY INFERENCE SYSTEM (FIS) FOR ACADEMIC WORKLOAD ASSESSMENT
 * ============================================================================
 * 
 * Mathematical Formulation:
 * -------------------------
 * This module implements a standard Mamdani-type Fuzzy Inference System using
 * deterministic calculations. It evaluates estimated academic workload stress
 * based on two input variables:
 *   1. Student Confidence (c in [1, 10])
 *   2. Course Difficulty   (d in [1, 10])
 * 
 * And produces a crisp output:
 *   Stress Index (s in [0, 100])
 * 
 * Inference Steps:
 *   1. Fuzzification (Triangular and Trapezoidal membership functions)
 *   2. Rule Evaluation (Mamdani Min operator for fuzzy AND)
 *   3. Aggregation (Max operator across rule consequents)
 *   4. Defuzzification (Centroid Method / Center of Gravity - COG)
 * 
 * Institutional & Advisory Disclaimer:
 * ------------------------------------
 * This system models projected academic curriculum workload for semester course
 * scheduling and planning. It does NOT claim to assess medical, clinical, or
 * psychiatric states.
 */

// ============================================================================
// 1. DATA TYPES & INTERFACES
// ============================================================================

export type LinguisticTerm = 'Low' | 'Medium' | 'High';

export interface MembershipDegrees {
  low: number;
  medium: number;
  high: number;
}

export interface FuzzyRule {
  id: number;
  antecedentConfidence: LinguisticTerm;
  antecedentDifficulty: LinguisticTerm;
  consequentStress: LinguisticTerm;
  weight: number; // Rule firing strength alpha_i
  description: string;
}

export interface FuzzificationResult {
  confidence: {
    crisp: number;
    memberships: MembershipDegrees;
  };
  difficulty: {
    crisp: number;
    memberships: MembershipDegrees;
  };
}

export interface DiscretizedPoint {
  x: number;      // Universe value (0 to 100)
  mu: number;     // Aggregated membership degree [0, 1]
}

export interface AggregationResult {
  points: DiscretizedPoint[];
  maxAlpha: number;
  activeRulesCount: number;
  hasActivation: boolean;
}

export interface MamdaniWorkloadAssessment {
  inputs: {
    confidence: number;
    difficulty: number;
    confidenceLabel: string;
    difficultyLabel: string;
    isSampleConfidence: boolean;
  };
  fuzzification: FuzzificationResult;
  firedRules: Array<{
    ruleId: number;
    ruleText: string;
    firingStrength: number;
    consequent: LinguisticTerm;
  }>;
  aggregation: {
    hasActivation: boolean;
    maxMembership: number;
    activeRuleCount: number;
  };
  defuzzification: {
    crispScore: number;            // 0 to 100
    method: 'Centroid (COG)';
    numerator: number;             // sum(x * mu)
    denominator: number;           // sum(mu)
    hasCalculationError: boolean;
    errorMessage?: string;
  };
  interpretation: {
    category: 'Low Workload Stress' | 'Moderate Workload Stress' | 'High Workload Stress';
    categoryShort: 'Low' | 'Moderate' | 'High';
    colorCode: string;             // emerald, amber, rose
    summary: string;
    influencingFactors: string[];
  };
}

export interface CourseWorkloadEntry {
  courseCode: string;
  courseTitle: string;
  credits: number;
  difficulty: number;              // 1 to 10
  confidence: number;              // 1 to 10
  isSampleConfidence: boolean;
  assessment: MamdaniWorkloadAssessment;
  weightedContribution: number;    // credits * stressScore
}

export interface SemesterWorkloadAssessment {
  semesterId: string;
  semesterName: string;
  totalCredits: number;
  courseCount: number;
  creditLoadStatus: 'Underload' | 'Recommended' | 'Overload';
  creditLoadGuidelineMessage: string;
  creditLoadMultiplier: number;    // gamma(L)
  rawWeightedStressMean: number;   // sum(w_i * S_i) / sum(w_i)
  finalSemesterStressScore: number;// min(100, round(rawMean * gamma))
  semesterWorkloadCategory: 'Low' | 'Moderate' | 'High';
  colorCode: string;
  courseEntries: CourseWorkloadEntry[];
  topStressDrivers: CourseWorkloadEntry[];
  advisoryRecommendations: string[];
  aggregationMethodDoc: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  confidence: number;
  difficulty: number;
  expectedBehavior: string;
  actualScore: number;
  actualCategory: string;
  hasError: boolean;
  passed: boolean;
  details: string;
}

// ============================================================================
// 2. MEMBERSHIP FUNCTION PARAMETERS (DOCUMENTED & REPRODUCIBLE)
// ============================================================================

/**
 * Parameter sets for Input 1: Student Confidence (Universe: [1, 10])
 * - Low: Trapezoidal [1, 1, 3.0, 5.0]
 * - Medium: Triangular [3.0, 5.5, 8.0]
 * - High: Trapezoidal [6.0, 8.0, 10.0, 10.0]
 */
export const CONFIDENCE_MF_PARAMS = {
  low: { a: 1.0, b: 1.0, c: 3.0, d: 5.0 },
  medium: { a: 3.0, b: 5.5, c: 8.0 },
  high: { a: 6.0, b: 8.0, c: 10.0, d: 10.0 },
} as const;

/**
 * Parameter sets for Input 2: Course Difficulty (Universe: [1, 10])
 * - Low: Trapezoidal [1, 1, 3.0, 5.0]
 * - Medium: Triangular [3.0, 5.5, 8.0]
 * - High: Trapezoidal [6.0, 8.0, 10.0, 10.0]
 */
export const DIFFICULTY_MF_PARAMS = {
  low: { a: 1.0, b: 1.0, c: 3.0, d: 5.0 },
  medium: { a: 3.0, b: 5.5, c: 8.0 },
  high: { a: 6.0, b: 8.0, c: 10.0, d: 10.0 },
} as const;

/**
 * Parameter sets for Output: Stress Index (Universe: [0, 100])
 * - Low: Trapezoidal [0, 0, 20.0, 45.0]
 * - Medium: Triangular [30.0, 50.0, 70.0]
 * - High: Trapezoidal [55.0, 80.0, 100.0, 100.0]
 */
export const STRESS_MF_PARAMS = {
  low: { a: 0.0, b: 0.0, c: 20.0, d: 45.0 },
  medium: { a: 30.0, b: 50.0, c: 70.0 },
  high: { a: 55.0, b: 80.0, c: 100.0, d: 100.0 },
} as const;

// ============================================================================
// 3. CORE FUZZY MATH PRIMITIVES
// ============================================================================

/**
 * Trapezoidal Membership Function: trapmf(x, [a, b, c, d])
 * Correctly handles shoulder boundaries (a===b for left shoulder, c===d for right shoulder).
 */
export function trapmf(x: number, a: number, b: number, c: number, d: number): number {
  // Left shoulder: when a === b, any value <= b has full membership 1.0
  if (a === b && x <= b) return 1.0;
  // Right shoulder: when c === d, any value >= c has full membership 1.0
  if (c === d && x >= c) return 1.0;

  if (x < a || x > d) return 0.0;
  if (x >= b && x <= c) return 1.0;
  if (x >= a && x < b) {
    return b === a ? 1.0 : (x - a) / (b - a);
  }
  if (x > c && x <= d) {
    return d === c ? 1.0 : (d - x) / (d - c);
  }
  return 0.0;
}

/**
 * Triangular Membership Function: trimf(x, [a, b, c])
 */
export function trimf(x: number, a: number, b: number, c: number): number {
  if (x < a || x > c) return 0.0;
  if (x === b) return 1.0;
  if (x >= a && x < b) {
    return b === a ? 1.0 : (x - a) / (b - a);
  }
  if (x > b && x <= c) {
    return c === b ? 1.0 : (c - x) / (c - b);
  }
  return 0.0;
}

// ============================================================================
// 4. FUZZIFICATION
// ============================================================================

/**
 * Computes membership degrees for Student Confidence x in [1, 10].
 */
export function fuzzifyConfidence(c: number): MembershipDegrees {
  // Bound to universe
  const clamped = Math.max(1.0, Math.min(10.0, c));
  return {
    low: trapmf(clamped, CONFIDENCE_MF_PARAMS.low.a, CONFIDENCE_MF_PARAMS.low.b, CONFIDENCE_MF_PARAMS.low.c, CONFIDENCE_MF_PARAMS.low.d),
    medium: trimf(clamped, CONFIDENCE_MF_PARAMS.medium.a, CONFIDENCE_MF_PARAMS.medium.b, CONFIDENCE_MF_PARAMS.medium.c),
    high: trapmf(clamped, CONFIDENCE_MF_PARAMS.high.a, CONFIDENCE_MF_PARAMS.high.b, CONFIDENCE_MF_PARAMS.high.c, CONFIDENCE_MF_PARAMS.high.d),
  };
}

/**
 * Computes membership degrees for Course Difficulty d in [1, 10].
 */
export function fuzzifyDifficulty(d: number): MembershipDegrees {
  const clamped = Math.max(1.0, Math.min(10.0, d));
  return {
    low: trapmf(clamped, DIFFICULTY_MF_PARAMS.low.a, DIFFICULTY_MF_PARAMS.low.b, DIFFICULTY_MF_PARAMS.low.c, DIFFICULTY_MF_PARAMS.low.d),
    medium: trimf(clamped, DIFFICULTY_MF_PARAMS.medium.a, DIFFICULTY_MF_PARAMS.medium.b, DIFFICULTY_MF_PARAMS.medium.c),
    high: trapmf(clamped, DIFFICULTY_MF_PARAMS.high.a, DIFFICULTY_MF_PARAMS.high.b, DIFFICULTY_MF_PARAMS.high.c, DIFFICULTY_MF_PARAMS.high.d),
  };
}

/**
 * Evaluates membership of a stress output value s in [0, 100] for a given linguistic term.
 */
export function getStressMembership(s: number, term: LinguisticTerm): number {
  if (term === 'Low') {
    return trapmf(s, STRESS_MF_PARAMS.low.a, STRESS_MF_PARAMS.low.b, STRESS_MF_PARAMS.low.c, STRESS_MF_PARAMS.low.d);
  }
  if (term === 'Medium') {
    return trimf(s, STRESS_MF_PARAMS.medium.a, STRESS_MF_PARAMS.medium.b, STRESS_MF_PARAMS.medium.c);
  }
  if (term === 'High') {
    return trapmf(s, STRESS_MF_PARAMS.high.a, STRESS_MF_PARAMS.high.b, STRESS_MF_PARAMS.high.c, STRESS_MF_PARAMS.high.d);
  }
  return 0.0;
}

// ============================================================================
// 5. RULE BASE & RULE EVALUATION
// ============================================================================

/**
 * Standard 9-Rule Mamdani Matrix:
 * 
 * | Confidence \ Difficulty | Low Difficulty | Medium Difficulty | High Difficulty |
 * |-------------------------|----------------|-------------------|-----------------|
 * | Low Confidence          | Medium Stress  | High Stress       | High Stress     |
 * | Medium Confidence       | Low Stress     | Medium Stress     | High Stress     |
 * | High Confidence         | Low Stress     | Low Stress        | Medium Stress   |
 */
export const FUZZY_RULE_BASE: Array<{
  id: number;
  confidence: LinguisticTerm;
  difficulty: LinguisticTerm;
  consequent: LinguisticTerm;
  ruleText: string;
}> = [
  { id: 1, confidence: 'Low', difficulty: 'Low', consequent: 'Medium', ruleText: 'IF Confidence is Low AND Difficulty is Low THEN Stress is Medium' },
  { id: 2, confidence: 'Low', difficulty: 'Medium', consequent: 'High', ruleText: 'IF Confidence is Low AND Difficulty is Medium THEN Stress is High' },
  { id: 3, confidence: 'Low', difficulty: 'High', consequent: 'High', ruleText: 'IF Confidence is Low AND Difficulty is High THEN Stress is High' },
  { id: 4, confidence: 'Medium', difficulty: 'Low', consequent: 'Low', ruleText: 'IF Confidence is Medium AND Difficulty is Low THEN Stress is Low' },
  { id: 5, confidence: 'Medium', difficulty: 'Medium', consequent: 'Medium', ruleText: 'IF Confidence is Medium AND Difficulty is Medium THEN Stress is Medium' },
  { id: 6, confidence: 'Medium', difficulty: 'High', consequent: 'High', ruleText: 'IF Confidence is Medium AND Difficulty is High THEN Stress is High' },
  { id: 7, confidence: 'High', difficulty: 'Low', consequent: 'Low', ruleText: 'IF Confidence is High AND Difficulty is Low THEN Stress is Low' },
  { id: 8, confidence: 'High', difficulty: 'Medium', consequent: 'Low', ruleText: 'IF Confidence is High AND Difficulty is Medium THEN Stress is Low' },
  { id: 9, confidence: 'High', difficulty: 'High', consequent: 'Medium', ruleText: 'IF Confidence is High AND Difficulty is High THEN Stress is Medium' },
];

/**
 * Evaluates all rules using Mamdani min operator:
 * alpha_i = min(mu_Confidence(c), mu_Difficulty(d))
 */
export function evaluateFuzzyRules(
  confMF: MembershipDegrees,
  diffMF: MembershipDegrees
): Array<{
  ruleId: number;
  ruleText: string;
  firingStrength: number;
  consequent: LinguisticTerm;
}> {
  return FUZZY_RULE_BASE.map(rule => {
    const muC = rule.confidence === 'Low' ? confMF.low : rule.confidence === 'Medium' ? confMF.medium : confMF.high;
    const muD = rule.difficulty === 'Low' ? diffMF.low : rule.difficulty === 'Medium' ? diffMF.medium : diffMF.high;
    const alpha = Math.min(muC, muD);
    return {
      ruleId: rule.id,
      ruleText: rule.ruleText,
      firingStrength: alpha,
      consequent: rule.consequent,
    };
  });
}

// ============================================================================
// 6. AGGREGATION & DEFUZZIFICATION
// ============================================================================

/**
 * Aggregates all fired rules across the discretized universe [0, 100] using MAX operator.
 * Discretization step: 0.5 (201 evaluation points for high numerical precision).
 */
export function aggregateRuleOutputs(
  firedRules: Array<{ firingStrength: number; consequent: LinguisticTerm }>
): AggregationResult {
  const points: DiscretizedPoint[] = [];
  const activeFiredRules = firedRules.filter(r => r.firingStrength > 0.00001);
  const maxAlpha = activeFiredRules.length > 0 
    ? Math.max(...activeFiredRules.map(r => r.firingStrength)) 
    : 0.0;

  let hasActivation = false;

  // Discretize universe s in [0, 100] with step 0.5
  for (let s = 0; s <= 100; s += 0.5) {
    let aggregatedMu = 0.0;

    for (const rule of activeFiredRules) {
      // Mamdani min implication for this rule: min(alpha_i, mu_consequent(s))
      const impliedMu = Math.min(rule.firingStrength, getStressMembership(s, rule.consequent));
      if (impliedMu > aggregatedMu) {
        aggregatedMu = impliedMu;
      }
    }

    if (aggregatedMu > 0.00001) {
      hasActivation = true;
    }

    points.push({ x: s, mu: aggregatedMu });
  }

  return {
    points,
    maxAlpha,
    activeRulesCount: activeFiredRules.length,
    hasActivation,
  };
}

/**
 * Centroid Defuzzification (Center of Gravity - COG):
 * y* = sum(x_i * mu(x_i)) / sum(mu(x_i))
 * 
 * Includes explicit division-by-zero protection.
 */
export function defuzzifyCentroid(aggregation: AggregationResult): {
  crispScore: number;
  numerator: number;
  denominator: number;
  hasCalculationError: boolean;
  errorMessage?: string;
} {
  if (!aggregation.hasActivation) {
    return {
      crispScore: 0,
      numerator: 0,
      denominator: 0,
      hasCalculationError: true,
      errorMessage: 'No fuzzy rule activated: zero membership across output universe. Defuzzification undefined (division by zero prevented).',
    };
  }

  let numerator = 0.0;
  let denominator = 0.0;

  for (const pt of aggregation.points) {
    numerator += pt.x * pt.mu;
    denominator += pt.mu;
  }

  if (denominator <= 0.0000001) {
    return {
      crispScore: 0,
      numerator,
      denominator,
      hasCalculationError: true,
      errorMessage: 'Division by zero error prevented during Centroid defuzzification (sum of aggregated memberships is 0).',
    };
  }

  const crisp = Number((numerator / denominator).toFixed(1));
  const boundedScore = Math.max(0.0, Math.min(100.0, crisp));

  return {
    crispScore: boundedScore,
    numerator: Number(numerator.toFixed(2)),
    denominator: Number(denominator.toFixed(2)),
    hasCalculationError: false,
  };
}

// ============================================================================
// 7. COMPREHENSIVE COURSE-LEVEL EVALUATION
// ============================================================================

/**
 * Full Mamdani evaluation pipeline for single course.
 */
export function evaluateMamdaniFIS(
  confidence: number,
  difficulty: number,
  options?: { isSampleConfidence?: boolean }
): MamdaniWorkloadAssessment {
  const isSampleConfidence = options?.isSampleConfidence ?? false;

  // 1. Fuzzification
  const confMF = fuzzifyConfidence(confidence);
  const diffMF = fuzzifyDifficulty(difficulty);

  const fuzzification: FuzzificationResult = {
    confidence: {
      crisp: confidence,
      memberships: confMF,
    },
    difficulty: {
      crisp: difficulty,
      memberships: diffMF,
    },
  };

  // 2. Rule evaluation
  const firedRules = evaluateFuzzyRules(confMF, diffMF);

  // 3. Aggregation
  const aggregation = aggregateRuleOutputs(firedRules);

  // 4. Defuzzification
  const defuzzification = defuzzifyCentroid(aggregation);

  // 5. Textual Interpretation & Explanations
  const crisp = defuzzification.crispScore;
  let category: 'Low Workload Stress' | 'Moderate Workload Stress' | 'High Workload Stress';
  let categoryShort: 'Low' | 'Moderate' | 'High';
  let colorCode: string;

  if (crisp <= 35.0) {
    category = 'Low Workload Stress';
    categoryShort = 'Low';
    colorCode = 'emerald';
  } else if (crisp <= 65.0) {
    category = 'Moderate Workload Stress';
    categoryShort = 'Moderate';
    colorCode = 'amber';
  } else {
    category = 'High Workload Stress';
    categoryShort = 'High';
    colorCode = 'rose';
  }

  // Generate plain, factual explanation of factors
  const factors: string[] = [];

  if (difficulty >= 7.5) {
    factors.push(`Rigorous technical course difficulty rating (${difficulty}/10) increases academic commitment.`);
  } else if (difficulty <= 4.0) {
    factors.push(`Introductory or foundational difficulty rating (${difficulty}/10) moderates curriculum demand.`);
  } else {
    factors.push(`Intermediate course difficulty (${difficulty}/10) provides standard academic pacing.`);
  }

  if (confidence <= 3.5) {
    factors.push(`Low student confidence rating (${confidence}/10) indicates a need for extra preparation and tutoring.`);
  } else if (confidence >= 7.5) {
    factors.push(`Strong student confidence rating (${confidence}/10) significantly mitigates estimated study strain.`);
  } else {
    factors.push(`Moderate student confidence (${confidence}/10) matches standard course progression.`);
  }

  let summary = '';
  if (categoryShort === 'High') {
    summary = `High projected workload stress (${crisp}/100). The combination of elevated course rigor and lower student familiarity requires careful time allocation.`;
  } else if (categoryShort === 'Moderate') {
    summary = `Moderate projected workload stress (${crisp}/100). The academic demand is sustainable when paired with standard weekly study routines.`;
  } else {
    summary = `Low projected workload stress (${crisp}/100). High confidence and manageable difficulty allow comfortable academic execution.`;
  }

  const confidenceLabel = confidence <= 3.5 ? 'Low' : confidence >= 7.0 ? 'High' : 'Medium';
  const difficultyLabel = difficulty <= 3.5 ? 'Low' : difficulty >= 7.0 ? 'High' : 'Medium';

  return {
    inputs: {
      confidence,
      difficulty,
      confidenceLabel,
      difficultyLabel,
      isSampleConfidence,
    },
    fuzzification,
    firedRules: firedRules.map(r => ({
      ...r,
      firingStrength: Number(r.firingStrength.toFixed(3)),
    })),
    aggregation: {
      hasActivation: aggregation.hasActivation,
      maxMembership: Number(aggregation.maxAlpha.toFixed(3)),
      activeRuleCount: aggregation.activeRulesCount,
    },
    defuzzification: {
      ...defuzzification,
      method: 'Centroid (COG)',
    },
    interpretation: {
      category,
      categoryShort,
      colorCode,
      summary,
      influencingFactors: factors,
    },
  };
}

// ============================================================================
// 8. SEMESTER-LEVEL WORKLOAD AGGREGATION & CREDIT LOAD ASSESSMENT
// ============================================================================

/**
 * Calculates a semester-level workload assessment using credit-weighted fuzzy
 * outputs and continuous credit load scaling factors.
 * 
 * Aggregation Formula:
 * --------------------
 * 1. Weighted Mean Course Stress:
 *    S_mean = sum(credits_i * Stress_i) / sum(credits_i)
 * 
 * 2. Credit Load Multiplier gamma(L) for total units L:
 *    - Recommended range: 12 to 18 units (benchmark L_base = 15)
 *    - L < 12: gamma = 0.85 + 0.15 * (L / 12)  [underload scaling]
 *    - 12 <= L <= 18: gamma = 1.0 + 0.10 * ((L - 15) / 3)  [balanced range: 0.90 to 1.10]
 *    - L > 18: gamma = 1.10 + 0.20 * min(1.0, (L - 18) / 6)  [overload multiplier up to 1.30]
 * 
 * 3. Final Semester Stress:
 *    S_semester = min(100, max(0, round(S_mean * gamma(L))))
 */
export function evaluateSemesterFuzzyWorkload(
  semesterId: string,
  semesterName: string,
  courses: Array<{
    code: string;
    title: string;
    credits: number;
    difficulty: number;
    confidence?: number;
    isSampleConfidence?: boolean;
  }>
): SemesterWorkloadAssessment {
  if (courses.length === 0) {
    return {
      semesterId,
      semesterName,
      totalCredits: 0,
      courseCount: 0,
      creditLoadStatus: 'Underload',
      creditLoadGuidelineMessage: 'No courses registered in this semester.',
      creditLoadMultiplier: 1.0,
      rawWeightedStressMean: 0,
      finalSemesterStressScore: 0,
      semesterWorkloadCategory: 'Low',
      colorCode: 'emerald',
      courseEntries: [],
      topStressDrivers: [],
      advisoryRecommendations: ['Register courses for this semester to view academic workload analytics.'],
      aggregationMethodDoc: 'Credit-weighted Mamdani Centroid aggregation with credit-load volume scaling.',
    };
  }

  // Evaluate each course using Mamdani FIS
  const courseEntries: CourseWorkloadEntry[] = courses.map(c => {
    const confVal = c.confidence !== undefined ? c.confidence : 6.0; // Default sample confidence
    const isSample = c.isSampleConfidence ?? (c.confidence === undefined);
    const assessment = evaluateMamdaniFIS(confVal, c.difficulty, { isSampleConfidence: isSample });
    const weightedContribution = c.credits * assessment.defuzzification.crispScore;

    return {
      courseCode: c.code,
      courseTitle: c.title,
      credits: c.credits,
      difficulty: c.difficulty,
      confidence: confVal,
      isSampleConfidence: isSample,
      assessment,
      weightedContribution,
    };
  });

  const totalCredits = courseEntries.reduce((acc, c) => acc + c.credits, 0);
  const totalWeightedStressSum = courseEntries.reduce((acc, c) => acc + c.weightedContribution, 0);
  const rawWeightedStressMean = totalCredits > 0 ? totalWeightedStressSum / totalCredits : 0;

  // Credit load multiplier calculation
  let creditLoadMultiplier = 1.0;
  let creditLoadStatus: 'Underload' | 'Recommended' | 'Overload' = 'Recommended';
  let creditLoadGuidelineMessage = '';

  if (totalCredits < 12) {
    creditLoadStatus = 'Underload';
    // Scaling reduction for light terms (between 0.85 and 1.0)
    creditLoadMultiplier = Number((0.85 + 0.15 * (Math.max(1, totalCredits) / 12)).toFixed(3));
    creditLoadGuidelineMessage = `Part-time schedule (${totalCredits} units). The institutional guideline recommends 12–18 units. Verify if 12 units are required for financial aid, honors, or housing standing.`;
  } else if (totalCredits <= 18) {
    creditLoadStatus = 'Recommended';
    // Normal collegiate load centered around 15 credits (between 0.90 and 1.10)
    creditLoadMultiplier = Number((1.0 + 0.10 * ((totalCredits - 15) / 3)).toFixed(3));
    creditLoadGuidelineMessage = `Optimal credit load (${totalCredits} units). Conforms with the standard 12–18 unit guideline for healthy academic progression.`;
  } else {
    creditLoadStatus = 'Overload';
    // Overload penalty scaling up to 1.30
    const excessUnits = totalCredits - 18;
    creditLoadMultiplier = Number((1.10 + 0.20 * Math.min(1.0, excessUnits / 6)).toFixed(3));
    creditLoadGuidelineMessage = `Heavy credit overload (${totalCredits} units). Exceeds the standard 18-unit guideline. Overloading requires high study stamina and may require departmental permission.`;
  }

  // Final adjusted semester stress
  const finalSemesterStressScore = Math.min(100, Math.max(0, Math.round(rawWeightedStressMean * creditLoadMultiplier)));

  let semesterWorkloadCategory: 'Low' | 'Moderate' | 'High' = 'Moderate';
  let colorCode = 'amber';

  if (finalSemesterStressScore <= 35) {
    semesterWorkloadCategory = 'Low';
    colorCode = 'emerald';
  } else if (finalSemesterStressScore <= 65) {
    semesterWorkloadCategory = 'Moderate';
    colorCode = 'amber';
  } else {
    semesterWorkloadCategory = 'High';
    colorCode = 'rose';
  }

  // Identify top workload drivers (sorted by absolute weighted impact: credits * stress)
  const topStressDrivers = [...courseEntries].sort((a, b) => b.weightedContribution - a.weightedContribution).slice(0, 3);

  // Formulate actionable recommendations
  const advisoryRecommendations: string[] = [];

  if (creditLoadStatus === 'Overload') {
    advisoryRecommendations.push(`Consider deferring 1 elective or Gen-Ed to an upcoming summer term to reduce term load from ${totalCredits} to <= 18 units.`);
  } else if (creditLoadStatus === 'Underload' && totalCredits > 0) {
    advisoryRecommendations.push(`Schedule is light (${totalCredits} units). If degree timeline allows, this provides space for extracurriculars, research, or work.`);
  }

  if (topStressDrivers.length > 0 && topStressDrivers[0].assessment.defuzzification.crispScore >= 70) {
    advisoryRecommendations.push(`Primary stress driver: ${topStressDrivers[0].courseCode} (${topStressDrivers[0].courseTitle}) with stress index ${topStressDrivers[0].assessment.defuzzification.crispScore}/100. Form early study groups.`);
  }

  const sampleCount = courseEntries.filter(c => c.isSampleConfidence).length;
  if (sampleCount > 0) {
    advisoryRecommendations.push(`${sampleCount} course(s) currently use default sample confidence (6.0/10). Customize your personal confidence ratings for a personalized assessment.`);
  }

  const aggregationMethodDoc = `Calculated as the credit-weighted average of Mamdani centroid outputs (raw mean: ${rawWeightedStressMean.toFixed(1)}/100), scaled by the credit volume multiplier (${creditLoadMultiplier}x) based on total enrollment (${totalCredits} units against the 12–18 guideline).`;

  return {
    semesterId,
    semesterName,
    totalCredits,
    courseCount: courses.length,
    creditLoadStatus,
    creditLoadGuidelineMessage,
    creditLoadMultiplier,
    rawWeightedStressMean: Number(rawWeightedStressMean.toFixed(1)),
    finalSemesterStressScore,
    semesterWorkloadCategory,
    colorCode,
    courseEntries,
    topStressDrivers,
    advisoryRecommendations,
    aggregationMethodDoc,
  };
}

// ============================================================================
// 9. AUTOMATED VERIFICATION & TEST SUITE
// ============================================================================

/**
 * Runs the comprehensive verification test suite required by the project specification:
 * - Confidence = 1 and difficulty = 10 (Maximum Stress condition)
 * - Confidence = 10 and difficulty = 1 (Minimum Stress condition)
 * - Confidence = 5 and difficulty = 5 (Balanced Intermediate condition)
 * - Boundary values (1.0, 10.0)
 * - Intermediate input values (e.g. 3.5, 7.2)
 * - Multi-membership overlap activation
 * - Edge cases and zero-activation protection
 * - Division-by-zero defuzzification handling
 */
export function runMamdaniDiagnosticTests(): TestCaseResult[] {
  const tests: TestCaseResult[] = [];

  // Test 1: Confidence = 1, Difficulty = 10 (Maximum stress condition)
  {
    const res = evaluateMamdaniFIS(1.0, 10.0);
    const passed = res.defuzzification.crispScore >= 75.0 && !res.defuzzification.hasCalculationError && res.interpretation.categoryShort === 'High';
    tests.push({
      id: 'test-1-max-stress',
      name: 'High Stress Benchmark (Confidence=1, Difficulty=10)',
      confidence: 1.0,
      difficulty: 10.0,
      expectedBehavior: 'Extreme stress condition: Crisp score >= 75/100 with High Workload category',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `Calculated COG centroid: ${res.defuzzification.crispScore}/100. Fired rule #3 (Low Conf + High Diff -> High Stress) with strength ${res.firedRules.find(r => r.ruleId === 3)?.firingStrength}.`,
    });
  }

  // Test 2: Confidence = 10, Difficulty = 1 (Minimum stress condition)
  {
    const res = evaluateMamdaniFIS(10.0, 1.0);
    const passed = res.defuzzification.crispScore <= 30.0 && !res.defuzzification.hasCalculationError && res.interpretation.categoryShort === 'Low';
    tests.push({
      id: 'test-2-min-stress',
      name: 'Low Stress Benchmark (Confidence=10, Difficulty=1)',
      confidence: 10.0,
      difficulty: 1.0,
      expectedBehavior: 'Minimum stress condition: Crisp score <= 30/100 with Low Workload category',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `Calculated COG centroid: ${res.defuzzification.crispScore}/100. Fired rule #7 (High Conf + Low Diff -> Low Stress) with strength ${res.firedRules.find(r => r.ruleId === 7)?.firingStrength}.`,
    });
  }

  // Test 3: Confidence = 5, Difficulty = 5 (Balanced Intermediate condition)
  {
    const res = evaluateMamdaniFIS(5.0, 5.0);
    const passed = res.defuzzification.crispScore >= 40.0 && res.defuzzification.crispScore <= 60.0 && !res.defuzzification.hasCalculationError && res.interpretation.categoryShort === 'Moderate';
    tests.push({
      id: 'test-3-balanced',
      name: 'Balanced Intermediate Benchmark (Confidence=5, Difficulty=5)',
      confidence: 5.0,
      difficulty: 5.0,
      expectedBehavior: 'Intermediate outcome: Crisp score between 40 and 60 with Moderate Workload',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `Calculated COG centroid: ${res.defuzzification.crispScore}/100. Rule #5 (Med Conf + Med Diff -> Med Stress) fired with strength ${res.firedRules.find(r => r.ruleId === 5)?.firingStrength}.`,
    });
  }

  // Test 4: Boundary Values: Confidence = 1, Difficulty = 1
  {
    const res = evaluateMamdaniFIS(1.0, 1.0);
    const passed = !res.defuzzification.hasCalculationError && res.defuzzification.crispScore > 0;
    tests.push({
      id: 'test-4-boundary-low-low',
      name: 'Boundary Value Test (Confidence=1, Difficulty=1)',
      confidence: 1.0,
      difficulty: 1.0,
      expectedBehavior: 'Low confidence + Low difficulty fires Rule #1 -> Medium Stress outcome',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `Calculated COG: ${res.defuzzification.crispScore}/100. Rule #1 fired with strength 1.0.`,
    });
  }

  // Test 5: Boundary Values: Confidence = 10, Difficulty = 10
  {
    const res = evaluateMamdaniFIS(10.0, 10.0);
    const passed = !res.defuzzification.hasCalculationError && res.defuzzification.crispScore > 0;
    tests.push({
      id: 'test-5-boundary-high-high',
      name: 'Boundary Value Test (Confidence=10, Difficulty=10)',
      confidence: 10.0,
      difficulty: 10.0,
      expectedBehavior: 'High confidence + High difficulty fires Rule #9 -> Medium Stress outcome',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `Calculated COG: ${res.defuzzification.crispScore}/100. Rule #9 fired with strength 1.0.`,
    });
  }

  // Test 6: Multi-Membership Overlap: Confidence = 4.2, Difficulty = 6.8
  {
    const res = evaluateMamdaniFIS(4.2, 6.8);
    // At c=4.2, both Low and Medium confidence are active!
    // At d=6.8, both Medium and High difficulty are active!
    const activeRuleCount = res.firedRules.filter(r => r.firingStrength > 0).length;
    const passed = activeRuleCount >= 2 && !res.defuzzification.hasCalculationError;
    tests.push({
      id: 'test-6-multi-overlap',
      name: 'Multi-Membership Overlap Test (Confidence=4.2, Difficulty=6.8)',
      confidence: 4.2,
      difficulty: 6.8,
      expectedBehavior: 'Simultaneous activation of multiple fuzzy rules without calculation anomalies',
      actualScore: res.defuzzification.crispScore,
      actualCategory: res.interpretation.categoryShort,
      hasError: res.defuzzification.hasCalculationError,
      passed,
      details: `${activeRuleCount} concurrent fuzzy rules activated smoothly. Defuzzified centroid: ${res.defuzzification.crispScore}/100.`,
    });
  }

  // Test 7: Division-by-Zero Protection Test
  {
    // Test pure defuzzification with empty aggregation
    const emptyAgg: AggregationResult = {
      points: [{ x: 0, mu: 0 }, { x: 50, mu: 0 }, { x: 100, mu: 0 }],
      maxAlpha: 0,
      activeRulesCount: 0,
      hasActivation: false,
    };
    const defuzz = defuzzifyCentroid(emptyAgg);
    const passed = defuzz.hasCalculationError && defuzz.crispScore === 0 && defuzz.denominator === 0;
    tests.push({
      id: 'test-7-zero-div-protection',
      name: 'Zero-Activation & Division-by-Zero Protection',
      confidence: 0,
      difficulty: 0,
      expectedBehavior: 'Gracefully reports hasCalculationError: true, avoids NaN or crash, and preserves zero score',
      actualScore: defuzz.crispScore,
      actualCategory: 'None (Error Handled)',
      hasError: defuzz.hasCalculationError,
      passed,
      details: `Safely caught zero denominator. Error reported: "${defuzz.errorMessage}". System integrity preserved.`,
    });
  }

  return tests;
}

export const runMamdaniUnitTests = runMamdaniDiagnosticTests;
