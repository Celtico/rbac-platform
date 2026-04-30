import React from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RotateCcw } from "lucide-react";
import { useNavConfig } from "../context/NavConfigContext.ts";
import { useAuth } from "../context/AuthContext.ts";

const SettingsSidebar: React.FC = () => {
  const { items, enabled, toggle, reset } = useNavConfig();
  const { hasPermission, hasRole } = useAuth();

  /** Only show items the current user has access to. */
  const visible = items.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (!item.role || hasRole(item.role))
  );

  return (
    <Box>
      <Heading size="2xl" mb="2">
        Configuració del Sidebar
      </Heading>
      <Text color="fg.muted" mb="8">
        Activa o desactiva els elements que apareixeran al sidebar i al
        Dashboard.
      </Text>

      <Box bg="bg.panel" rounded="md" shadow="md" overflow="hidden">
        <VStack align="stretch" gap="0">
          {visible.map((item, i) => {
            const Icon = item.icon;
            const on = enabled[item.id] ?? true;
            return (
              <Flex
                key={item.id}
                px="6"
                py="4"
                align="center"
                justify="space-between"
                borderTopWidth={i === 0 ? "0" : "1px"}
                opacity={on ? 1 : 0.45}
                transition="opacity 0.2s"
              >
                <HStack gap="4">
                  <Box color={on ? "purple.500" : "fg.muted"}>
                    <Icon size={20} />
                  </Box>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm">
                      {item.label}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {item.path}
                    </Text>
                  </Box>
                </HStack>
                <Switch.Root
                  colorPalette="purple"
                  checked={on}
                  onCheckedChange={() => toggle(item.id)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>
            );
          })}
        </VStack>
      </Box>

      <HStack mt="6" justify="flex-end">
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw size={14} style={{ marginRight: 6 }} />
          Restaurar valors per defecte
        </Button>
      </HStack>
    </Box>
  );
};

export default SettingsSidebar;
