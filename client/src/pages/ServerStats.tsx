import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Server,
  Activity,
  Thermometer,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Chart, useChart } from "@chakra-ui/charts";
import { systemStats } from "../api";
import { useTheme } from "../context/ThemeContext";

interface StatPoint {
  t: string;
  cpu: number;
  mem: number;
  proc: number;
  load1: number;
  load5: number;
  load15: number;
}

const MAX_POINTS = 120;

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
};

const formatBytes = (mb: number) => {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
};

const cpuStatus = (pct: number) => {
  if (pct >= 90) return { label: "Crític", colorScheme: "red" };
  if (pct >= 70) return { label: "Alt", colorScheme: "orange" };
  if (pct >= 40) return { label: "Moderat", colorScheme: "yellow" };
  return { label: "Normal", colorScheme: "green" };
};

/** Circular arc gauge */
const RadialGauge: React.FC<{ pct: number; color: string; size?: number }> = ({
  pct, color, size = 96,
}) => {
  const r = (size - 14) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference * 0.75;
  const filled = arcLen * Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12}
        strokeWidth={12} strokeDasharray={`${arcLen} ${circumference}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
};

const ServerStats: React.FC = () => {
  const { mode } = useTheme();
  const [history, setHistory] = useState<StatPoint[]>([]);
  const [latest, setLatest] = useState<{
    cpu_pct: number; memory_used_pct: number; memory_used_mb: number;
    memory_total_mb: number; disk_used_gb: number; disk_total_gb: number;
    disk_used_pct: number; uptime_s: number; process_memory_mb: number;
    load_avg_1m: number; load_avg_5m: number; load_avg_15m: number; cpu_count: number;
  } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const poll = () => {
      systemStats()
        .then(({ data }) => {
          if (typeof data.cpu_pct !== "number") return;
          setLatest(data);
          setLastUpdate(new Date());
          const point: StatPoint = {
            t: new Date(data.timestamp).toLocaleTimeString("ca-ES", {
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            }),
            cpu: data.cpu_pct,
            mem: data.memory_used_pct,
            proc: Math.round((data.process_memory_mb / data.memory_total_mb) * 100),
            load1: data.load_avg_1m,
            load5: data.load_avg_5m,
            load15: data.load_avg_15m,
          };
          setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const usageChart = useChart({
    data: history,
    series: [
      { name: "cpu",  color: "purple.500", label: "CPU" },
      { name: "mem",  color: "cyan.500",   label: "RAM" },
      { name: "proc", color: "orange.400", label: "Node" },
    ],
  });

  const loadChart = useChart({
    data: history,
    series: [
      { name: "load1",  color: "red.400",    label: "Load 1m" },
      { name: "load5",  color: "yellow.500", label: "Load 5m" },
      { name: "load15", color: "green.500",  label: "Load 15m" },
    ],
  });

  const cardBg   = mode === "light" ? "white"   : "gray.800";
  const gridLine = mode === "light" ? "#e5e7eb" : "#374151";
  const axisTick = mode === "light" ? "#9ca3af" : "#6b7280";
  const subBg    = mode === "light" ? "gray.50"  : "gray.900";

  const memFree = latest ? latest.memory_total_mb - latest.memory_used_mb : 0;
  const diskFree = latest ? Math.round((latest.disk_total_gb - latest.disk_used_gb) * 10) / 10 : 0;
  const cpuState = cpuStatus(latest?.cpu_pct ?? 0);

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="3">
        <HStack gap="3">
          <Box p="2" rounded="lg" bg="purple.500" color="white">
            <Server size={20} />
          </Box>
          <VStack align="start" gap="0">
            <Heading size="md">Consum del Servidor</Heading>
            <Text fontSize="xs" color="fg.muted">
              Actualització cada 3s · {MAX_POINTS} punts d'historial
            </Text>
          </VStack>
        </HStack>
        <HStack gap="3">
          {latest && (
            <Badge colorPalette={cpuState.colorScheme} size="sm">
              CPU {cpuState.label}
            </Badge>
          )}
          <Text fontSize="xs" color="fg.muted">
            {lastUpdate
              ? `Actualitzat: ${lastUpdate.toLocaleTimeString("ca-ES")}`
              : "Carregant…"}
          </Text>
        </HStack>
      </Flex>

      {/* ── Top KPI row ────────────────────────────────────────────── */}
      <SimpleGrid columns={[2, 4]} gap="3" mb="5">
        {[
          { icon: Clock,    color: "purple.400", label: "Uptime",      val: latest ? formatUptime(latest.uptime_s) : "—" },
          { icon: Cpu,      color: "purple.500", label: "Cores",        val: latest ? `${latest.cpu_count} vCPU` : "—" },
          { icon: Server,   color: "cyan.400",   label: "Mem. total",   val: latest ? formatBytes(latest.memory_total_mb) : "—" },
          { icon: HardDrive,color: "orange.400", label: "Disc total",   val: latest ? `${latest.disk_total_gb} GB` : "—" },
        ].map(({ icon: Icon, color, label, val }) => (
          <Box key={label} bg={cardBg} rounded="xl" shadow="sm" px="4" py="3">
            <HStack gap="2" mb="1">
              <Box color={color}><Icon size={13} /></Box>
              <Text fontSize="2xs" color="fg.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                {label}
              </Text>
            </HStack>
            <Text fontWeight="bold" fontSize="lg" lineHeight="1">{val}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* ── Three gauge cards ──────────────────────────────────────── */}
      <SimpleGrid columns={[1, 3]} gap="4" mb="5">
        {/* CPU */}
        <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5">
          <HStack gap="4" align="start">
            <Box position="relative" flexShrink={0}>
              <RadialGauge pct={latest?.cpu_pct ?? 0} color={usageChart.color("purple.500")} size={96} />
              <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="sm" fontWeight="bold" style={{ color: usageChart.color("purple.500") }}>
                  {latest?.cpu_pct ?? 0}%
                </Text>
              </Box>
            </Box>
            <VStack align="start" gap="2" flex="1">
              <HStack gap="1.5">
                <Cpu size={14} style={{ color: usageChart.color("purple.500") }} />
                <Text fontWeight="bold" fontSize="sm">CPU</Text>
              </HStack>
              <Box w="full" h="1.5" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full"
                  style={{ width: `${latest?.cpu_pct ?? 0}%`, background: usageChart.color("purple.500"), transition: "width 0.6s" }} />
              </Box>
              <SimpleGrid columns={3} gap="2" w="full">
                {[
                  { l: "1m",  v: latest?.load_avg_1m },
                  { l: "5m",  v: latest?.load_avg_5m },
                  { l: "15m", v: latest?.load_avg_15m },
                ].map(({ l, v }) => (
                  <Box key={l} bg={subBg} rounded="lg" p="2" textAlign="center">
                    <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">{l}</Text>
                    <Text fontSize="sm" fontWeight="bold">{v ?? "—"}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </HStack>
        </Box>

        {/* RAM */}
        <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5">
          <HStack gap="4" align="start">
            <Box position="relative" flexShrink={0}>
              <RadialGauge pct={latest?.memory_used_pct ?? 0} color={usageChart.color("cyan.500")} size={96} />
              <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="sm" fontWeight="bold" style={{ color: usageChart.color("cyan.500") }}>
                  {latest?.memory_used_pct ?? 0}%
                </Text>
              </Box>
            </Box>
            <VStack align="start" gap="2" flex="1">
              <HStack gap="1.5">
                <MemoryStick size={14} style={{ color: usageChart.color("cyan.500") }} />
                <Text fontWeight="bold" fontSize="sm">RAM</Text>
              </HStack>
              <Box w="full" h="1.5" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full"
                  style={{ width: `${latest?.memory_used_pct ?? 0}%`, background: usageChart.color("cyan.500"), transition: "width 0.6s" }} />
              </Box>
              <SimpleGrid columns={2} gap="2" w="full">
                {[
                  { l: "Usada",   v: latest ? formatBytes(latest.memory_used_mb) : "—" },
                  { l: "Lliure",  v: latest ? formatBytes(memFree) : "—" },
                  { l: "Node",    v: latest ? formatBytes(latest.process_memory_mb) : "—" },
                  { l: "Total",   v: latest ? formatBytes(latest.memory_total_mb) : "—" },
                ].map(({ l, v }) => (
                  <Box key={l} bg={subBg} rounded="lg" p="2">
                    <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">{l}</Text>
                    <Text fontSize="xs" fontWeight="bold" truncate>{v}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </HStack>
        </Box>

        {/* Disc */}
        <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5">
          <HStack gap="4" align="start">
            <Box position="relative" flexShrink={0}>
              <RadialGauge pct={latest?.disk_used_pct ?? 0} color={usageChart.color("orange.400")} size={96} />
              <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="sm" fontWeight="bold" style={{ color: usageChart.color("orange.400") }}>
                  {latest?.disk_used_pct ?? 0}%
                </Text>
              </Box>
            </Box>
            <VStack align="start" gap="2" flex="1">
              <HStack gap="1.5">
                <HardDrive size={14} style={{ color: usageChart.color("orange.400") }} />
                <Text fontWeight="bold" fontSize="sm">Disc</Text>
              </HStack>
              <Box w="full" h="1.5" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full"
                  style={{ width: `${latest?.disk_used_pct ?? 0}%`, background: usageChart.color("orange.400"), transition: "width 0.6s" }} />
              </Box>
              <SimpleGrid columns={2} gap="2" w="full">
                {[
                  { l: "Usat",   v: latest ? `${latest.disk_used_gb} GB` : "—" },
                  { l: "Lliure", v: latest ? `${diskFree} GB` : "—" },
                  { l: "Total",  v: latest ? `${latest.disk_total_gb} GB` : "—" },
                  { l: "Ús",     v: latest ? `${latest.disk_used_pct}%` : "—" },
                ].map(({ l, v }) => (
                  <Box key={l} bg={subBg} rounded="lg" p="2">
                    <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">{l}</Text>
                    <Text fontSize="xs" fontWeight="bold">{v}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* ── CPU + RAM + Node history chart ─────────────────────────── */}
      <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5" mb="5">
        <HStack justify="space-between" mb="4">
          <HStack gap="2">
            <Layers size={14} color={axisTick} />
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Historial d'ús (últims {MAX_POINTS} mostres · cada 3s)
            </Text>
          </HStack>
          <HStack gap="4">
            {usageChart.series.map((s) => (
              <HStack key={s.name} gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" style={{ background: usageChart.color(s.color) }} />
                <Text fontSize="xs" color="fg.muted">{s.label}</Text>
              </HStack>
            ))}
          </HStack>
        </HStack>
        <Chart.Root chart={usageChart} h="200px" aspectRatio="unset">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageChart.data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <Chart.Gradient id="sg-cpu" stops={[
                  { offset: "5%",  color: "purple.500", opacity: 0.3 },
                  { offset: "95%", color: "purple.500", opacity: 0 },
                ]} />
                <Chart.Gradient id="sg-mem" stops={[
                  { offset: "5%",  color: "cyan.500", opacity: 0.25 },
                  { offset: "95%", color: "cyan.500", opacity: 0 },
                ]} />
                <Chart.Gradient id="sg-proc" stops={[
                  { offset: "5%",  color: "orange.400", opacity: 0.2 },
                  { offset: "95%", color: "orange.400", opacity: 0 },
                ]} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: axisTick }} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: axisTick }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={
                <Chart.Tooltip hideLabel={false}
                  formatter={(v, name) => [`${v}%`, name === "cpu" ? "CPU" : name === "mem" ? "RAM" : "Node"]} />
              } />
              <ReferenceLine y={80} stroke={gridLine} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="cpu"  stroke={usageChart.color("purple.500")} strokeWidth={2} fill="url(#sg-cpu)"  dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="mem"  stroke={usageChart.color("cyan.500")}   strokeWidth={2} fill="url(#sg-mem)"  dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="proc" stroke={usageChart.color("orange.400")} strokeWidth={1.5} fill="url(#sg-proc)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Chart.Root>
      </Box>

      {/* ── Load average history chart ──────────────────────────────── */}
      <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5" mb="5">
        <HStack justify="space-between" mb="4">
          <HStack gap="2">
            <Activity size={14} color={axisTick} />
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Càrrega del sistema (load average)
            </Text>
          </HStack>
          <HStack gap="4">
            {loadChart.series.map((s) => (
              <HStack key={s.name} gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" style={{ background: loadChart.color(s.color) }} />
                <Text fontSize="xs" color="fg.muted">{s.label}</Text>
              </HStack>
            ))}
          </HStack>
        </HStack>
        <Chart.Root chart={loadChart} h="180px" aspectRatio="unset">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loadChart.data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: axisTick }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: axisTick }} tickLine={false} axisLine={false} />
              {latest && (
                <ReferenceLine y={latest.cpu_count} stroke={gridLine} strokeDasharray="4 2"
                  label={{ value: `${latest.cpu_count} cores`, fontSize: 9, fill: axisTick, position: "right" }} />
              )}
              <Tooltip content={<Chart.Tooltip hideLabel={false} />} />
              <Line type="monotone" dataKey="load1"  stroke={loadChart.color("red.400")}    strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="load5"  stroke={loadChart.color("yellow.500")} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="load15" stroke={loadChart.color("green.500")}  strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </Chart.Root>
        <Text fontSize="xs" color="fg.muted" mt="2">
          La línia de referència indica el nombre de cores ({latest?.cpu_count ?? "—"}). Load &gt; cores = saturació.
        </Text>
      </Box>

      {/* ── Memory breakdown bar ───────────────────────────────────── */}
      {latest && (
        <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5" mb="5">
          <HStack gap="2" mb="4">
            <Thermometer size={14} color={axisTick} />
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Desglossament de memòria
            </Text>
          </HStack>
          <VStack gap="3">
            {/* Sistema */}
            <Box w="full">
              <Flex justify="space-between" mb="1">
                <Text fontSize="xs" color="fg.muted">Sistema (sense Node)</Text>
                <Text fontSize="xs" fontWeight="bold">
                  {formatBytes(latest.memory_used_mb - latest.process_memory_mb)}
                </Text>
              </Flex>
              <Box w="full" h="2" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full" bg="cyan.500"
                  style={{
                    width: `${Math.round(((latest.memory_used_mb - latest.process_memory_mb) / latest.memory_total_mb) * 100)}%`,
                    transition: "width 0.6s",
                  }} />
              </Box>
            </Box>
            {/* Node process */}
            <Box w="full">
              <Flex justify="space-between" mb="1">
                <Text fontSize="xs" color="fg.muted">Procés Node.js (RSS)</Text>
                <Text fontSize="xs" fontWeight="bold">{formatBytes(latest.process_memory_mb)}</Text>
              </Flex>
              <Box w="full" h="2" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full" bg="orange.400"
                  style={{
                    width: `${Math.round((latest.process_memory_mb / latest.memory_total_mb) * 100)}%`,
                    transition: "width 0.6s",
                  }} />
              </Box>
            </Box>
            {/* Lliure */}
            <Box w="full">
              <Flex justify="space-between" mb="1">
                <Text fontSize="xs" color="fg.muted">Memòria lliure</Text>
                <Text fontSize="xs" fontWeight="bold">{formatBytes(memFree)}</Text>
              </Flex>
              <Box w="full" h="2" bg={subBg} rounded="full" overflow="hidden">
                <Box h="full" rounded="full" bg="green.500"
                  style={{
                    width: `${Math.round((memFree / latest.memory_total_mb) * 100)}%`,
                    transition: "width 0.6s",
                  }} />
              </Box>
            </Box>
          </VStack>
          <Flex justify="flex-end" mt="3">
            <Text fontSize="xs" color="fg.muted">
              Total: {formatBytes(latest.memory_total_mb)}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default ServerStats;
