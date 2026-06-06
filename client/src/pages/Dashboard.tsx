import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useNavConfig } from "../context/NavConfigContext.ts";
import { Box, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { GitBranch, BookOpen } from "lucide-react";
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
      <Heading size="2xl" mb="8">
        Dashboard
      </Heading>
      <Box mb="10">
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

      {canUseAI && <OdooKpiSection onConnected={setOdooConnected} />}
      {canUseAI && odooConnected && <OdooLiveSection />}
      {hasPermission("read:logsystem") && <ServerStatsSection />}

      {/* Footer */}
      <Box mt="12" pt="6" borderTopWidth="1px">
        <HStack justify="space-between" align="center" flexWrap="wrap" gap="3">
          <Text fontSize="xs" color="fg.muted">
            © {new Date().getFullYear()} Cel Ticó Petit. Tots els drets reservats.
          </Text>
          <HStack gap="4">
            <a
              href="https://gitwins.serverscel.com/cel/album-manager"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", opacity: 0.5 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              <GitBranch size={14} color="currentColor" />
              <Text fontSize="xs" color="fg.muted">Codi font</Text>
            </a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", opacity: 0.5 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              <BookOpen size={14} color="currentColor" />
              <Text fontSize="xs" color="fg.muted">API Swagger</Text>
            </a>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default Dashboard;
