import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { odooHealth, odooRawData, odooKpis } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Box,
  Badge,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  SimpleGrid,
  Spinner,
  Table,
  Text,
  VStack,
  IconButton,
  Tabs,
} from "@chakra-ui/react";
import {
  Database,
  Edit2,
  Globe,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Users,
  ShoppingCart,
  FileText,
  TrendingUp,
  Package,
  Briefcase,
  FolderOpen,
  Warehouse,
  Building2,
} from "lucide-react";
import { toaster } from "../components/ui/toaster";

const DOMAINS = [
  { key: "sales",      label: "Vendes",       icon: ShoppingCart },
  { key: "invoices",   label: "Factures",     icon: FileText },
  { key: "customers",  label: "Clients",      icon: Users },
  { key: "crm",        label: "CRM",          icon: TrendingUp },
  { key: "products",   label: "Productes",    icon: Package },
  { key: "stock",      label: "Estoc",        icon: Warehouse },
  { key: "purchases",  label: "Compres",      icon: Briefcase },
  { key: "employees",  label: "Empleats",     icon: Users },
  { key: "projects",   label: "Projectes",    icon: FolderOpen },
] as const;

type Domain = typeof DOMAINS[number]["key"];

interface HealthData {
  status: string;
  odoo_connected: boolean;
  odoo_url: string;
  tenant?: string;
}

interface KpiData {
  sales: number | null;
  customers: number | null;
  products: number | null;
  open_opportunities: number | null;
  unpaid_invoices: number | null;
  employees: number | null;
}

interface Tenant {
  id: number;
  name: string;
  odooUrl: string;
  odooDb: string;
  odooUser: string;
}

interface TenantForm {
  odooUrl: string;
  odooDb: string;
  odooUser: string;
  odooPassword: string;
}

const OdooManager: React.FC = () => {
  const { hasPermission } = useAuth();
  const { mode } = useTheme();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Domain>("sales");
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableLimit, setTableLimit] = useState(20);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editing, setEditing] = useState<(TenantForm & { id: number; name: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission("manage:tenants");
  const canReadTenants = hasPermission("read:tenants") || canManage;

  const cardBg = mode === "light" ? "white" : "gray.800";
  const subBg  = mode === "light" ? "gray.50" : "gray.900";

  const fetchHealth = useCallback(() => {
    setHealthLoading(true);
    odooHealth()
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  const fetchKpis = useCallback(() => {
    setKpisLoading(true);
    odooKpis()
      .then(({ data }) => setKpis(data))
      .catch(() => setKpis(null))
      .finally(() => setKpisLoading(false));
  }, []);

  const fetchDomain = useCallback((domain: Domain, limit: number) => {
    setTableLoading(true);
    setTableData([]);
    odooRawData(domain, limit)
      .then(({ data }) => setTableData(Array.isArray(data) ? (data as Record<string, unknown>[]) : []))
      .catch(() => setTableData([]))
      .finally(() => setTableLoading(false));
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchKpis();
  }, [fetchHealth, fetchKpis]);

  useEffect(() => {
    fetchDomain(activeTab, tableLimit);
  }, [activeTab, tableLimit, fetchDomain]);

  useEffect(() => {
    if (!canReadTenants) return;
    api.get<Tenant[]>("/tenants").then(({ data }) => setTenants(data)).catch(() => {});
  }, [canReadTenants]);

  const matchedTenant = tenants.find(
    (t) => t.odooUrl === health?.odoo_url || t.name === health?.tenant
  ) ?? tenants[0] ?? null;

  const handleEditOpen = () => {
    if (!matchedTenant) return;
    setEditing({
      id: matchedTenant.id,
      name: matchedTenant.name,
      odooUrl: matchedTenant.odooUrl,
      odooDb: matchedTenant.odooDb,
      odooUser: matchedTenant.odooUser,
      odooPassword: "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/tenants/${editing.id}`, {
        odooUrl: editing.odooUrl,
        odooDb: editing.odooDb,
        odooUser: editing.odooUser,
        ...(editing.odooPassword ? { odooPassword: editing.odooPassword } : {}),
      });
      toaster.create({ type: "success", title: "Configuració Odoo guardada" });
      setEditing(null);
      fetchHealth();
      fetchKpis();
    } catch {
      toaster.create({ type: "error", title: "Error guardant la configuració" });
    } finally {
      setSaving(false);
    }
  };

  const kpiCards = [
    { label: "Vendes",          val: kpis?.sales,               color: "purple.500" },
    { label: "Clients",         val: kpis?.customers,           color: "cyan.500" },
    { label: "Productes",       val: kpis?.products,            color: "blue.500" },
    { label: "Oportunitats",    val: kpis?.open_opportunities,  color: "orange.500" },
    { label: "Fact. pendents",  val: kpis?.unpaid_invoices,     color: "red.500" },
    { label: "Empleats",        val: kpis?.employees,           color: "green.500" },
  ];

  const tableKeys = tableData.length > 0
    ? Object.keys(tableData[0]).slice(0, 6)
    : [];

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="3">
        <HStack gap="3">
          <Box p="2" rounded="lg" bg="orange.500" color="white">
            <Database size={20} />
          </Box>
          <VStack align="start" gap="0">
            <Heading size="md">Gestor Odoo</Heading>
            <Text fontSize="xs" color="fg.muted">Connexió, KPIs i explorador de dades</Text>
          </VStack>
        </HStack>
        <IconButton
          aria-label="Recarregar"
          size="sm"
          variant="ghost"
          onClick={() => { fetchHealth(); fetchKpis(); fetchDomain(activeTab, tableLimit); }}
        >
          <RefreshCw size={16} />
        </IconButton>
      </Flex>

      {/* ── Connection card ────────────────────────────────────────── */}
      <Box bg={cardBg} rounded="xl" shadow="sm" px="5" py="4" mb="5">
        <Flex justify="space-between" align="center" wrap="wrap" gap="3">
          <HStack gap="4">
            {healthLoading ? (
              <Spinner size="sm" />
            ) : health?.odoo_connected ? (
              <Box color="green.500"><Wifi size={20} /></Box>
            ) : (
              <Box color="red.500"><WifiOff size={20} /></Box>
            )}
            <VStack align="start" gap="0.5">
              <HStack gap="2">
                <Text fontWeight="semibold" fontSize="sm">
                  {health?.tenant ?? "Odoo"}
                </Text>
                {!healthLoading && (
                  <Badge
                    colorPalette={health?.odoo_connected ? "green" : "red"}
                    size="sm"
                  >
                    {health?.odoo_connected ? "Connectat" : "Desconnectat"}
                  </Badge>
                )}
              </HStack>
              <HStack gap="1" color="fg.muted">
                <Globe size={12} />
                <Text fontSize="xs">{health?.odoo_url ?? "—"}</Text>
              </HStack>
              {matchedTenant && (
                <HStack gap="1" color="fg.muted">
                  <Server size={12} />
                  <Text fontSize="xs">BD: {matchedTenant.odooDb} · Usuari: {matchedTenant.odooUser}</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          {canManage && matchedTenant && (
            <Button size="sm" variant="outline" onClick={handleEditOpen}>
              <Edit2 size={14} style={{ marginRight: "6px" }} />
              Editar connexió
            </Button>
          )}
        </Flex>
      </Box>

      {/* ── KPI cards ──────────────────────────────────────────────── */}
      <SimpleGrid columns={[2, 3, 6]} gap="3" mb="5">
        {kpiCards.map(({ label, val, color }) => (
          <Box key={label} bg={cardBg} rounded="xl" shadow="sm" px="4" py="3">
            <Text fontSize="2xs" color="fg.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" mb="1">
              {label}
            </Text>
            {kpisLoading ? (
              <Spinner size="xs" />
            ) : (
              <Text fontWeight="bold" fontSize="2xl" lineHeight="1" style={{ color: `var(--chakra-colors-${color.replace(".", "-")})` }}>
                {val ?? "—"}
              </Text>
            )}
          </Box>
        ))}
      </SimpleGrid>

      {/* ── Domain explorer ────────────────────────────────────────── */}
      <Box bg={cardBg} rounded="xl" shadow="sm" overflow="hidden">
        <Flex
          px="5" py="3"
          borderBottom="1px solid"
          borderColor={mode === "light" ? "gray.100" : "gray.700"}
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="2"
        >
          <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            Explorador de dades
          </Text>
          <HStack gap="2">
            <Text fontSize="xs" color="fg.muted">Límit:</Text>
            {[10, 25, 50].map((n) => (
              <Button
                key={n}
                size="2xs"
                variant={tableLimit === n ? "solid" : "ghost"}
                colorPalette={tableLimit === n ? "purple" : undefined}
                onClick={() => setTableLimit(n)}
              >
                {n}
              </Button>
            ))}
          </HStack>
        </Flex>

        <Tabs.Root
          value={activeTab}
          onValueChange={({ value }) => setActiveTab(value as Domain)}
          variant="line"
        >
          <Box
            overflowX="auto"
            borderBottom="1px solid"
            borderColor={mode === "light" ? "gray.100" : "gray.700"}
            bg={subBg}
          >
            <Tabs.List px="4" gap="0" flexWrap="nowrap" minW="max-content">
              {DOMAINS.map(({ key, label, icon: Icon }) => (
                <Tabs.Trigger key={key} value={key} fontSize="xs" px="3" py="2.5">
                  <Icon size={13} style={{ marginRight: "5px" }} />
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Box>

          {DOMAINS.map(({ key }) => (
            <Tabs.Content key={key} value={key} p="0">
              {tableLoading ? (
                <Flex justify="center" py="10">
                  <Spinner color="purple.500" />
                </Flex>
              ) : tableData.length === 0 ? (
                <Flex justify="center" py="10">
                  <Text fontSize="sm" color="fg.muted">Cap registre</Text>
                </Flex>
              ) : (
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row bg={subBg}>
                        {tableKeys.map((k) => (
                          <Table.ColumnHeader key={k} fontSize="xs" py="2" px="4" whiteSpace="nowrap">
                            {k}
                          </Table.ColumnHeader>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {tableData.map((row, i) => (
                        <Table.Row key={i}>
                          {tableKeys.map((k) => (
                            <Table.Cell key={k} fontSize="xs" px="4" py="2" whiteSpace="nowrap" maxW="200px" overflow="hidden" textOverflow="ellipsis">
                              {String(row[k] ?? "—")}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </Box>

      {/* ── Edit config dialog ─────────────────────────────────────── */}
      {editing && (
        <Dialog.Root open onOpenChange={({ open }) => { if (!open) setEditing(null); }}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="md">
                <Dialog.Header>
                  <Dialog.Title>
                    <HStack gap="2">
                      <Building2 size={18} />
                      <span>Connexió Odoo · {editing.name}</span>
                    </HStack>
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <VStack gap="4">
                    <Field.Root>
                      <Field.Label fontSize="sm">URL d'Odoo</Field.Label>
                      <Input
                        value={editing.odooUrl}
                        onChange={(e) => setEditing({ ...editing, odooUrl: e.target.value })}
                        placeholder="http://localhost:8069"
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="sm">Base de dades</Field.Label>
                      <Input
                        value={editing.odooDb}
                        onChange={(e) => setEditing({ ...editing, odooDb: e.target.value })}
                        placeholder="odoo_db"
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="sm">Usuari</Field.Label>
                      <Input
                        value={editing.odooUser}
                        onChange={(e) => setEditing({ ...editing, odooUser: e.target.value })}
                        placeholder="admin"
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="sm">Contrasenya <Text as="span" color="fg.muted" fontSize="xs">(deixa buit per no canviar)</Text></Field.Label>
                      <Input
                        type="password"
                        value={editing.odooPassword}
                        onChange={(e) => setEditing({ ...editing, odooPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </Field.Root>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="ghost" onClick={() => setEditing(null)}>Cancel·lar</Button>
                  <Button colorPalette="orange" loading={saving} onClick={handleSave}>
                    Guardar
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
};

export default OdooManager;
