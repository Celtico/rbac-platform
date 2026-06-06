import React, { useEffect, useState } from "react";
import {
  Box,
  HStack,
  SimpleGrid,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
import { odooRawData } from "../../api";
import { useTheme } from "../../context/ThemeContext.ts";

type OdooRecord = Record<string, unknown>;

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
        <Box overflowX="auto">
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
        </Box>
      )}
    </Box>
  );
};

const OdooLiveSection: React.FC = () => {
  const [sales, setSales] = useState<OdooRecord[]>([]);
  const [invoices, setInvoices] = useState<OdooRecord[]>([]);
  const [crm, setCrm] = useState<OdooRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingCrm, setLoadingCrm] = useState(true);

  useEffect(() => {
    const toRows = (data: unknown): OdooRecord[] =>
      Array.isArray(data)
        ? (data as OdooRecord[])
        : (data as { data?: OdooRecord[] }).data ?? [];

    odooRawData("sales", 5)
      .then(({ data }) => setSales(toRows(data)))
      .catch(() => setSales([]))
      .finally(() => setLoadingSales(false));

    odooRawData("invoices", 5)
      .then(({ data }) => {
        const all = toRows(data);
        setInvoices(
          all.filter(
            (r) =>
              r.payment_state === "not_paid" || r.payment_state === "partial"
          )
        );
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));

    odooRawData("crm", 5)
      .then(({ data }) => setCrm(toRows(data)))
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
          { label: "Fase", render: (r) => partnerName(r.stage_id) },
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

export default OdooLiveSection;
