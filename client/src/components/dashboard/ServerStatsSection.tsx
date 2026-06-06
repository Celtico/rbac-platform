import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Server, Cpu, MemoryStick, Clock, HardDrive, Activity, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Chart, useChart } from "@chakra-ui/charts";
import { systemStats } from "../../api";
import { useTheme } from "../../context/ThemeContext.ts";

interface StatPoint { t: string; cpu: number; mem: number; proc: number }
const MAX_POINTS = 60;

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/** Circular arc gauge — SVG based */
const RadialGauge: React.FC<{ pct: number; color: string; size?: number }> = ({
  pct, color, size = 80,
}) => {
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // Arc spans 270° (from 135° to 405°), start at bottom-left, clockwise
  const arcLen = circumference * 0.75;
  const filled = arcLen * Math.min(pct, 100) / 100;
  const rotation = 135;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(0deg)" }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={10}
        strokeDasharray={`${arcLen} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
};

const ServerStatsSection: React.FC = () => {
  const { mode } = useTheme();
  const [history, setHistory] = useState<StatPoint[]>([]);
  const [latest, setLatest] = useState<{
    cpu_pct: number; memory_used_pct: number; memory_used_mb: number;
    memory_total_mb: number; disk_used_gb: number; disk_total_gb: number;
    disk_used_pct: number; uptime_s: number; process_memory_mb: number;
    load_avg_1m: number; load_avg_5m: number; load_avg_15m: number; cpu_count: number;
  } | null>(null);

  useEffect(() => {
    const poll = () => {
      systemStats()
        .then(({ data }) => {
          if (typeof data.cpu_pct !== "number") return;
          setLatest(data);
          const point: StatPoint = {
            t: new Date(data.timestamp).toLocaleTimeString("ca-ES", {
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            }),
            cpu: data.cpu_pct,
            mem: data.memory_used_pct,
            proc: Math.round((data.process_memory_mb / data.memory_total_mb) * 100),
          };
          setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const chart = useChart({
    data: history,
    series: [
      { name: "cpu",  color: "purple.500", label: "CPU" },
      { name: "mem",  color: "cyan.500",   label: "RAM" },
      { name: "proc", color: "orange.400", label: "Node" },
    ],
  });

  const cardBg   = mode === "light" ? "white"    : "gray.800";
  const gridLine = mode === "light" ? "#e5e7eb"  : "#374151";
  const axisTick = mode === "light" ? "#9ca3af"  : "#6b7280";

  const gauges = [
    {
      icon: Cpu, label: "CPU", color: chart.color("purple.500"),
      pct: latest?.cpu_pct ?? 0,
      val: latest ? `${latest.cpu_pct}%` : "—",
      sub: latest ? `${latest.cpu_count} cors · load ${latest.load_avg_1m}` : "—",
    },
    {
      icon: MemoryStick, label: "RAM", color: chart.color("cyan.500"),
      pct: latest?.memory_used_pct ?? 0,
      val: latest ? `${latest.memory_used_pct}%` : "—",
      sub: latest
        ? `${latest.memory_used_mb.toLocaleString()} / ${latest.memory_total_mb.toLocaleString()} MB`
        : "—",
    },
    {
      icon: HardDrive, label: "Disc", color: chart.color("orange.400"),
      pct: latest?.disk_used_pct ?? 0,
      val: latest ? `${latest.disk_used_pct}%` : "—",
      sub: latest
        ? `${latest.disk_used_gb} / ${latest.disk_total_gb} GB`
        : "—",
    },
  ];

  const infoCards = [
    { icon: Clock,    color: "purple.400", label: "Uptime",       val: latest ? formatUptime(latest.uptime_s) : "—" },
    { icon: Cpu,      color: "blue.400",   label: "Cors CPU",     val: latest ? `${latest.cpu_count} cors` : "—" },
    { icon: Server,   color: "cyan.400",   label: "Mem. Node",    val: latest ? `${latest.process_memory_mb} MB` : "—" },
    { icon: Activity, color: "orange.400", label: "Load 1m",      val: latest ? String(latest.load_avg_1m) : "—" },
    { icon: Activity, color: "yellow.500", label: "Load 5m",      val: latest ? String(latest.load_avg_5m)  : "—" },
    { icon: Activity, color: "green.500",  label: "Load 15m",     val: latest ? String(latest.load_avg_15m) : "—" },
    { icon: HardDrive,color: "red.400",    label: "Disc lliure",  val: latest ? `${Math.round((latest.disk_total_gb - latest.disk_used_gb) * 10) / 10} GB` : "—" },
    { icon: MemoryStick, color: "teal.400", label: "RAM lliure",  val: latest ? `${Math.round((latest.memory_total_mb - latest.memory_used_mb) / 1024 * 10) / 10} GB` : "—" },
  ];

  return (
    <Box mb="8">
      <HStack justify="space-between" mb="4">
        <Text
          fontSize="xs" fontWeight="bold" color="fg.muted"
          textTransform="uppercase" letterSpacing="wide"
        >
          Servidor · Consum en temps real
        </Text>
        <Link to="/admin/system/stats" style={{ textDecoration: "none" }}>
          <HStack gap="0.5" color="purple.500" _hover={{ color: "purple.600" }}>
            <Text fontSize="xs" fontWeight="semibold">Veure tot</Text>
            <ChevronRight size={14} />
          </HStack>
        </Link>
      </HStack>

      {/* ── Gauge cards ───────────────────────────────────────────── */}
      <SimpleGrid columns={[1, 3]} gap="4" mb="4">
        {gauges.map(({ icon: Icon, label, color, pct, val, sub }) => (
          <Box key={label} bg={cardBg} rounded="xl" shadow="sm" px="5" py="4">
            <HStack gap="4" align="center">
              <Box position="relative" flexShrink={0}>
                <RadialGauge pct={pct} color={color} size={80} />
                <Box
                  position="absolute" inset="0"
                  display="flex" alignItems="center" justifyContent="center"
                >
                  <Text fontSize="xs" fontWeight="bold" style={{ color }}>{val}</Text>
                </Box>
              </Box>
              <VStack align="start" gap="1" flex="1" minW="0">
                <HStack gap="1.5">
                  <Icon size={14} style={{ color }} />
                  <Text fontWeight="bold" fontSize="sm">{label}</Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted" truncate>{sub}</Text>
                {/* Thin progress bar */}
                <Box w="full" h="1.5" bg={mode === "light" ? "gray.100" : "gray.700"} rounded="full" overflow="hidden">
                  <Box
                    h="full" rounded="full"
                    style={{ width: `${pct}%`, background: color, transition: "width 0.5s" }}
                  />
                </Box>
              </VStack>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      {/* ── History chart ─────────────────────────────────────────── */}
      <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="5" mb="4">
        <HStack justify="space-between" mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            Historial (últims {MAX_POINTS} punts · cada 3s)
          </Text>
          <HStack gap="4">
            {chart.series.map((s) => (
              <HStack key={s.name} gap="1.5">
                <Box w="2.5" h="2.5" rounded="full" style={{ background: chart.color(s.color) }} />
                <Text fontSize="xs" color="fg.muted">{s.label}</Text>
              </HStack>
            ))}
          </HStack>
        </HStack>
        <Chart.Root chart={chart} h="180px" aspectRatio="unset">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart.data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <Chart.Gradient id="gCpu" stops={[
                  { offset: "5%",  color: "purple.500", opacity: 0.25 },
                  { offset: "95%", color: "purple.500", opacity: 0 },
                ]} />
                <Chart.Gradient id="gMem" stops={[
                  { offset: "5%",  color: "cyan.500", opacity: 0.25 },
                  { offset: "95%", color: "cyan.500", opacity: 0 },
                ]} />
                <Chart.Gradient id="gProc" stops={[
                  { offset: "5%",  color: "orange.400", opacity: 0.2 },
                  { offset: "95%", color: "orange.400", opacity: 0 },
                ]} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10, fill: axisTick }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: axisTick }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={
                  <Chart.Tooltip
                    hideLabel={false}
                    formatter={(v, name) => [`${v}%`, name === "cpu" ? "CPU" : name === "mem" ? "RAM" : "Node"]}
                  />
                }
              />
              <Area type="monotone" dataKey="cpu"  stroke={chart.color("purple.500")} strokeWidth={2} fill="url(#gCpu)"  dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="mem"  stroke={chart.color("cyan.500")}   strokeWidth={2} fill="url(#gMem)"  dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="proc" stroke={chart.color("orange.400")} strokeWidth={1.5} fill="url(#gProc)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Chart.Root>
      </Box>

      {/* ── Info cards ────────────────────────────────────────────── */}
      <SimpleGrid columns={[2, 4, 8]} gap="3">
        {infoCards.map(({ icon: Icon, color, label, val }) => (
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
    </Box>
  );
};

export default ServerStatsSection;
