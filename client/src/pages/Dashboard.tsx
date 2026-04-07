import React from "react";
import { useAuth } from "../context/AuthContext";
import { Disc, Users, ShieldCheck, Lock } from "lucide-react";
import { Box, Flex, Grid, Heading, Text, Stack } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <Box
    bg="bg.panel"
    p="6"
    rounded="md"
    shadow="sm"
    borderLeftWidth="4px"
    borderLeftColor={color}
  >
    <Flex align="center">
      <Box color={color} mr="4">
        <Icon size={48} />
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
        <Text fontSize="xl" fontWeight="bold">
          {value}
        </Text>
      </Stack>
    </Flex>
  </Box>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Heading size="2xl" mb="8">
        Dashboard Overview
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap="6"
      >
        <StatCard
          icon={Disc}
          label="Total Albums"
          value="Available"
          color="blue.500"
        />
        <StatCard
          icon={Users}
          label="Your Roles"
          value={user?.roles.join(", ") || "None"}
          color="purple.500"
        />
        <StatCard
          icon={ShieldCheck}
          label="Permissions"
          value={`${user?.permissions.length || 0} active`}
          color="yellow.500"
        />
        <StatCard
          icon={Lock}
          label="Security"
          value="RBAC Enabled"
          color="gray.500"
        />
      </Grid>
    </Box>
  );
};

export default Dashboard;
