import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { useNavConfig } from "../context/NavConfigContext.ts";
import { Box, Heading, Text, Stack, SimpleGrid } from "@chakra-ui/react";
import type { NavItemDef } from "../context/NavConfigContext.ts";
import type { LucideIcon } from "lucide-react";

interface NavCardProps {
  item: NavItemDef;
}

const NavCard: React.FC<NavCardProps> = ({ item }) => {
  const Icon: LucideIcon = item.icon;
  return (
    <Link to={item.path} style={{ textDecoration: "none" }}>
      <Box
        bg="bg.panel"
        p={[4, 4, 5, 7, 8]}
        rounded="md"
        shadow="sm"
        borderLeftWidth="4px"
        borderLeftColor={item.color}
        transition="all 0.2s"
        _hover={{
          shadow: "md",
          transform: "translateY(-2px)",
          cursor: "pointer",
        }}
      >
        <Box color={item.color} mb={2}>
          <Icon size={36} />
        </Box>
        <Stack gap="0">
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {item.label}
          </Text>
        </Stack>
      </Box>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const { items, isEnabled } = useNavConfig();

  const visibleCards = items.filter(
    (item) =>
      isEnabled("dashboard", item.id) &&
      (!item.permission || hasPermission(item.permission)) &&
      (!item.role || hasRole(item.role))
  );

  return (
    <Box>
      <Heading size="2xl" mb="8">
        Dashboard
      </Heading>
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
        <SimpleGrid columns={[2, 2, 3, 4]} gap={[3, 4, 5, 7, 8]}>
          {visibleCards.map((item) => (
            <NavCard key={item.id} item={item} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Dashboard;
