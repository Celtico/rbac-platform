import React, { useEffect, useState } from "react";
import {
  Badge, Box, HStack, SimpleGrid, Spinner, Text,
} from "@chakra-ui/react";
import {
  ShoppingCart, Users, Package, Target, FileText, UserCheck, Wifi, WifiOff,
} from "lucide-react";
import { odooKpis, odooHealth } from "../../api";
import { useTheme } from "../../context/ThemeContext.ts";

interface KpiData {
  sales: number | null;
  customers: number | null;
  products: number | null;
  open_opportunities: number | null;
  unpaid_invoices: number | null;
  employees: number | null;
}

const KPI_DEFS: { key: keyof KpiData; label: string; icon: React.ElementType; color: string }[] = [
  { key: "sales",              label: "Vendes",       icon: ShoppingCart, color: "blue.500"   },
  { key: "customers",          label: "Clients",       icon: Users,        color: "teal.500"   },
  { key: "products",           label: "Productes",     icon: Package,      color: "orange.500" },
  { key: "open_opportunities", label: "Oportunitats",  icon: Target,       color: "purple.500" },
  { key: "unpaid_invoices",    label: "Fact. pend.",   icon: FileText,     color: "red.500"    },
  { key: "employees",          label: "Empleats",      icon: UserCheck,    color: "green.500"  },
];

interface Props {
  onConnected: (v: boolean) => void;
}

const OdooKpiSection: React.FC<Props> = ({ onConnected }) => {
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
      .catch(() => { setConnected(false); onConnected(false); })
      .finally(() => setLoading(false));
  }, []);

  return (
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
  );
};

export default OdooKpiSection;
