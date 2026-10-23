import { Course } from '../types/academic';
import { COURSE_BY_CODE_MAP, COURSES_DATA } from '../data/coursesData';

export type CourseStatusType = 'completed' | 'in-progress' | 'available' | 'blocked';

export interface PrerequisiteNode {
  code: string;
  course?: Course;
  status: CourseStatusType;
  depth: number;
  isCompleted: boolean;
  isInProgress: boolean;
  isMissingFromCatalog: boolean;
  children: PrerequisiteNode[]; // upstream prerequisites
  branchSatisfied: boolean;
}

export interface BackwardChainingResult {
  targetCode: string;
  targetCourse?: Course;
  targetStatus: CourseStatusType;
  isReady: boolean;
  allUpstreamCodes: string[];
  completedUpstreamCodes: string[];
  inProgressUpstreamCodes: string[];
  unmetPrereqCodes: string[];
  immediateNextSteps: string[]; // actionable prerequisites ready to take right now
  rootNode: PrerequisiteNode;
  maxChainDepth: number;
  explanation: {
    verdict: string;
    verdictType: 'ready' | 'in-progress' | 'completed' | 'blocked';
    directSummary: string;
    missingDirect: string[];
    missingUpstream: string[];
    actionableAdvice: string;
  };
}

export interface TopologicalSortResult {
  hasCycle: boolean;
  cycleNodes: string[];
  cyclePath: string[];
  errorMessage?: string;
  sortedCodes: string[];
  tiers: Array<{
    tierIndex: number;
    title: string;
    description: string;
    courses: Course[];
  }>;
}

export interface GraphEdge {
  id: string;
  from: string; // prerequisite course code
  to: string;   // target course code that requires 'from'
  isOnSelectedPath: boolean;
  isSatisfied: boolean;
}

export interface GraphNode {
  code: string;
  title: string;
  credits: number;
  department: string;
  status: CourseStatusType;
  tier: number;
  prerequisites: string[];
  dependents: string[]; // courses that depend on this course
  isSelected: boolean;
  isOnSelectedPath: boolean;
  isDirectPrereqOfSelected: boolean;
  isDirectDependentOfSelected: boolean;
}

export interface PrerequisiteGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxTier: number;
}

/**
 * Determine a course's status relative to the student's records:
 * - 'completed': Student has passed the course
 * - 'in-progress': Student is currently taking it this semester
 * - 'available': Student has not taken it, but ALL direct prerequisites are completed (or none exist)
 * - 'blocked': One or more direct prerequisites are not completed
 */
export function getCourseStatus(
  courseCode: string,
  completedCodes: Set<string>,
  inProgressCodes: Set<string>,
  courseCatalogMap: Map<string, Course> = COURSE_BY_CODE_MAP
): CourseStatusType {
  if (completedCodes.has(courseCode)) {
    return 'completed';
  }
  if (inProgressCodes.has(courseCode)) {
    return 'in-progress';
  }

  const course = courseCatalogMap.get(courseCode);
  if (!course || course.prerequisites.length === 0) {
    return 'available';
  }

  // All direct prerequisites must be completed for course to be available
  const allPrereqsMet = course.prerequisites.every(p => completedCodes.has(p));
  return allPrereqsMet ? 'available' : 'blocked';
}

/**
 * Backward Chaining Algorithm:
 * Starting from a target course, recursively discover all upstream prerequisites.
 * Per specification:
 * - Find direct prerequisites.
 * - Recursively find prerequisites of those prerequisite courses.
 * - Continue until reaching courses that have no prerequisites.
 * - Stop expanding a branch when a prerequisite has already been completed by the student.
 * - Identify remaining courses that must be completed before the target course becomes available.
 */
export function runBackwardChaining(
  targetCode: string,
  completedCodes: Set<string>,
  inProgressCodes: Set<string>,
  courseCatalogMap: Map<string, Course> = COURSE_BY_CODE_MAP,
  simulatedCycleEdges?: Array<{ from: string; to: string }>
): BackwardChainingResult {
  const targetCourse = courseCatalogMap.get(targetCode);
  const targetStatus = getCourseStatus(targetCode, completedCodes, inProgressCodes, courseCatalogMap);

  const allUpstreamCodesSet = new Set<string>();
  const completedUpstreamCodesSet = new Set<string>();
  const inProgressUpstreamCodesSet = new Set<string>();
  const unmetPrereqCodesSet = new Set<string>();
  const visitedForCycle = new Set<string>();

  let maxDepthReached = 0;

  // Build recursive backward chaining node
  function buildNode(code: string, currentDepth: number): PrerequisiteNode {
    maxDepthReached = Math.max(maxDepthReached, currentDepth);
    const course = courseCatalogMap.get(code);
    const isMissing = !course;
    const isCompleted = completedCodes.has(code);
    const isInProgress = inProgressCodes.has(code);
    const status = getCourseStatus(code, completedCodes, inProgressCodes, courseCatalogMap);

    // If already completed by the student, STOP expanding this branch per core requirement!
    if (isCompleted) {
      completedUpstreamCodesSet.add(code);
      return {
        code,
        course,
        status: 'completed',
        depth: currentDepth,
        isCompleted: true,
        isInProgress: false,
        isMissingFromCatalog: isMissing,
        children: [],
        branchSatisfied: true,
      };
    }

    // Otherwise, this prerequisite is incomplete
    if (isInProgress) {
      inProgressUpstreamCodesSet.add(code);
    } else {
      unmetPrereqCodesSet.add(code);
    }

    // Cycle detection during backward chaining traversal
    if (visitedForCycle.has(code)) {
      return {
        code,
        course,
        status,
        depth: currentDepth,
        isCompleted: false,
        isInProgress,
        isMissingFromCatalog: isMissing,
        children: [],
        branchSatisfied: false,
      };
    }

    visitedForCycle.add(code);

    // Determine prerequisites to expand (including simulated edges if testing)
    const directPrereqs: string[] = [];
    if (course && course.prerequisites) {
      directPrereqs.push(...course.prerequisites);
    }
    if (simulatedCycleEdges) {
      for (const edge of simulatedCycleEdges) {
        if (edge.to === code && !directPrereqs.includes(edge.from)) {
          directPrereqs.push(edge.from);
        }
      }
    }

    const children: PrerequisiteNode[] = [];
    let allChildrenSatisfied = directPrereqs.length > 0;

    for (const prereqCode of directPrereqs) {
      allUpstreamCodesSet.add(prereqCode);
      const childNode = buildNode(prereqCode, currentDepth + 1);
      children.push(childNode);
      if (!childNode.branchSatisfied) {
        allChildrenSatisfied = false;
      }
    }

    visitedForCycle.delete(code);

    return {
      code,
      course,
      status,
      depth: currentDepth,
      isCompleted,
      isInProgress,
      isMissingFromCatalog: isMissing,
      children,
      branchSatisfied: isCompleted || (directPrereqs.length === 0 && isCompleted),
    };
  }

  // Build target root
  const rootNode: PrerequisiteNode = {
    code: targetCode,
    course: targetCourse,
    status: targetStatus,
    depth: 0,
    isCompleted: targetStatus === 'completed',
    isInProgress: targetStatus === 'in-progress',
    isMissingFromCatalog: !targetCourse,
    children: [],
    branchSatisfied: targetStatus === 'completed',
  };

  const directPrereqs: string[] = [];
  if (targetCourse && targetCourse.prerequisites) {
    directPrereqs.push(...targetCourse.prerequisites);
  }
  if (simulatedCycleEdges) {
    for (const edge of simulatedCycleEdges) {
      if (edge.to === targetCode && !directPrereqs.includes(edge.from)) {
        directPrereqs.push(edge.from);
      }
    }
  }

  for (const prereqCode of directPrereqs) {
    allUpstreamCodesSet.add(prereqCode);
    rootNode.children.push(buildNode(prereqCode, 1));
  }

  // Find immediate next steps: courses in the unmet prerequisites set that have ALL their own direct prerequisites satisfied
  const immediateNextSteps: string[] = [];
  for (const unmetCode of unmetPrereqCodesSet) {
    const unmetCourse = courseCatalogMap.get(unmetCode);
    if (!unmetCourse) {
      // External/missing
      continue;
    }
    const canTakeNow = unmetCourse.prerequisites.length === 0 ||
      unmetCourse.prerequisites.every(p => completedCodes.has(p));
    if (canTakeNow && !completedCodes.has(unmetCode) && !inProgressCodes.has(unmetCode)) {
      immediateNextSteps.push(unmetCode);
    }
  }

  // Generate clear explanations
  const missingDirect = directPrereqs.filter(p => !completedCodes.has(p));
  const missingUpstream = Array.from(unmetPrereqCodesSet);

  let verdict = '';
  let verdictType: 'ready' | 'in-progress' | 'completed' | 'blocked' = 'blocked';
  let actionableAdvice = '';

  if (targetStatus === 'completed') {
    verdict = `Course Completed (${targetCode})`;
    verdictType = 'completed';
    actionableAdvice = `You have already satisfied this degree requirement with a passing grade.`;
  } else if (targetStatus === 'in-progress') {
    verdict = `Currently Enrolled (${targetCode})`;
    verdictType = 'in-progress';
    actionableAdvice = `You are actively taking this course in your current semester plan. Maintaining satisfactory academic standing will unlock downstream requirements.`;
  } else if (targetStatus === 'available') {
    verdict = `Available & Ready to Enroll (${targetCode})`;
    verdictType = 'ready';
    if (directPrereqs.length === 0) {
      actionableAdvice = `This is an open foundational course with zero prerequisites. You can add it to your upcoming semester schedule immediately.`;
    } else {
      actionableAdvice = `All direct prerequisites (${directPrereqs.join(', ')}) have been satisfied! You are officially cleared to enroll in this course.`;
    }
  } else {
    verdict = `Prerequisite Blocked (${targetCode})`;
    verdictType = 'blocked';
    if (immediateNextSteps.length > 0) {
      const stepDetails = immediateNextSteps.map(code => {
        const c = courseCatalogMap.get(code);
        return `${code} (${c?.title || 'Required'})`;
      }).join(', ');
      actionableAdvice = `To unblock ${targetCode}, your immediate priority is to register for: ${stepDetails}. Completing these will satisfy the upstream dependencies.`;
    } else if (inProgressCodes.size > 0 && Array.from(inProgressCodes).some(c => allUpstreamCodesSet.has(c))) {
      actionableAdvice = `One or more prerequisites are currently In Progress. Once your grades are submitted and finalized, this course will become unlocked.`;
    } else {
      actionableAdvice = `You must complete ${missingDirect.length} direct prerequisite(s) before this course becomes available.`;
    }
  }

  const directSummary = directPrereqs.length === 0
    ? `No prerequisites required.`
    : `${directPrereqs.length} prerequisite(s): ${directPrereqs.map(p => {
        const isComp = completedCodes.has(p);
        const isIP = inProgressCodes.has(p);
        const tag = isComp ? 'Passed ✓' : isIP ? 'In Progress ⏳' : 'Missing ✗';
        return `${p} [${tag}]`;
      }).join(', ')}`;

  return {
    targetCode,
    targetCourse,
    targetStatus,
    isReady: targetStatus === 'available',
    allUpstreamCodes: Array.from(allUpstreamCodesSet),
    completedUpstreamCodes: Array.from(completedUpstreamCodesSet),
    inProgressUpstreamCodes: Array.from(inProgressUpstreamCodesSet),
    unmetPrereqCodes: missingUpstream,
    immediateNextSteps,
    rootNode,
    maxChainDepth: maxDepthReached,
    explanation: {
      verdict,
      verdictType,
      directSummary,
      missingDirect,
      missingUpstream,
      actionableAdvice,
    },
  };
}

/**
 * Cycle Detection Algorithm:
 * Uses Depth-First Search with 3-color states (0=Unvisited, 1=Visiting/InStack, 2=Visited).
 * Identifies if a circular dependency exists and reconstructs the cycle path (e.g., A -> B -> C -> A).
 */
export function detectGraphCycles(
  courses: Course[],
  extraEdges?: Array<{ from: string; to: string }>
): {
  hasCycle: boolean;
  cycleNodes: Set<string>;
  cyclePath: string[];
  errorMessage?: string;
} {
  // Build adjacency list: edge u -> v means u is prerequisite of v
  const adj = new Map<string, string[]>();
  for (const c of courses) {
    if (!adj.has(c.code)) adj.set(c.code, []);
  }

  for (const c of courses) {
    for (const prereq of c.prerequisites) {
      if (!adj.has(prereq)) adj.set(prereq, []);
      adj.get(prereq)!.push(c.code);
    }
  }

  if (extraEdges) {
    for (const edge of extraEdges) {
      if (!adj.has(edge.from)) adj.set(edge.from, []);
      if (!adj.has(edge.to)) adj.set(edge.to, []);
      adj.get(edge.from)!.push(edge.to);
    }
  }

  const color = new Map<string, number>(); // 0: White, 1: Gray (in current DFS stack), 2: Black (finished)
  const parent = new Map<string, string | null>();
  for (const node of adj.keys()) {
    color.set(node, 0);
  }

  let cycleFound = false;
  let cycleStartNode = '';
  let cycleEndNode = '';

  function dfs(u: string): boolean {
    color.set(u, 1);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (color.get(v) === 1) {
        // Back edge found! Cycle detected
        cycleFound = true;
        cycleStartNode = v;
        cycleEndNode = u;
        return true;
      }
      if (color.get(v) === 0) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }

    color.set(u, 2);
    return false;
  }

  for (const node of adj.keys()) {
    if (color.get(node) === 0) {
      if (dfs(node)) break;
    }
  }

  if (cycleFound) {
    // Reconstruct cycle path from cycleEndNode back to cycleStartNode
    const path: string[] = [cycleStartNode];
    let curr = cycleEndNode;
    const cycleNodesSet = new Set<string>([cycleStartNode]);

    while (curr && curr !== cycleStartNode) {
      path.push(curr);
      cycleNodesSet.add(curr);
      curr = parent.get(curr) || '';
    }
    path.push(cycleStartNode);
    path.reverse();

    const pathStr = path.join(' ➔ ');
    return {
      hasCycle: true,
      cycleNodes: cycleNodesSet,
      cyclePath: path,
      errorMessage: `Circular Prerequisite Dependency Detected: ${pathStr}. A course cannot be its own direct or indirect prerequisite.`,
    };
  }

  return {
    hasCycle: false,
    cycleNodes: new Set(),
    cyclePath: [],
  };
}

/**
 * Kahn's Algorithm for Topological Sorting & Dependency Tiering:
 * Computes a valid linear course sequence and partitions courses into
 * strictly verified dependency tiers.
 * Rule: A course must never be placed in a tier prior to or equal to any of its prerequisites.
 */
export function computeKahnTopologicalSort(
  courses: Course[],
  extraEdges?: Array<{ from: string; to: string }>
): TopologicalSortResult {
  // First check for cycles
  const cycleCheck = detectGraphCycles(courses, extraEdges);
  if (cycleCheck.hasCycle) {
    return {
      hasCycle: true,
      cycleNodes: Array.from(cycleCheck.cycleNodes),
      cyclePath: cycleCheck.cyclePath,
      errorMessage: cycleCheck.errorMessage,
      sortedCodes: [],
      tiers: [],
    };
  }

  const courseCodes = new Set(courses.map(c => c.code));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>(); // u (prereq) -> v (dependents)
  const coursePrereqMap = new Map<string, string[]>();

  for (const c of courses) {
    adjList.set(c.code, []);
    coursePrereqMap.set(c.code, [...c.prerequisites]);
  }

  if (extraEdges) {
    for (const edge of extraEdges) {
      if (!adjList.has(edge.from)) adjList.set(edge.from, []);
      if (!coursePrereqMap.has(edge.to)) coursePrereqMap.set(edge.to, []);
      coursePrereqMap.get(edge.to)!.push(edge.from);
    }
  }

  // Populate adjacency list & initial in-degrees
  for (const [courseCode, prereqs] of coursePrereqMap.entries()) {
    // In-degree is number of prerequisites belonging to the curriculum
    let degree = 0;
    for (const p of prereqs) {
      if (adjList.has(p)) {
        adjList.get(p)!.push(courseCode);
        degree++;
      }
    }
    inDegree.set(courseCode, degree);
  }

  // Kahn's Algorithm with queue
  const queue: string[] = [];
  const courseTierMap = new Map<string, number>();

  // Initialize queue with courses having in-degree 0 (Tier 0: Foundational / No Prereqs)
  for (const [code, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(code);
      courseTierMap.set(code, 0);
    }
  }

  const sortedOrder: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedOrder.push(current);
    const currentTier = courseTierMap.get(current) || 0;

    const neighbors = adjList.get(current) || [];
    for (const next of neighbors) {
      const currentDeg = inDegree.get(next)! - 1;
      inDegree.set(next, currentDeg);

      // Child tier must be at least currentTier + 1
      const nextMinTier = currentTier + 1;
      const existingTier = courseTierMap.get(next) ?? 0;
      courseTierMap.set(next, Math.max(existingTier, nextMinTier));

      if (currentDeg === 0) {
        queue.push(next);
      }
    }
  }

  // Group into tiers
  const tierGroups = new Map<number, Course[]>();
  const courseMap = new Map<string, Course>(courses.map(c => [c.code, c]));

  for (const code of sortedOrder) {
    const c = courseMap.get(code);
    if (!c) continue;
    const tier = courseTierMap.get(code) || 0;
    if (!tierGroups.has(tier)) tierGroups.set(tier, []);
    tierGroups.get(tier)!.push(c);
  }

  const maxTier = Math.max(0, ...Array.from(tierGroups.keys()));
  const tiers: TopologicalSortResult['tiers'] = [];

  const tierMeta: Record<number, { title: string; description: string }> = {
    0: {
      title: 'Tier 0: Open Entry & Foundational Core',
      description: 'Zero prerequisite barriers. Essential gateways in Calculus, General Biology, Physics, and Core Gen-Ed.',
    },
    1: {
      title: 'Tier 1: Intermediate Scientific Gateways',
      description: 'Requires foundational Tier 0 coursework. Covers Ecology, Earth Science, Chemistry, and Statistics.',
    },
    2: {
      title: 'Tier 2: Advanced Geospatial, Taxonomy & Environmental Management',
      description: 'Requires Tier 1 gateways. Covers Remote Sensing, Taxonomy, Environmental Chemistry, and Toxicology.',
    },
    3: {
      title: 'Tier 3: Specialized Assessment & Capstone Preparation',
      description: 'Requires Tier 2 foundations. Critical Environmental Impact Assessment (EIA) and Research Methods.',
    },
    4: {
      title: 'Tier 4: Field Practicum (360 Hours) & Environmental Economics',
      description: 'Requires Tier 3 EIA clearing. Intensive industry immersion and advanced policy analysis.',
    },
    5: {
      title: 'Tier 5: Capstone Thesis Defense & Terminal Requirements',
      description: 'Final degree completion milestone. Environmental Science Thesis Manuscripts and Comprehensive Seminars.',
    },
  };

  for (let i = 0; i <= maxTier; i++) {
    const coursesInTier = tierGroups.get(i) || [];
    if (coursesInTier.length === 0) continue;
    tiers.push({
      tierIndex: i,
      title: tierMeta[i]?.title || `Tier ${i}: Specialized Upper-Division Courses`,
      description: tierMeta[i]?.description || `Courses requiring satisfaction of Tier ${i - 1} dependencies.`,
      courses: coursesInTier,
    });
  }

  return {
    hasCycle: false,
    cycleNodes: [],
    cyclePath: [],
    sortedCodes: sortedOrder,
    tiers,
  };
}

/**
 * Builds the complete graph data for SVG interactive visualization
 */
export function buildPrerequisiteGraphData(
  courses: Course[],
  selectedCourseCode: string,
  completedCodes: Set<string>,
  inProgressCodes: Set<string>,
  topologicalResult: TopologicalSortResult
): PrerequisiteGraphData {
  const courseMap = new Map(courses.map(c => [c.code, c]));
  const selectedCourse = courseMap.get(selectedCourseCode);

  // Backward chaining to identify exact path of upstream prerequisites
  const backwardChaining = runBackwardChaining(selectedCourseCode, completedCodes, inProgressCodes, courseMap);
  const upstreamSet = new Set(backwardChaining.allUpstreamCodes);

  // Downstream courses that depend directly or indirectly on selectedCourse
  const downstreamSet = new Set<string>();
  const queue = [selectedCourseCode];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const c of courses) {
      if (c.prerequisites.includes(curr) && !downstreamSet.has(c.code)) {
        downstreamSet.add(c.code);
        queue.push(c.code);
      }
    }
  }

  // Determine tiers for nodes
  const nodeTierMap = new Map<string, number>();
  topologicalResult.tiers.forEach(tier => {
    tier.courses.forEach(c => {
      nodeTierMap.set(c.code, tier.tierIndex);
    });
  });

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const c of courses) {
    const isSelected = c.code === selectedCourseCode;
    const isUpstream = upstreamSet.has(c.code);
    const isDownstream = downstreamSet.has(c.code);
    const isDirectPrereq = selectedCourse ? selectedCourse.prerequisites.includes(c.code) : false;
    const isDirectDependent = c.prerequisites.includes(selectedCourseCode);

    const dependents = courses.filter(item => item.prerequisites.includes(c.code)).map(item => item.code);

    nodes.push({
      code: c.code,
      title: c.title,
      credits: c.credits,
      department: c.department,
      status: getCourseStatus(c.code, completedCodes, inProgressCodes, courseMap),
      tier: nodeTierMap.get(c.code) ?? 0,
      prerequisites: c.prerequisites,
      dependents,
      isSelected,
      isOnSelectedPath: isSelected || isUpstream || isDownstream,
      isDirectPrereqOfSelected: isDirectPrereq,
      isDirectDependentOfSelected: isDirectDependent,
    });

    for (const prereqCode of c.prerequisites) {
      const isPrereqSatisfied = completedCodes.has(prereqCode);
      const isEdgeOnPath = (upstreamSet.has(prereqCode) && (upstreamSet.has(c.code) || c.code === selectedCourseCode))
        || (prereqCode === selectedCourseCode && downstreamSet.has(c.code))
        || (downstreamSet.has(prereqCode) && downstreamSet.has(c.code));

      edges.push({
        id: `edge-${prereqCode}->${c.code}`,
        from: prereqCode,
        to: c.code,
        isOnSelectedPath: isEdgeOnPath,
        isSatisfied: isPrereqSatisfied,
      });
    }
  }

  const maxTier = Math.max(0, ...Array.from(nodeTierMap.values()));

  return {
    nodes,
    edges,
    maxTier,
  };
}
