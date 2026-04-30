import React, { useEffect, useState } from "react";
import {
  Box, HStack, SimpleGrid, Spinner, Text,
} from "@chakra-ui/react";
import { Server, Cpu, MemoryStick, Clock, HardDrive } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
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
    <Box w="full" h="2" bg={mode === "light" ? "gray.100" : "gray.700"} rounded="full" overflow="hidden">
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

  const cardBg = mode === "light" ? "white" : "gray.800";
  const chartColor = mode === "light" ? "#8b5cf6" : "#a78bfa";
  const chartColorMem = mode === "light" ? "#0ea5e9" : "#38bdf8";

  return (
    <Box mb="10">
      <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wide" mb="4">
        Servidor · Consum en temps real
      </Text>
      <SimpleGrid columns={[1, 1, 3]} gap={[4, 5]} mb="4">
        {/* CPU */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="purple.500"><Cpu size={16} /></Box>
              <Text fontWeight="semibold" fontSize="sm">CPU</Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">{latest?.cpu_count ?? "—"} cores · load {latest?.load_avg_1m ?? "—"}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">{latest?.cpu_pct ?? "—"}%</Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.cpu_pct ?? 0} color="#8b5cf6" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip contentStyle={{ fontSize: 11, padding: "4px 8px" }} formatter={(v: number) => [`${v}%`, "CPU"]} labelFormatter={() => ""} />
                <Area type="monotone" dataKey="cpu" stroke={chartColor} strokeWidth={2} fill="url(#cpuGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* RAM */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="cyan.500"><MemoryStick size={16} /></Box>
              <Text fontWeight="semibold" fontSize="sm">Memòria RAM</Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">{latest ? `${latest.memory_used_mb} / ${latest.memory_total_mb} MB` : "—"}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="cyan.500">{latest?.memory_used_pct ?? "—"}%</Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.memory_used_pct ?? 0} color="#0ea5e9" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColorMem} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColorMem} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip contentStyle={{ fontSize: 11, padding: "4px 8px" }} formatter={(v: number) => [`${v}%`, "RAM"]} labelFormatter={() => ""} />
                <Area type="monotone" dataKey="mem" stroke={chartColorMem} strokeWidth={2} fill="url(#memGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Disc */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="orange.500"><HardDrive size={16} /></Box>
              <Text fontWeight="semibold" fontSize="sm">Disc</Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">{latest ? `${latest.disk_used_gb} / ${latest.disk_total_gb} GB` : "—"}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">{latest?.disk_used_pct ?? "—"}%</Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.disk_used_pct ?? 0} color="#f97316" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: latest?.disk_used_pct ?? 0 }, { value: 100 - (latest?.disk_used_pct ?? 0) }]}
                  cx="50%" cy="50%"
                  innerRadius={24} outerRadius={36}
                  startAngle={90} endAngle={-270}
                  dataKey="value" strokeWidth={0} isAnimationActive={false}
                >
                  <Cell fill="#f97316" />
                  <Cell fill={mode === "light" ? "#e5e7eb" : "#374151"} />
                </Pie>
                <Tooltip
                  formatter={(v: number, _: string, props: { dataIndex?: number }) =>
                    props.dataIndex === 0 ? [`${v}%`, "Usat"] : [`${v}%`, "Lliure"]
                  }
                  contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </SimpleGrid>

      {/* Info row */}
      <SimpleGrid columns={[2, 4]} gap={[3, 4]}>
        {[
          { icon: Clock,     color: "orange.500", label: "Uptime servidor",  value: latest ? formatUptime(latest.uptime_s) : "—" },
          { icon: Server,    color: "green.500",  label: "Mem. procés Node", value: latest ? `${latest.process_memory_mb} MB` : "—" },
          { icon: Cpu,       color: "purple.500", label: "Load avg 1m",      value: latest ? String(latest.load_avg_1m) : "—" },
          { icon: HardDrive, color: "orange.500", label: "Disc lliure",      value: latest ? `${Math.round((latest.disk_total_gb - latest.disk_used_gb) * 10) / 10} GB` : "—" },
        ].map(({ icon: Icon, color, label, value }) => (
          <Box key={label} bg={cardBg} rounded="lg" shadow="sm" px="4" py="3">
            <HStack gap="2" mb="1">
              <Box color={color}><Icon size={14} /></Box>
              <Text fontSize="2xs" color="fg.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">{label}</Text>
            </HStack>
            <Text fontWeight="bold" fontSize="lg">{value}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ServerStatsSection;
