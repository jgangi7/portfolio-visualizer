import { useMemo, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { Box, Typography } from '@mui/material';
import { StockPosition } from '../types/stock';
import { useColorScale } from '../utils/colorScale';
import { useThemeContext } from '../context/ThemeContext';
import { getSector, getCloudPosition, SECTOR_POSITIONS } from '../utils/sectorMap';

interface PortfolioCloudProps {
  positions: StockPosition[];
}

interface HoverInfo {
  ticker: string;
  sector: string;
  value: number;
  pct: number;
}

interface NodeData {
  ticker: string;
  position: [number, number, number];
  radius: number;
  color: string;
  value: number;
  pct: number;
  sector: string;
}

// ── Single stock sphere ──────────────────────────────────────────────────────
const StockSphere = ({
  ticker, position, radius, color, value, pct, sector, onHover,
}: NodeData & { onHover: (info: HoverInfo | null) => void }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      scale={hovered ? 1.18 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover({ ticker, sector, value, pct });
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.75 : 0.28}
        roughness={0.35}
        metalness={0.15}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
};

// ── Sector label rendered as HTML in 3D space ────────────────────────────────
const SectorLabel = ({
  name, x, z, isDark,
}: { name: string; x: number; z: number; isDark: boolean }) => (
  <Html position={[x, -0.6, z]} center>
    <div style={{
      color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
      fontSize: '10px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    }}>
      {name}
    </div>
  </Html>
);

// ── Tracer lines between all nodes ───────────────────────────────────────────
const TracerLines = ({ nodes, isDark }: { nodes: NodeData[]; isDark: boolean }) => {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        pts.push(...nodes[i].position, ...nodes[j].position);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [nodes]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={isDark ? '#2a3f6a' : '#8fa8c8'}
        transparent
        opacity={isDark ? 0.22 : 0.18}
      />
    </lineSegments>
  );
};

// ── Scene (inside Canvas) ────────────────────────────────────────────────────
const Scene = ({
  nodes, activeSectors, isDark, onHover,
}: {
  nodes: NodeData[];
  activeSectors: string[];
  isDark: boolean;
  onHover: (info: HoverInfo | null) => void;
}) => (
  <>
    <ambientLight intensity={isDark ? 0.45 : 0.65} />
    <pointLight position={[10, 12, 10]} intensity={isDark ? 0.9 : 1.3} />
    <pointLight position={[-10, 6, -10]} intensity={0.4} color={isDark ? '#4477ff' : '#ffffff'} />

    <Grid
      position={[0, -0.3, 0]}
      args={[40, 40]}
      cellSize={2}
      cellThickness={0.4}
      cellColor={isDark ? '#1a2030' : '#c0cad8'}
      sectionSize={6}
      sectionThickness={0.8}
      sectionColor={isDark ? '#2a3856' : '#9aaabf'}
      fadeDistance={40}
      fadeStrength={1.2}
      followCamera={false}
      infiniteGrid
    />

    <TracerLines nodes={nodes} isDark={isDark} />

    {nodes.map((node) => (
      <StockSphere key={node.ticker} {...node} onHover={onHover} />
    ))}

    {activeSectors.map((sector) => {
      const [sx, sz] = SECTOR_POSITIONS[sector] ?? [0, 0];
      return <SectorLabel key={sector} name={sector} x={sx} z={sz} isDark={isDark} />;
    })}
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
const PortfolioCloud = ({ positions }: PortfolioCloudProps) => {
  const { isDarkMode } = useThemeContext();
  const { getColorByPercentage, getTextColorByPercentage } = useColorScale();
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  const totalValue = useMemo(
    () => positions.reduce((s, p) => s + (p.totalValue ?? p.shares * p.purchasePrice), 0),
    [positions],
  );

  const maxValue = useMemo(
    () => Math.max(...positions.map((p) => p.totalValue ?? p.shares * p.purchasePrice), 1),
    [positions],
  );

  const nodes = useMemo<NodeData[]>(() =>
    positions.map((p) => {
      const value = p.totalValue ?? p.shares * p.purchasePrice;
      const pct   = p.gainLossPercentage ?? 0;
      const sector = p.sector ?? getSector(p.ticker);
      return {
        ticker:   p.ticker,
        position: getCloudPosition(p.ticker, value, maxValue, sector),
        radius:   Math.sqrt(value / totalValue) * 2.8 + 0.12,
        color:    getColorByPercentage(pct),
        value,
        pct,
        sector,
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions, totalValue, maxValue],
  );

  const activeSectors = useMemo(
    () => [...new Set(positions.map((p) => p.sector ?? getSector(p.ticker)))],
    [positions],
  );

  if (positions.length === 0) {
    return (
      <Box sx={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Add positions to see the 3D portfolio cloud.
        </Typography>
      </Box>
    );
  }

  const bgColor = isDarkMode ? '#0d1117' : '#eef2f7';

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
        Portfolio Cloud
      </Typography>

      <Box sx={{ position: 'relative', height: 480, borderRadius: 2, overflow: 'hidden' }}>
        {/* Hover card */}
        {hovered && (
          <Box sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 1.5,
            minWidth: 160,
            pointerEvents: 'none',
            boxShadow: 4,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
              {hovered.ticker}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              {hovered.sector}
            </Typography>
            <Typography variant="body2">
              ${hovered.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" sx={{ color: getTextColorByPercentage(hovered.pct), fontWeight: 600 }}>
              {hovered.pct >= 0 ? '+' : ''}{hovered.pct.toFixed(2)}%
            </Typography>
          </Box>
        )}

        <Canvas
          dpr={[1, 2]}
          camera={{ position: [14, 10, 20], fov: 55 }}
          style={{ background: bgColor }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Scene
              nodes={nodes}
              activeSectors={activeSectors}
              isDark={isDarkMode}
              onHover={setHovered}
            />
            <OrbitControls
              enablePan
              enableZoom
              minDistance={4}
              maxDistance={55}
            />
          </Suspense>
        </Canvas>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
        Drag to rotate · Scroll to zoom · Size = position value · Color = gain/loss
      </Typography>
    </Box>
  );
};

export default PortfolioCloud;
