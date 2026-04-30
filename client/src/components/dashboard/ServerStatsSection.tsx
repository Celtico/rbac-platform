import React, { useEffect, useState } from "react";
import { Box, Grid, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { Server, Cpu, MemoryStick, Clock, HardDrive } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Chart, useChart } from "@chakra-ui/charts";
import { systemStats } from "../../api";
import { useTheme } from "../../context/ThemeContext.ts";

interface StatPoint { t: string; cpu: number; mem: number }
const MAX_POINTS = 30;

const formatUptime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const GaugeBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const { mode } = useTheme();
  return (
    <Box w="full" h="1.5" bg={mode === "light" ? "gray.100" : "gray.700"} rounded="full" overflow="hidden">
      <Box h="full" w={`${pct}%`} style={{ background: color }} rounded="full" transition="width 0.5s" />
    </Box>
  );
};

const ServerStatsSection: React.FC = () => {
  const { mode } = useTheme();
  const [history, setHistory] = useState<StatPoint[]>([]);
  const [latest, setLatest] = useState<{
    cpu_pct: number; memory_used_pct: number; memory_used_mb: number;
    memory_total_mb: number; disk_used_gb: number; disk_total_gb: number;
    disk_used_pct: number; uptime_s: number; process_memory_mb: number;
    load_avg_1m: number; cpu_count: number;
  } | null>(null);

  useEffect(() => {
    const poll = () => {
      systemStats()
        .then(({ data }) => {
          if (typeof data.cpu_pct !== "number") return;
          setLatest(data);
          const point: StatPoint = {
            t: new Date(data.timestamp).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            cpu: data.cpu_pct,
            mem: data.memory_used_pct,
          };
          setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const cpuChart = useChart({ data: history, series: [{ name: "cpu", color: "purple.500", label: "CPU" }] });
  const memChart = useChart({ data: history, series: [{ name: "mem", color: "cyan.500", label: "RAM" }] });

  const cardBg = mode === "light" ? "white" : "gray.800";

  const metrics = [
    {
      icon: Cpu, color: "purple.500", hexColor: cpuChart.color("purple.500"),
      label: "CPU",
      sub: latest ? `${latest.cpu_count} cores · load ${latest.load_avg_1m}` : "—",
      pct: latest?.cpu_pct ?? 0,
      val: latest ? `${latest.cpu_pct}%` : "—",
    },
    {
      icon: MemoryStick, color: "cyan.500", hexColor: memChart.color("cyan.500"),
      label: "RAM",
      sub: latest ? `${latest.memory_used_mb} / ${latest.memory_total_mb} MB` : "—",
      pct: latest?.memory_used_pct ?? 0,
      val: latest ? `${latest.memory_used_pct}%` : "—",
    },
    {
      icon: HardDrive, color: "orange.500", hexColor: "#f97316",
      label: "Disc",
      sub: latest ? `${latest.disk_used_gb} / ${latest.disk_total_gb} GB` : "—",
      pct: latest?.disk_used_pct ?? 0,
      val: latest ? `${latest.disk_used_pct}%` : "—",
    },
  ];

  const infoStats = [
    { icon: Clock,     color: "orange.500", label: "Uptime",    value: latest ? formatUptime(latest.uptime_s) : "—" },
    { icon: Server,    color: "green.500",  label: "Node mem",  value: latest ? `${latest.process_memory_mb} MB` : "—" },
    { icon: Cpu,       color: "purple.500", label: "Load 1m",   value: latest ? String(latest.load_avg_1m) : "—" },
    { icon: HardDrive, color: "orange.500", label: "Disc lliure", value: latest ? `${Math.round((latest.disk_total_gb - latest.disk_used_gb) * 10) / 10} GB` : "—" },
  ];

  return (
    <Box mb="8">
      <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="3">
        Servidor · Consum en temps real
      </Text>

      <Grid templateColumns={["1fr", "1fr", "1fr auto"]} gap="3">
        {/* Metrics card */}
        <Box bg={cardBg} rounded="lg" shadow="sm" px="5" py="4">
          <Box spaceY="3">
            {metrics.map(({ icon: Icon, color, hexColor, label, sub, pct, val }) => (
              <HStack key={label} gap="3" align="center">
                <Box color={color} flexShrink={0}><Icon size={14} /></Box>
                <Text fontSize="xs" fontWeight="semibold" w="8" flexShrink={0}>{label}</Text>
                <Text fontSize="xs" color="fg.muted" w="32" flexShrink={0} truncate>{sub}</Text>
                <Box flex="1"><GaugeBar pct={pct} color={hexColor} /></Box>
                <Text fontSize="sm" fontWeight="bold" color={color} w="10" textAlign="right" flexShrink={0}>{val}</Text>
              </HStack>
            ))}
          </Box>
        </Box>

        {/* Sparklines card */}
        <Box bg={cardBg} rounded="lg" shadow="sm" px="4" py="4" minW={["full", "full", "220px"]}>
          <Chart.Root chart={cpuChart} h="40px" aspectRatio="unset" mb="2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuChart.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <Chart.Gradient id="cpuGrad2" stops={[
                    { offset: "5%", color: "purple.500", opacity: 0.3 },
                    { offset: "95%", color: "purple.500", opacity: 0 },
                  ]} />
                </defs>
                <XAxis dataKey="t" hide /><YAxis domain={[0, 100]} hide />
                <Tooltip content={<Chart.Tooltip hideLabel formatter={(v) => [`${v}%`, "CPU"]} />} />
                <Area type="monotone" dataKey="cpu" stroke={cpuChart.color("purple.500")} strokeWidth={1.5} fill="url(#cpuGrad2)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Chart.Root>
          <Chart.Root chart={memChart} h="40px" aspectRatio="unset">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memChart.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <Chart.Gradient id="memGrad2" stops={[
                    { offset: "5%", color: "cyan.500", opacity: 0.3 },
                    { offset: "95%", color: "cyan.500", opacity: 0 },
                  ]} />
                </defs>
                <XAxis dataKey="t" hide /><YAxis domain={[0, 100]} hide />
                <Tooltip content={<Chart.Tooltip hideLabel formatter={(v) => [`${v}%`, "RAM"]} />} />
                <Area type="monotone" dataKey="mem" stroke={memChart.color("cyan.500")} strokeWidth={1.5} fill="url(#memGrad2)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Chart.Root>
        </Box>
      </Grid>

      {/* Info stats */}
      <SimpleGrid columns={[2, 4]} gap="3" mt="3">
        {infoStats.map(({ icon: Icon, color, label, value }) => (
          <HStack key={label} bg={cardBg} rounded="lg" shadow="sm" px="4" py="2.5" gap="2.5">
            <Box color={color} flexShrink={0}><Icon size={13} /></Box>
            <Box>
              <Text fontSize="2xs" color="fg.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">{label}</Text>
              <Text fontWeight="bold" fontSize="sm" lineHeight="1.2">{value}</Text>
            </Box>
          </HStack>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ServerStatsSection;
