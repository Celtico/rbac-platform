import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useNavConfig } from "../context/NavConfigContext.ts";
import {
  Box,
  Badge,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  HStack,
  Spinner,
  VStack,
  Table,
} from "@chakra-ui/react";
import type { NavItemDef } from "../context/NavConfigContext.ts";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import {
  ShoppingCart,
  Users,
  Package,
  Target,
  FileText,
  UserCheck,
  Wifi,
  WifiOff,
  TrendingUp,
  AlertCircle,
  Server,
  Cpu,
  MemoryStick,
  Clock,
  HardDrive,
} from "lucide-react";
import { odooKpis, odooHealth, odooRawData, systemStats } from "../api";
import { useTheme } from "../context/ThemeContext.ts";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────

const partnerName = (v: unknown): string => {
  if (Array.isArray(v)) return String(v[1] ?? "—");
  return String(v ?? "—");
};

const fmt = (n: unknown) =>
  typeof n === "number"
    ? n.toLocaleString("ca-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";

const fmtDate = (s: unknown) => {
  if (typeof s !== "string" || !s) return "—";
  return new Date(s).toLocaleDateString("ca-ES", {
    day: "2-digit",
    month: "short",
  });
};

// ── Nav cards ─────────────────────────────────────────────────────────────────

const NavCard: React.FC<{ item: NavItemDef }> = ({ item }) => {
  const Icon: LucideIcon = item.icon;
  const { mode } = useTheme();
  return (
    <Link to={item.path} style={{ textDecoration: "none" }}>
      <Box
        bg={mode === "light" ? "white" : "gray.800"}
        rounded="xl"
        shadow="sm"
        p={[4, 5]}
        overflow="hidden"
        position="relative"
        transition="all 0.2s"
        _hover={{
          shadow: "lg",
          transform: "translateY(-3px)",
          cursor: "pointer",
        }}
        role="group"
      >
        {/* Colored top accent */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="3px"
          style={{ background: `var(--card-accent, #863bff)` }}
          css={{
            "--card-accent": item.color.includes(".") ? undefined : item.color,
          }}
        />

        <HStack justify="space-between" align="flex-start">
          {/* Icon with tinted background */}
          <Box
            p="2.5"
            rounded="lg"
            bg={`${item.color.split(".")[0]}.50`}
            color={item.color}
            _dark={{ bg: `${item.color.split(".")[0]}.900`, opacity: 0.9 }}
          >
            <Icon size={22} />
          </Box>
          {/* Arrow — shows on hover */}
          <Box
            color="fg.subtle"
            opacity={0}
            transform="translateX(-4px)"
            transition="all 0.2s"
            _groupHover={{ opacity: 1, transform: "translateX(0)" }}
          >
            <ArrowRight size={16} />
          </Box>
        </HStack>

        <Text
          mt="3"
          fontWeight="semibold"
          fontSize="sm"
          color={mode === "light" ? "gray.800" : "gray.100"}
        >
          {item.label}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt="0.5">
          {item.path.replace("/admin/", "").replace("/", " › ")}
        </Text>
      </Box>
    </Link>
  );
};

// ── KPI types & defs ──────────────────────────────────────────────────────────

interface KpiData {
  sales: number | null;
  customers: number | null;
  products: number | null;
  open_opportunities: number | null;
  unpaid_invoices: number | null;
  employees: number | null;
}

const KPI_DEFS: {
  key: keyof KpiData;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "sales", label: "Vendes", icon: ShoppingCart, color: "blue.500" },
  { key: "customers", label: "Clients", icon: Users, color: "teal.500" },
  { key: "products", label: "Productes", icon: Package, color: "orange.500" },
  {
    key: "open_opportunities",
    label: "Oportunitats",
    icon: Target,
    color: "purple.500",
  },
  {
    key: "unpaid_invoices",
    label: "Fact. pend.",
    icon: FileText,
    color: "red.500",
  },
  { key: "employees", label: "Empleats", icon: UserCheck, color: "green.500" },
];

// ── KPI section ───────────────────────────────────────────────────────────────

const OdooKpiSection: React.FC<{ onConnected: (v: boolean) => void }> = ({
  onConnected,
}) => {
  const { mode } = useTheme();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      odooKpis().then(({ data }) => setKpis(data.data)),
      odooHealth().then(({ data }) => {
        setConnected(data.odoo_connected);
        onConnected(data.odoo_connected);
      }),
    ])
      .catch(() => {
        setConnected(false);
        onConnected(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box mb="8">
      <HStack mb="4" gap="3" align="center">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Odoo · Resum en temps real
        </Text>
        {loading ? (
          <Spinner size="xs" color="purple.400" />
        ) : connected ? (
          <Badge
            colorPalette="green"
            variant="subtle"
            gap="1"
            display="flex"
            alignItems="center"
          >
            <Wifi size={10} /> Connectat
          </Badge>
        ) : (
          <Badge
            colorPalette="red"
            variant="subtle"
            gap="1"
            display="flex"
            alignItems="center"
          >
            <WifiOff size={10} /> Desconnectat
          </Badge>
        )}
      </HStack>

      <SimpleGrid columns={[2, 3, 6]} gap={[3, 4]}>
        {KPI_DEFS.map(({ key, label, icon: Icon, color }) => (
          <Box
            key={key}
            bg={mode === "light" ? "white" : "gray.800"}
            rounded="lg"
            shadow="sm"
            px={[4, 5]}
            py={[3, 4]}
            borderTopWidth="3px"
            borderTopColor={color}
          >
            <HStack gap="2" mb="2">
              <Box color={color}>
                <Icon size={16} />
              </Box>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {label}
              </Text>
            </HStack>
            {loading ? (
              <Spinner size="xs" color="purple.400" />
            ) : (
              <Text
                fontSize="3xl"
                fontWeight="bold"
                lineHeight="1"
                color={connected ? undefined : "fg.muted"}
              >
                {connected && kpis?.[key] != null ? kpis[key] : "—"}
              </Text>
            )}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

// ── Data panels ───────────────────────────────────────────────────────────────

type OdooRecord = Record<string, unknown>;

interface DataPanelProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  rows: OdooRecord[];
  loading: boolean;
  columns: {
    label: string;
    render: (r: OdooRecord) => React.ReactNode;
    align?: "right";
  }[];
  emptyText?: string;
}

const DataPanel: React.FC<DataPanelProps> = ({
  title,
  icon: Icon,
  iconColor,
  rows,
  loading,
  columns,
  emptyText,
}) => {
  const { mode } = useTheme();
  return (
    <Box
      bg={mode === "light" ? "white" : "gray.800"}
      rounded="lg"
      shadow="sm"
      overflow="hidden"
    >
      <HStack px="5" py="4" borderBottomWidth="1px" gap="2">
        <Box color={iconColor}>
          <Icon size={16} />
        </Box>
        <Text fontWeight="semibold" fontSize="sm">
          {title}
        </Text>
      </HStack>
      {loading ? (
        <Box p="6" textAlign="center">
          <Spinner size="sm" color="purple.400" />
        </Box>
      ) : rows.length === 0 ? (
        <Box p="6">
          <Text fontSize="sm" color="fg.muted">
            {emptyText ?? "Sense dades"}
          </Text>
        </Box>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              {columns.map((c) => (
                <Table.ColumnHeader
                  key={c.label}
                  textAlign={c.align ?? "left"}
                  px="5"
                  py="2"
                  fontSize="xs"
                >
                  {c.label}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row, i) => (
              <Table.Row key={i}>
                {columns.map((c) => (
                  <Table.Cell
                    key={c.label}
                    textAlign={c.align ?? "left"}
                    px="5"
                    py="3"
                    fontSize="sm"
                  >
                    {c.render(row)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
};

// ── Server stats ──────────────────────────────────────────────────────────────

interface StatPoint {
  t: string;
  cpu: number;
  mem: number;
}

const MAX_POINTS = 30;

const formatUptime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const GaugeBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const { mode } = useTheme();
  return (
    <Box
      w="full"
      h="2"
      bg={mode === "light" ? "gray.100" : "gray.700"}
      rounded="full"
      overflow="hidden"
    >
      <Box
        h="full"
        w={`${pct}%`}
        style={{ background: color }}
        rounded="full"
        transition="width 0.5s"
      />
    </Box>
  );
};

const ServerStatsSection: React.FC = () => {
  const { mode } = useTheme();
  const [history, setHistory] = useState<StatPoint[]>([]);
  const [latest, setLatest] = useState<{
    cpu_pct: number;
    memory_used_pct: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_used_gb: number;
    disk_total_gb: number;
    disk_used_pct: number;
    uptime_s: number;
    process_memory_mb: number;
    load_avg_1m: number;
    cpu_count: number;
  } | null>(null);

  useEffect(() => {
    const poll = () => {
      systemStats()
        .then(({ data }) => {
          if (typeof data.cpu_pct !== "number") return; // server not ready yet
          setLatest(data);
          const point: StatPoint = {
            t: new Date(data.timestamp).toLocaleTimeString("ca-ES", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
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
      <Text
        fontSize="xs"
        fontWeight="bold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb="4"
      >
        Servidor · Consum en temps real
      </Text>
      <SimpleGrid columns={[1, 1, 3]} gap={[4, 5]} mb="4">
        {/* CPU chart */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="purple.500">
                <Cpu size={16} />
              </Box>
              <Text fontWeight="semibold" fontSize="sm">
                CPU
              </Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">
                {latest?.cpu_count ?? "—"} cores · load{" "}
                {latest?.load_avg_1m ?? "—"}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {latest?.cpu_pct ?? "—"}%
              </Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.cpu_pct ?? 0} color="#8b5cf6" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                  formatter={(v: number) => [`${v}%`, "CPU"]}
                  labelFormatter={() => ""}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#cpuGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Memory chart */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="cyan.500">
                <MemoryStick size={16} />
              </Box>
              <Text fontWeight="semibold" fontSize="sm">
                Memòria RAM
              </Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">
                {latest
                  ? `${latest.memory_used_mb} / ${latest.memory_total_mb} MB`
                  : "—"}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="cyan.500">
                {latest?.memory_used_pct ?? "—"}%
              </Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.memory_used_pct ?? 0} color="#0ea5e9" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColorMem}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColorMem}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: "4px 8px" }}
                  formatter={(v: number) => [`${v}%`, "RAM"]}
                  labelFormatter={() => ""}
                />
                <Area
                  type="monotone"
                  dataKey="mem"
                  stroke={chartColorMem}
                  strokeWidth={2}
                  fill="url(#memGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        {/* Disk chart */}
        <Box bg={cardBg} rounded="lg" shadow="sm" p="5">
          <HStack mb="3" justify="space-between">
            <HStack gap="2">
              <Box color="orange.500">
                <HardDrive size={16} />
              </Box>
              <Text fontWeight="semibold" fontSize="sm">
                Disc
              </Text>
            </HStack>
            <HStack gap="3" align="center">
              <Text fontSize="xs" color="fg.muted">
                {latest
                  ? `${latest.disk_used_gb} / ${latest.disk_total_gb} GB`
                  : "—"}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {latest?.disk_used_pct ?? "—"}%
              </Text>
            </HStack>
          </HStack>
          <GaugeBar pct={latest?.disk_used_pct ?? 0} color="#f97316" />
          <Box mt="3" h="80px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: latest?.disk_used_pct ?? 0 },
                    { value: 100 - (latest?.disk_used_pct ?? 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  <Cell fill="#f97316" />
                  <Cell fill={mode === "light" ? "#e5e7eb" : "#374151"} />
                </Pie>
                <Tooltip
                  formatter={(
                    v: number,
                    _: string,
                    props: { dataIndex?: number }
                  ) =>
                    props.dataIndex === 0
                      ? [`${v}%`, "Usat"]
                      : [`${v}%`, "Lliure"]
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
          {
            icon: Clock,
            color: "orange.500",
            label: "Uptime servidor",
            value: latest ? formatUptime(latest.uptime_s) : "—",
          },
          {
            icon: Server,
            color: "green.500",
            label: "Mem. procés Node",
            value: latest ? `${latest.process_memory_mb} MB` : "—",
          },
          {
            icon: Cpu,
            color: "purple.500",
            label: "Load avg 1m",
            value: latest ? String(latest.load_avg_1m) : "—",
          },
          {
            icon: HardDrive,
            color: "orange.500",
            label: "Disc lliure",
            value: latest
              ? `${
                  Math.round(
                    (latest.disk_total_gb - latest.disk_used_gb) * 10
                  ) / 10
                } GB`
              : "—",
          },
        ].map(({ icon: Icon, color, label, value }) => (
          <Box key={label} bg={cardBg} rounded="lg" shadow="sm" px="4" py="3">
            <HStack gap="2" mb="1">
              <Box color={color}>
                <Icon size={14} />
              </Box>
              <Text
                fontSize="2xs"
                color="fg.muted"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {label}
              </Text>
            </HStack>
            <Text fontWeight="bold" fontSize="lg">
              {value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

// ── Odoo live data section ────────────────────────────────────────────────────

const OdooLiveSection: React.FC = () => {
  const [sales, setSales] = useState<OdooRecord[]>([]);
  const [invoices, setInvoices] = useState<OdooRecord[]>([]);
  const [crm, setCrm] = useState<OdooRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingCrm, setLoadingCrm] = useState(true);

  useEffect(() => {
    odooRawData("sales", 8)
      .then(({ data }) => setSales((data.data as OdooRecord[]) ?? []))
      .catch(() => setSales([]))
      .finally(() => setLoadingSales(false));

    odooRawData("invoices", 8)
      .then(({ data }) => {
        const all = (data.data as OdooRecord[]) ?? [];
        setInvoices(
          all.filter(
            (r) =>
              r.payment_state === "not_paid" || r.payment_state === "partial"
          )
        );
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));

    odooRawData("crm", 8)
      .then(({ data }) => setCrm((data.data as OdooRecord[]) ?? []))
      .catch(() => setCrm([]))
      .finally(() => setLoadingCrm(false));
  }, []);

  return (
    <SimpleGrid columns={[1, 1, 3]} gap={[4, 5]} mb="10">
      <DataPanel
        title="Vendes recents"
        icon={TrendingUp}
        iconColor="blue.500"
        rows={sales}
        loading={loadingSales}
        columns={[
          { label: "Client", render: (r) => partnerName(r.partner_id) },
          {
            label: "Data",
            render: (r) => fmtDate(r.date_order),
            align: "right",
          },
          {
            label: "Import",
            render: (r) => (
              <Text fontWeight="semibold">{fmt(r.amount_total)} €</Text>
            ),
            align: "right",
          },
        ]}
        emptyText="Sense comandes recents"
      />

      <DataPanel
        title="Factures pendents"
        icon={AlertCircle}
        iconColor="red.500"
        rows={invoices}
        loading={loadingInvoices}
        columns={[
          { label: "Client", render: (r) => partnerName(r.partner_id) },
          {
            label: "Data",
            render: (r) => fmtDate(r.invoice_date),
            align: "right",
          },
          {
            label: "Import",
            render: (r) => (
              <Text fontWeight="semibold" color="red.500">
                {fmt(r.amount_total)} €
              </Text>
            ),
            align: "right",
          },
        ]}
        emptyText="Cap factura pendent"
      />

      <DataPanel
        title="Pipeline CRM"
        icon={Target}
        iconColor="purple.500"
        rows={crm}
        loading={loadingCrm}
        columns={[
          {
            label: "Oportunitat",
            render: (r) => (
              <Text truncate maxW="28">
                {String(r.name ?? "—")}
              </Text>
            ),
          },
          {
            label: "Fase",
            render: (r) => (
              <Badge size="xs" colorPalette="purple" variant="subtle">
                {partnerName(r.stage_id)}
              </Badge>
            ),
          },
          {
            label: "Import esp.",
            render: (r) => (
              <Text fontWeight="semibold">{fmt(r.expected_revenue)} €</Text>
            ),
            align: "right",
          },
        ]}
        emptyText="Sense oportunitats obertes"
      />
    </SimpleGrid>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const { items, isEnabled } = useNavConfig();
  const [odooConnected, setOdooConnected] = useState(false);

  const visibleCards = items.filter(
    (item) =>
      isEnabled("dashboard", item.id) &&
      (!item.permission || hasPermission(item.permission))
  );

  const canUseAI = hasPermission("use:ai");

  return (
    <Box>
      <Heading size="2xl" mb="8">
        Dashboard
      </Heading>

      {canUseAI && <OdooKpiSection onConnected={setOdooConnected} />}
      {canUseAI && odooConnected && <OdooLiveSection />}
      <ServerStatsSection />

      {visibleCards.length === 0 ? (
        <Text color="fg.muted">
          No hi ha elements actius. Configura el sidebar a{" "}
          <Link
            to="/admin/settings/sidebar"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Settings → Sidebar
          </Link>
          .
        </Text>
      ) : (
        <>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb="4"
          >
            Accés ràpid
          </Text>
          <SimpleGrid columns={[2, 3, 4, 6]} gap={[4, 5]}>
            {visibleCards.map((item) => (
              <NavCard key={item.id} item={item} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
