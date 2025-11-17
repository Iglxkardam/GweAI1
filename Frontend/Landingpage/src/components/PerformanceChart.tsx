import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  timestamp: number;
  value: number;
  x?: number;
  y?: number;
}

interface PerformanceChartProps {
  currentValue: number;
  isConnected: boolean;
  walletAddress?: string; // Add wallet address prop
}

type TimeRange = '4h' | '8h' | '24h' | '3d' | '1month';

interface TimeRangeConfig {
  label: string;
  duration: number; // in milliseconds
  interval: number; // data point interval in milliseconds
  points: number; // number of initial points
}

// Time range configurations - Fixed intervals like real trading charts (moved outside component to prevent recreating)
const TIME_RANGES: Record<TimeRange, TimeRangeConfig> = {
  '4h': { label: '4H', duration: 4 * 60 * 60 * 1000, interval: 2 * 60 * 1000, points: 120 },      // 4 hours / 2 min = 120 points
  '8h': { label: '8H', duration: 8 * 60 * 60 * 1000, interval: 4 * 60 * 1000, points: 120 },      // 8 hours / 4 min = 120 points
  '24h': { label: '24H', duration: 24 * 60 * 60 * 1000, interval: 10 * 60 * 1000, points: 144 },  // 24 hours / 10 min = 144 points
  '3d': { label: '3D', duration: 3 * 24 * 60 * 60 * 1000, interval: 30 * 60 * 1000, points: 144 },// 3 days / 30 min = 144 points
  '1month': { label: '1M', duration: 30 * 24 * 60 * 60 * 1000, interval: 5 * 60 * 60 * 1000, points: 144 } // 30 days / 5 hour = 144 points
};

export const PerformanceChart: React.FC<PerformanceChartProps> = memo(({ currentValue, isConnected, walletAddress }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h');
  const [valueChanged, setValueChanged] = useState(false);
  const prevValueRef = useRef<number>(currentValue);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const rafRef = useRef<number>();

  // Generate realistic historical data for the selected timeframe with EXACT intervals
  const generateHistoricalData = useCallback((baseValue: number, range: TimeRange): DataPoint[] => {
    const config = TIME_RANGES[range];
    const now = Date.now();
    const startTime = now - config.duration;
    
    const historicalData: DataPoint[] = [];
    
    // Generate realistic price movements (random walk with slight upward bias)
    let currentPrice = baseValue;
    const volatility = 0.015; // 1.5% volatility per interval
    const trend = 0.0002; // Slight upward trend
    
    // Generate data points at EXACT intervals (like real charts)
    let timestamp = startTime;
    while (timestamp <= now) {
      // Random walk: generate random movement
      const randomChange = (Math.random() - 0.5) * 2 * volatility * currentPrice;
      const trendChange = trend * currentPrice;
      
      currentPrice = Math.max(0, currentPrice + randomChange + trendChange);
      
      historicalData.push({
        timestamp,
        value: currentPrice
      });
      
      timestamp += config.interval; // Move to next interval
    }
    
    // Ensure the last point is exactly now with current value
    if (historicalData[historicalData.length - 1].timestamp !== now) {
      historicalData.push({
        timestamp: now,
        value: baseValue
      });
    } else {
      // Update last point to match current value
      historicalData[historicalData.length - 1].value = baseValue;
    }
    
    return historicalData;
  }, []);

  // Load historical data from wallet-specific localStorage
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setData([]);
      return;
    }

    // No loading state - instant transition
    const config = TIME_RANGES[selectedRange];
    const now = Date.now();
    const cutoffTime = now - config.duration;
    
    // Load stored data from wallet-specific localStorage
    const storageKey = `wallet_${walletAddress.toLowerCase()}_portfolio_history`;
    const storedData = localStorage.getItem(storageKey);
    let historicalData: DataPoint[] = [];
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as DataPoint[];
        // Filter data within selected time range
        historicalData = parsed.filter(p => p.timestamp > cutoffTime);
        
        console.log(`📈 Loading ${selectedRange} range:`, {
          totalPoints: parsed.length,
          filteredPoints: historicalData.length,
          range: config.label,
          oldestPoint: historicalData[0] ? new Date(historicalData[0].timestamp).toLocaleString() : 'N/A',
          newestPoint: historicalData[historicalData.length - 1] ? new Date(historicalData[historicalData.length - 1].timestamp).toLocaleString() : 'N/A'
        });
      } catch (e) {
        console.error('Error parsing portfolio history:', e);
      }
    }
    
    // If no historical data or insufficient data points, generate historical data
    if (historicalData.length < 10) {
      console.log('📊 Generating historical data for', selectedRange, 'with base value:', currentValue);
      historicalData = generateHistoricalData(currentValue, selectedRange);
      const storageKey = `wallet_${walletAddress.toLowerCase()}_portfolio_history`;
      localStorage.setItem(storageKey, JSON.stringify(historicalData));
    }
    
    setData(historicalData);
  }, [isConnected, selectedRange, currentValue, walletAddress, generateHistoricalData]);

  // Detect significant value changes (deposits/withdrawals)
  useEffect(() => {
    const changeThreshold = 0.01; // 1% change (more sensitive)
    const absoluteChange = Math.abs(currentValue - prevValueRef.current);
    const percentChange = prevValueRef.current > 0 
      ? Math.abs((currentValue - prevValueRef.current) / prevValueRef.current)
      : 1;
    
    // Trigger on 1% change OR $1 absolute change
    if ((percentChange > changeThreshold || absoluteChange > 1) && prevValueRef.current !== currentValue) {
      setValueChanged(true);
      setTimeout(() => setValueChanged(false), 2000); // Flash for 2 seconds
    }
    
    prevValueRef.current = currentValue;
  }, [currentValue]);

  // Real-time updates - update at proper intervals based on selected timeframe
  useEffect(() => {
    if (!isConnected || currentValue === 0 || !walletAddress) return;

    const config = TIME_RANGES[selectedRange];
    const updateInterval = Math.min(config.interval, 60000); // Update at interval or 1 min max

    // Immediate update on value change
    const updateData = () => {
      setData(prevData => {
        const now = Date.now();
        const storageKey = `wallet_${walletAddress.toLowerCase()}_portfolio_history`;
        
        // Load all stored data
        const storedData = localStorage.getItem(storageKey);
        let allData: DataPoint[] = prevData;
        
        if (storedData) {
          try {
            allData = JSON.parse(storedData);
          } catch (e) {
            allData = prevData;
          }
        }
        
        const lastPoint = allData[allData.length - 1];
        
        // Only add new point if enough time has passed (based on interval)
        const shouldAddPoint = !lastPoint || (now - lastPoint.timestamp) >= config.interval;
        
        if (shouldAddPoint) {
          const newPoint: DataPoint = {
            timestamp: now,
            value: currentValue
          };
          
          console.log(`📊 Chart Update [${config.label}]:`, {
            previousValue: lastPoint?.value.toFixed(2),
            newValue: currentValue.toFixed(2),
            change: lastPoint ? (currentValue - lastPoint.value).toFixed(2) : 'N/A',
            timeSinceLastPoint: lastPoint ? `${((now - lastPoint.timestamp) / 1000 / 60).toFixed(1)}m` : 'N/A',
            interval: `${config.interval / 1000 / 60}m`,
            timestamp: new Date(now).toLocaleTimeString()
          });

          allData = [...allData, newPoint];
          
          // Keep only last 30 days of data in localStorage
          const maxStorageTime = 30 * 24 * 60 * 60 * 1000;
          const storageCutoff = now - maxStorageTime;
          const dataToStore = allData.filter(p => p.timestamp > storageCutoff);
          
          // Save to wallet-specific localStorage
          localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        } else {
          // Update the last point's value if it exists
          if (lastPoint) {
            allData[allData.length - 1].value = currentValue;
            localStorage.setItem(storageKey, JSON.stringify(allData));
          }
        }
        
        // Filter for current view range
        const cutoffTime = now - config.duration;
        const viewData = allData.filter(p => p.timestamp > cutoffTime);
        
        return viewData;
      });
    };

    // Update immediately when currentValue changes
    updateData();

    // Then set up interval for periodic updates (check every minute or at interval)
    const interval = setInterval(updateData, updateInterval);

    return () => clearInterval(interval);
  }, [currentValue, isConnected, selectedRange, walletAddress]);

  // Handle responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width - 32, // Account for padding
          height: window.innerWidth < 640 ? 200 : 280
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate chart metrics
  const chartMetrics = useMemo(() => {
    const defaultPadding = { padding_x: 40, padding_y: 20, innerWidth: 100, innerHeight: 100 };
    
    if (data.length === 0) {
      return { 
        minValue: 0, 
        maxValue: 100, 
        valueRange: 100, 
        path: '', 
        fillPath: '',
        points: [],
        ...defaultPadding
      };
    }

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Add padding (10% on each side)
    const padding = valueRange * 0.1;
    const paddedMin = minValue - padding;
    const paddedMax = maxValue + padding;
    const paddedRange = paddedMax - paddedMin;

    const chartWidth = dimensions.width;
    const chartHeight = dimensions.height;
    const padding_x = 40;
    const padding_y = 20;
    const innerWidth = chartWidth - padding_x * 2;
    const innerHeight = chartHeight - padding_y * 2;

    // Generate path
    const points = data.map((point, i) => {
      const x = padding_x + (i / (data.length - 1 || 1)) * innerWidth;
      const y = padding_y + innerHeight - ((point.value - paddedMin) / paddedRange) * innerHeight;
      return { x, y, ...point };
    });

    const path = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Create gradient fill path
    const fillPath = path + ` L ${points[points.length - 1]?.x || 0} ${chartHeight - padding_y} L ${padding_x} ${chartHeight - padding_y} Z`;

    return { 
      minValue: paddedMin, 
      maxValue: paddedMax, 
      valueRange: paddedRange, 
      path, 
      fillPath,
      points,
      innerWidth,
      innerHeight,
      padding_x,
      padding_y
    };
  }, [data, dimensions]);

  // Handle mouse move for hover - throttled with RAF
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        if (!svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Find closest point
        const closest = chartMetrics.points.reduce((prev, curr) => 
          Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
        );

        setHoveredPoint(closest);
        rafRef.current = undefined;
      });
    }
  }, [data.length, chartMetrics.points]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  }, []);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (data.length < 2) {
      return { change: 0, changePercent: 0, isPositive: true };
    }

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  }, [data]);

  // Format time label based on selected range
  const getTimeLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    
    if (selectedRange === '4h' || selectedRange === '8h') {
      return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (selectedRange === '24h') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else if (selectedRange === '3d') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Connect wallet to view performance</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-white/10 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-24 mx-auto"></div>
          </div>
          <p className="text-gray-400 text-xs mt-3">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Chart Header */}
      <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <motion.h3 
              className="text-2xl sm:text-3xl font-bold text-white"
              animate={valueChanged ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              ${hoveredPoint ? hoveredPoint.value.toFixed(2) : currentValue.toFixed(2)}
            </motion.h3>
            <span className={`text-sm font-medium ${performanceMetrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {performanceMetrics.isPositive ? '+' : ''}{performanceMetrics.changePercent.toFixed(2)}%
            </span>
            {valueChanged && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30"
              >
                Updated
              </motion.span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {hoveredPoint 
              ? getTimeLabel(hoveredPoint.timestamp)
              : `Last ${TIME_RANGES[selectedRange].label}`
            }
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-gray-400">Live</span>
          </div>
          <div className="text-gray-500">
            {data.length} points
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(TIME_RANGES) as TimeRange[]).map((range) => (
            <motion.button
              key={range}
              onClick={() => setSelectedRange(range)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200
                ${selectedRange === range 
                  ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                  : 'bg-white/[0.03] text-gray-400 border border-white/[0.08] hover:border-white/[0.15] hover:text-white hover:bg-white/[0.05]'
                }
              `}
            >
              {TIME_RANGES[range].label}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 hidden sm:block">
            Updates every 15s
          </div>
          <button
            onClick={() => {
              if (window.confirm('Clear all chart history? This cannot be undone.')) {
                if (walletAddress) {
                  const storageKey = `wallet_${walletAddress.toLowerCase()}_portfolio_history`;
                  localStorage.removeItem(storageKey);
                }
                setData([{ timestamp: Date.now(), value: currentValue }]);
              }
            }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
            title="Clear chart history"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Chart SVG */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full transition-opacity duration-200"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Gradient for fill */}
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.0)" />
          </linearGradient>

          {/* Glow effect for line */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        <g opacity="0.1">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={chartMetrics.padding_x}
              y1={chartMetrics.padding_y + chartMetrics.innerHeight * ratio}
              x2={chartMetrics.padding_x + chartMetrics.innerWidth}
              y2={chartMetrics.padding_y + chartMetrics.innerHeight * ratio}
              stroke="white"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
        </g>

        {/* Fill area under curve */}
        <motion.path
          d={chartMetrics.fillPath}
          fill="url(#chartGradient)"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Invisible wider path for easier hovering */}
        <path
          d={chartMetrics.path}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="stroke"
        />

        {/* Main line */}
        <motion.path
          d={chartMetrics.path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          pointerEvents="none"
        />

        {/* Hover indicator */}
        {hoveredPoint && hoveredPoint.x && hoveredPoint.y && (
          <g>
            {/* Vertical line */}
            <line
              x1={hoveredPoint.x}
              y1={chartMetrics.padding_y}
              x2={hoveredPoint.x}
              y2={dimensions.height - chartMetrics.padding_y}
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="4,4"
            />
            
            {/* Horizontal line */}
            <line
              x1={chartMetrics.padding_x}
              y1={hoveredPoint.y}
              x2={chartMetrics.padding_x + chartMetrics.innerWidth}
              y2={hoveredPoint.y}
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeDasharray="4,4"
            />
            
            {/* Point circle */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="5"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
            
            {/* Outer glow circle */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="8"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.3"
            >
              <animate
                attributeName="r"
                from="8"
                to="12"
                dur="1s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.3"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>


          </g>
        )}

        {/* Y-axis labels */}
        <g className="text-xs">
          {[0, 0.5, 1].map((ratio, i) => {
            const value = chartMetrics.minValue + (chartMetrics.maxValue - chartMetrics.minValue) * (1 - ratio);
            const y = chartMetrics.padding_y + chartMetrics.innerHeight * ratio;
            return (
              <text
                key={i}
                x={chartMetrics.padding_x - 8}
                y={y + 4}
                fill="rgba(255,255,255,0.5)"
                fontSize="10"
                textAnchor="end"
              >
                ${value.toFixed(0)}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Floating HTML Tooltip */}
      {hoveredPoint && hoveredPoint.x && hoveredPoint.y && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y}px`,
            transform: hoveredPoint.x && hoveredPoint.x > dimensions.width / 2 
              ? 'translate(-110%, -50%)' 
              : 'translate(10%, -50%)'
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md rounded-xl px-4 py-3 border border-blue-500/30 shadow-2xl shadow-blue-500/20">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400 mb-1">
                ${hoveredPoint.value.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {getTimeLabel(hoveredPoint.timestamp)}
              </div>
              {data.length > 1 && (() => {
                const currentIndex = data.findIndex(d => d.timestamp === hoveredPoint.timestamp);
                if (currentIndex > 0) {
                  const prevValue = data[currentIndex - 1].value;
                  const change = hoveredPoint.value - prevValue;
                  const changePercent = (change / prevValue) * 100;
                  return (
                    <div className={`text-xs font-medium mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)} ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white/[0.03] rounded-lg p-2 sm:p-3 border border-white/[0.08]">
          <p className="text-xs text-gray-400 mb-1">{TIME_RANGES[selectedRange].label} Change</p>
          <p className={`text-sm sm:text-base font-bold ${performanceMetrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {performanceMetrics.isPositive ? '+' : ''}${Math.abs(performanceMetrics.change).toFixed(2)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2 sm:p-3 border border-white/[0.08]">
          <p className="text-xs text-gray-400 mb-1">Low</p>
          <p className="text-sm sm:text-base font-bold text-white">
            ${chartMetrics.minValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2 sm:p-3 border border-white/[0.08]">
          <p className="text-xs text-gray-400 mb-1">High</p>
          <p className="text-sm sm:text-base font-bold text-white">
            ${chartMetrics.maxValue.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
});

PerformanceChart.displayName = 'PerformanceChart';
