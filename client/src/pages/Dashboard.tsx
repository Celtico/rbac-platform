import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useNavConfig } from "../context/NavConfigContext.ts";
import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import NavCard from "../components/dashboard/NavCard.tsx";
import OdooKpiSection from "../components/dashboard/OdooKpiSection.tsx";
import OdooLiveSection from "../components/dashboard/OdooLiveSection.tsx";
import ServerStatsSection from "../components/dashboard/ServerStatsSection.tsx";

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
      <Heading size="2xl" mb="8">Dashboard</Heading>

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
