import React, { useEffect, useState } from "react";
import {
  Badge, Box, Dialog, HStack, Portal, SimpleGrid, Spinner, Table, Text,
} from "@chakra-ui/react";
import {
  ShoppingCart, Users, Package, Target, FileText, UserCheck, Wifi, WifiOff, X,
} from "lucide-react";
import { odooKpis, odooHealth, odooRawData } from "../../api";
import { useTheme } from "../../context/ThemeContext.ts";

type OdooRecord = Record<string, unknown>;

interface KpiData {
  sales: number | null;
  customers: number | null;
  products: number | null;
  open_opportunities: number | null;
  unpaid_invoices: number | null;
  employees: number | null;
}

interface ColumnDef {
  label: string;
  render: (r: OdooRecord) => React.ReactNode;
  align?: "right";
}

const partnerName = (v: unknown): string =>
  Array.isArray(v) ? String(v[1] ?? "—") : String(v ?? "—");

const fmt = (n: unknown) =>
  typeof n === "number"
    ? n.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

const fmtDate = (s: unknown) => {
  if (typeof s !== "string" || !s) return "—";
  return new Date(s).toLocaleDateString("ca-ES", { day: "2-digit", month: "short", year: "numeric" });
};

const DETAIL_COLUMNS: Record<string, ColumnDef[]> = {
  sales: [
    { label: "Client",  render: (r) => partnerName(r.partner_id) },
    { label: "Data",    render: (r) => fmtDate(r.date_order), align: "right" },
    { label: "Estat",   render: (r) => <Badge size="xs" variant="subtle">{String(r.state ?? "—")}</Badge> },
    { label: "Import",  render: (r) => <Text fontWeight="semibold">{fmt(r.amount_total)} €</Text>, align: "right" },
  ],
  customers: [
    { label: "Nom",     render: (r) => String(r.name ?? "—") },
    { label: "Email",   render: (r) => String(r.email ?? "—") },
    { label: "Telèfon", render: (r) => String(r.phone ?? r.mobile ?? "—"), align: "right" },
  ],
  products: [
    { label: "Nom",       render: (r) => String(r.name ?? "—") },
    { label: "Categoria", render: (r) => partnerName(r.categ_id) },
    { label: "Preu",      render: (r) => <Text fontWeight="semibold">{fmt(r.list_price)} €</Text>, align: "right" },
  ],
  crm: [
    { label: "Oportunitat", render: (r) => String(r.name ?? "—") },
    { label: "Client",      render: (r) => partnerName(r.partner_id) },
    { label: "Fase",        render: (r) => <Badge size="xs" colorPalette="purple" variant="subtle">{partnerName(r.stage_id)}</Badge> },
    { label: "Import esp.", render: (r) => <Text fontWeight="semibold">{fmt(r.expected_revenue)} €</Text>, align: "right" },
  ],
  invoices: [
    { label: "Client",  render: (r) => partnerName(r.partner_id) },
    { label: "Data",    render: (r) => fmtDate(r.invoice_date), align: "right" },
    { label: "Estat",   render: (r) => <Badge size="xs" colorPalette={r.payment_state === "paid" ? "green" : "red"} variant="subtle">{String(r.payment_state ?? "—")}</Badge> },
    { label: "Import",  render: (r) => <Text fontWeight="semibold" color="red.500">{fmt(r.amount_total)} €</Text>, align: "right" },
  ],
  employees: [
    { label: "Nom",          render: (r) => String(r.name ?? "—") },
    { label: "Departament",  render: (r) => partnerName(r.department_id) },
    { label: "Càrrec",       render: (r) => String(r.job_title ?? "—"), align: "right" },
  ],
};

const KPI_DEFS: {
  key: keyof KpiData;
  label: string;
  icon: React.ElementType;
  color: string;
  domain: string;
  detailTitle: string;
}[] = [
  { key: "sales",              label: "Vendes",       icon: ShoppingCart, color: "blue.500",   domain: "sales",     detailTitle: "Vendes" },
  { key: "customers",          label: "Clients",      icon: Users,        color: "teal.500",   domain: "customers", detailTitle: "Clients" },
  { key: "products",           label: "Productes",    icon: Package,      color: "orange.500", domain: "products",  detailTitle: "Productes" },
  { key: "open_opportunities", label: "Oportunitats", icon: Target,       color: "purple.500", domain: "crm",       detailTitle: "Pipeline CRM" },
  { key: "unpaid_invoices",    label: "Fact. pend.",  icon: FileText,     color: "red.500",    domain: "invoices",  detailTitle: "Factures" },
  { key: "employees",          label: "Empleats",     icon: UserCheck,    color: "green.500",  domain: "employees", detailTitle: "Empleats" },
];

interface Props {
  onConnected: (v: boolean) => void;
}

const OdooKpiSection: React.FC<Props> = ({ onConnected }) => {
  const { mode } = useTheme();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);

  // Detail modal state
  const [detailDomain, setDetailDomain] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailRows, setDetailRows] = useState<OdooRecord[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      odooKpis().then(({ data }) => setKpis(data.data)),
      odooHealth().then(({ data }) => {
        setConnected(data.odoo_connected);
        onConnected(data.odoo_connected);
      }),
    ])
      .catch(() => { setConnected(false); onConnected(false); })
      .finally(() => setLoading(false));
  }, []);

  const openDetail = (domain: string, title: string) => {
    setDetailDomain(domain);
    setDetailTitle(title);
    setDetailRows([]);
    setDetailError(null);
    setDetailLoading(true);
    odooRawData(domain, 25)
      .then(({ data }) => {
        const raw = data.data;
        if (Array.isArray(raw)) {
          setDetailRows(raw as OdooRecord[]);
        } else {
          const err = (raw as { error?: string })?.error;
          setDetailError(err ?? "El mòdul no està disponible en aquest Odoo.");
          setDetailRows([]);
        }
      })
      .catch(() => setDetailError("Error de connexió amb Odoo."))
      .finally(() => setDetailLoading(false));
  };

  const columns = detailDomain ? (DETAIL_COLUMNS[detailDomain] ?? []) : [];

  return (
    <>
      <Box mb="8">
        <HStack mb="4" gap="3" align="center">
          <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            Odoo · Resum en temps real
          </Text>
          {loading ? (
            <Spinner size="xs" color="purple.400" />
          ) : connected ? (
            <Badge colorPalette="green" variant="subtle" gap="1" display="flex" alignItems="center">
              <Wifi size={10} /> Connectat
            </Badge>
          ) : (
            <Badge colorPalette="red" variant="subtle" gap="1" display="flex" alignItems="center">
              <WifiOff size={10} /> Desconnectat
            </Badge>
          )}
        </HStack>

        <SimpleGrid columns={[2, 3, 6]} gap={[3, 4]}>
          {KPI_DEFS.map(({ key, label, icon: Icon, color, domain, detailTitle: title }) => (
            <Box
              key={key}
              bg={mode === "light" ? "white" : "gray.800"}
              rounded="lg"
              shadow="sm"
              px={[4, 5]}
              py={[3, 4]}
              borderTopWidth="3px"
              borderTopColor={color}
              cursor={connected ? "pointer" : "default"}
              transition="all 0.15s"
              _hover={connected ? { shadow: "md", transform: "translateY(-2px)" } : undefined}
              onClick={() => connected && openDetail(domain, title)}
            >
              <HStack gap="2" mb="2">
                <Box color={color}><Icon size={16} /></Box>
                <Text fontSize="2xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                  {label}
                </Text>
              </HStack>
              {loading ? (
                <Spinner size="xs" color="purple.400" />
              ) : (
                <Text fontSize="3xl" fontWeight="bold" lineHeight="1" color={connected ? undefined : "fg.muted"}>
                  {connected && kpis?.[key] != null ? kpis[key] : "—"}
                </Text>
              )}
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Detail dialog */}
      <Dialog.Root open={!!detailDomain} onOpenChange={({ open }) => { if (!open) setDetailDomain(null); }} size="xl">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{detailTitle}</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <Box cursor="pointer" p="1" rounded="md" _hover={{ bg: "bg.muted" }}>
                    <X size={16} />
                  </Box>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body pb="6">
                {detailLoading ? (
                  <Box textAlign="center" py="8"><Spinner color="purple.400" /></Box>
                ) : detailError ? (
                  <Text color="fg.muted" fontSize="sm">{detailError}</Text>
                ) : detailRows.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">Sense dades disponibles.</Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          {columns.map((c) => (
                            <Table.ColumnHeader key={c.label} textAlign={c.align ?? "left"} px="4" py="2" fontSize="xs">
                              {c.label}
                            </Table.ColumnHeader>
                          ))}
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {detailRows.map((row, i) => (
                          <Table.Row key={i}>
                            {columns.map((c) => (
                              <Table.Cell key={c.label} textAlign={c.align ?? "left"} px="4" py="3" fontSize="sm">
                                {c.render(row)}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default OdooKpiSection;
