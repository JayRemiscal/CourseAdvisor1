import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Unlock, 
  Lock, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Filter, 
  Layers, 
  Info, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search
} from 'lucide-react';
import { Course } from '../../types/academic';
import { 
  CourseStatusType, 
  GraphNode, 
  GraphEdge, 
  PrerequisiteGraphData,
  TopologicalSortResult
} from '../../utils/prerequisiteEngine';

interface PrerequisiteGraphViewProps {
  graphData: PrerequisiteGraphData;
  selectedCourseCode: string;
  onSelectCourse: (code: string) => void;
  onOpenCourseModal: (courseId: string) => void;
  topologicalResult: TopologicalSortResult;
}

export const PrerequisiteGraphView: React.FC<PrerequisiteGraphViewProps> = ({
  graphData,
  selectedCourseCode,
  onSelectCourse,
  onOpenCourseModal,
  topologicalResult,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'path-only' | 'blocked' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredNodeCode, setHoveredNodeCode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group nodes by their Kahn topological tier
  const tierGroupedNodes = useMemo(() => {
    const map = new Map<number, GraphNode[]>();
    for (let t = 0; t <= graphData.maxTier; t++) {
      map.set(t, []);
    }
    for (const node of graphData.nodes) {
      if (!map.has(node.tier)) map.set(node.tier, []);
      map.get(node.tier)!.push(node);
    }
    return map;
  }, [graphData]);

  // Compute node coordinates for SVG canvas
  // Tier index => X position
  // Node index in tier => Y position
  const NODE_WIDTH = 210;
  const NODE_HEIGHT = 92;
  const TIER_SPACING_X = 290;
  const NODE_SPACING_Y = 120;
  const PADDING_LEFT = 40;
  const PADDING_TOP = 60;

  const nodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();

    for (const [tierIdx, nodes] of tierGroupedNodes.entries()) {
      const x = PADDING_LEFT + tierIdx * TIER_SPACING_X;
      nodes.forEach((node, nodeIdx) => {
        const y = PADDING_TOP + nodeIdx * NODE_SPACING_Y;
        pos.set(node.code, { x, y });
      });
    }

    return pos;
  }, [tierGroupedNodes]);

  // Canvas bounds
  const canvasDimensions = useMemo(() => {
    let maxX = 1200;
    let maxY = 700;

    for (const [, coords] of nodePositions.entries()) {
      maxX = Math.max(maxX, coords.x + NODE_WIDTH + 80);
      maxY = Math.max(maxY, coords.y + NODE_HEIGHT + 100);
    }

    return { width: maxX, height: maxY };
  }, [nodePositions]);

  // Visible nodes and edges based on filter mode and search
  const visibleNodes = useMemo(() => {
    return graphData.nodes.filter(node => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = node.code.toLowerCase().includes(q) || node.title.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filterMode === 'path-only') {
        return node.isOnSelectedPath;
      }
      if (filterMode === 'blocked') {
        return node.status === 'blocked';
      }
      if (filterMode === 'available') {
        return node.status === 'available';
      }
      return true;
    });
  }, [graphData.nodes, filterMode, searchQuery]);

  const visibleNodeCodes = useMemo(() => new Set(visibleNodes.map(n => n.code)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return graphData.edges.filter(edge => {
      if (!visibleNodeCodes.has(edge.from) || !visibleNodeCodes.has(edge.to)) {
        return false;
      }
      if (filterMode === 'path-only') {
        return edge.isOnSelectedPath;
      }
      return true;
    });
  }, [graphData.edges, visibleNodeCodes, filterMode]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.45, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(0.95);

  const getStatusColorConfig = (status: CourseStatusType, isSelected: boolean, isPath: boolean) => {
    if (isSelected) {
      return {
        bg: 'bg-white',
        border: 'border-[#2563EB] ring-4 ring-[#2563EB]/25 shadow-lg shadow-[#2563EB]/20',
        badge: 'bg-[#17365D] text-white',
        statusBg: 'bg-blue-50 text-[#2563EB] border-blue-200',
        statusLabel: 'TARGET COURSE',
        statusIcon: Sparkles,
      };
    }
    if (status === 'completed') {
      return {
        bg: isPath ? 'bg-emerald-50/90' : 'bg-white',
        border: isPath ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-emerald-300 hover:border-emerald-500',
        badge: 'bg-emerald-700 text-white',
        statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        statusLabel: 'Completed',
        statusIcon: CheckCircle2,
      };
    }
    if (status === 'in-progress') {
      return {
        bg: isPath ? 'bg-blue-50/90' : 'bg-white',
        border: isPath ? 'border-[#2563EB] ring-2 ring-blue-400/40' : 'border-blue-300 hover:border-blue-500',
        badge: 'bg-[#2563EB] text-white',
        statusBg: 'bg-blue-50 text-blue-700 border-blue-200',
        statusLabel: 'In Progress',
        statusIcon: Clock,
      };
    }
    if (status === 'available') {
      return {
        bg: isPath ? 'bg-indigo-50/90' : 'bg-white',
        border: isPath ? 'border-indigo-500 ring-2 ring-indigo-400/40' : 'border-indigo-300 hover:border-indigo-500',
        badge: 'bg-indigo-700 text-white',
        statusBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        statusLabel: 'Ready to Enroll',
        statusIcon: Unlock,
      };
    }
    // Blocked
    return {
      bg: isPath ? 'bg-amber-50/70' : 'bg-white',
      border: isPath ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-slate-200 hover:border-slate-400',
      badge: 'bg-slate-700 text-white',
      statusBg: 'bg-slate-100 text-slate-600 border-slate-200',
      statusLabel: 'Prereqs Locked',
      statusIcon: Lock,
    };
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all flex flex-col ${
      isExpanded ? 'fixed inset-2 sm:inset-4 z-50 overflow-hidden' : 'relative'
    }`}>
      
      {/* Top Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h3 className="font-bold text-sm text-[#17365D]">
              Interactive Prerequisite Graph
            </h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Directed dependencies ordered by topological tiers
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find course..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-full sm:w-40"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* View Filter Mode */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterMode === 'all' ? 'bg-[#17365D] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('path-only')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filterMode === 'path-only' ? 'bg-[#2563EB] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Path ({selectedCourseCode})</span>
            </button>
            <button
              onClick={() => setFilterMode('available')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors hidden sm:block ${
                filterMode === 'available' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterMode('blocked')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors hidden sm:block ${
                filterMode === 'blocked' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Blocked
            </button>
          </div>

          {/* Zoom & Fullscreen Buttons */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 font-semibold text-slate-600 w-9 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            title={isExpanded ? 'Collapse' : 'Expand graph full view'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Graph Legend - Horizontally scrollable on mobile */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Node Legend:
          </span>
          <div className="flex items-center gap-1 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="font-medium text-[11px]">Completed</span>
          </div>
          <div className="flex items-center gap-1 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] ring-2 ring-blue-200" />
            <span className="font-medium text-[11px]">In Progress</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200" />
            <span className="font-medium text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-slate-200" />
            <span className="font-medium text-[11px]">Blocked</span>
          </div>
          <div className="flex items-center gap-1 text-[#17365D]">
            <span className="w-3 h-3 rounded-md bg-[#2563EB] ring-2 ring-amber-400" />
            <span className="font-bold text-[11px]">Target</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0 pl-2">
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-0.5 bg-amber-500 inline-block" /> Active Path
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-0.5 bg-slate-300 inline-block" /> Prerequisite Link
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-[#F8FAFC] select-none p-4"
        style={{ minHeight: isExpanded ? 'calc(100vh - 120px)' : '460px', maxHeight: isExpanded ? 'none' : '620px' }}
      >
        <div 
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative"
        >
          {/* Tier Column Guides */}
          {Array.from(tierGroupedNodes.keys()).map(tierIdx => {
            const x = PADDING_LEFT + tierIdx * TIER_SPACING_X;
            return (
              <div
                key={`tier-col-${tierIdx}`}
                className="absolute top-0 bottom-0 pointer-events-none border-l border-dashed border-slate-200/90"
                style={{ left: `${x - 20}px`, width: `${TIER_SPACING_X}px` }}
              >
                <div className="sticky top-2 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-lg border border-slate-200 shadow-2xs inline-block text-[11px] font-bold text-[#17365D]">
                  Tier {tierIdx}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    ({tierGroupedNodes.get(tierIdx)?.length || 0} courses)
                  </span>
                </div>
              </div>
            );
          })}

          {/* SVG Connecting Edges with Arrows */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasDimensions.width}
            height={canvasDimensions.height}
          >
            <defs>
              {/* Default Arrow Marker */}
              <marker
                id="arrowhead-default"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
              </marker>

              {/* Path Active Highlight Marker */}
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill="#F59E0B" />
              </marker>

              {/* Satisfied Prerequisite Marker */}
              <marker
                id="arrowhead-satisfied"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
              </marker>
            </defs>

            {visibleEdges.map(edge => {
              const fromPos = nodePositions.get(edge.from);
              const toPos = nodePositions.get(edge.to);
              if (!fromPos || !toPos) return null;

              const startX = fromPos.x + NODE_WIDTH;
              const startY = fromPos.y + NODE_HEIGHT / 2;
              const endX = toPos.x;
              const endY = toPos.y + NODE_HEIGHT / 2;

              // Cubic Bezier curve control points
              const dx = Math.abs(endX - startX) * 0.55;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              const isPath = edge.isOnSelectedPath;
              const isHovered = hoveredNodeCode === edge.from || hoveredNodeCode === edge.to;

              return (
                <path
                  key={edge.id}
                  d={pathData}
                  fill="none"
                  stroke={
                    isPath
                      ? '#F59E0B'
                      : isHovered
                      ? '#2563EB'
                      : edge.isSatisfied
                      ? '#CBD5E1'
                      : '#E2E8F0'
                  }
                  strokeWidth={isPath ? 3.5 : isHovered ? 2.5 : 1.5}
                  strokeDasharray={isPath ? undefined : edge.isSatisfied ? undefined : '4 3'}
                  markerEnd={
                    isPath
                      ? 'url(#arrowhead-active)'
                      : edge.isSatisfied
                      ? 'url(#arrowhead-satisfied)'
                      : 'url(#arrowhead-default)'
                  }
                  opacity={isPath ? 1 : filterMode === 'path-only' ? 0.2 : 0.65}
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>

          {/* Interactive Course Node Cards */}
          {visibleNodes.map(node => {
            const pos = nodePositions.get(node.code);
            if (!pos) return null;

            const isSelected = node.isSelected;
            const isPath = node.isOnSelectedPath;
            const styleConfig = getStatusColorConfig(node.status, isSelected, isPath);
            const StatusIcon = styleConfig.statusIcon;

            // Opacity when active path filter is not on but course is not on path
            const isDimmed = !isPath && selectedCourseCode && filterMode !== 'path-only';

            return (
              <div
                key={node.code}
                onClick={() => onSelectCourse(node.code)}
                onMouseEnter={() => setHoveredNodeCode(node.code)}
                onMouseLeave={() => setHoveredNodeCode(null)}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                }}
                className={`absolute p-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none flex flex-col justify-between ${
                  styleConfig.bg
                } ${styleConfig.border} ${
                  isDimmed ? 'opacity-65 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${styleConfig.badge}`}>
                      {node.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {node.credits} cr
                    </span>
                  </div>

                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${styleConfig.statusBg}`}>
                    <StatusIcon className="w-2.5 h-2.5 shrink-0" />
                    {styleConfig.statusLabel}
                  </span>
                </div>

                {/* Course Title */}
                <p 
                  className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mt-1" 
                  title={node.title}
                >
                  {node.title}
                </p>

                {/* Footer Prerequisite Count & Action */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>
                    {node.prerequisites.length === 0 
                      ? 'No prereqs' 
                      : `${node.prerequisites.length} prereq(s)`}
                  </span>

                  <div className="flex items-center gap-1">
                    {node.isDirectPrereqOfSelected && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                        Direct Prereq
                      </span>
                    )}
                    {node.isDirectDependentOfSelected && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1 rounded">
                        Unlocks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>
            Showing <strong>{visibleNodes.length}</strong> of {graphData.nodes.length} curriculum courses across{' '}
            <strong>{graphData.maxTier + 1}</strong> topological tiers. Click any node to recalculate backward chaining.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Selected: <strong className="font-mono text-slate-800">{selectedCourseCode}</strong>
          </span>
        </div>
      </div>

    </div>
  );
};
