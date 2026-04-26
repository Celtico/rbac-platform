import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { ImageIcon, Users, ShieldCheck, Lock } from "lucide-react";
import { Box, Heading, Text, Stack, SimpleGrid } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  to?: string;
}

const StatCard = ({ icon: Icon, label, value, color, to }: StatCardProps) => {
  const content = (
    <Box
      bg="bg.panel"
      p="6"
      rounded="md"
      shadow="sm"
      borderLeftWidth="4px"
      borderLeftColor={color}
      transition="all 0.2s"
      _hover={
        to
          ? { shadow: "md", transform: "translateY(-2px)", cursor: "pointer" }
          : {}
      }
    >
      <Box>
        <Box color={color} mr="4" mb={3}>
          <Icon size={40} />
        </Box>
        <Stack gap="0">
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="fg.muted"
            textTransform="uppercase"
          >
            {label}
          </Text>
          <Text fontSize="xs" fontWeight="bold">
            {value}
          </Text>
        </Stack>
      </Box>
    </Box>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Heading size="2xl" mb="8">
        Dashboard Overview
      </Heading>
      <SimpleGrid columns={[2, 2, 3, 4]} gap="3">
        <StatCard
          icon={ImageIcon}
          label="Total Photos"
          value="Available"
          color="blue.500"
          to="/admin/photos"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value="Manage"
          color="teal.500"
          to="/admin/users"
        />
        <StatCard
          icon={Users}
          label="Your Roles"
          value={user?.roles.join(", ") || "None"}
          color="purple.500"
          to="/admin/roles"
        />
        <StatCard
          icon={ShieldCheck}
          label="Permissions"
          value={`${user?.permissions.length || 0} active`}
          color="yellow.500"
          to="/admin/permissions"
        />
        <StatCard
          icon={Lock}
          label="Security"
          value="RBAC Enabled"
          color="gray.500"
        />
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
