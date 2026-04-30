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
import type { NavSection } from "../context/NavConfigContext.ts";
import { useAuth } from "../context/AuthContext.ts";

const SECTIONS: { key: NavSection; label: string; description: string }[] = [
  {
    key: "sidebar",
    label: "Sidebar",
    description: "Elements visibles al menú lateral (escriptori).",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Cards visibles a la pàgina principal.",
  },
  {
    key: "mobile",
    label: "Navegació mòbil",
    description: "Elements visibles a la barra inferior en mòbil.",
  },
];

const SettingsSidebar: React.FC = () => {
  const { items, isEnabled, toggle, reset } = useNavConfig();
  const { hasPermission, hasRole } = useAuth();

  const visible = items.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (!item.role || hasRole(item.role))
  );

  return (
    <Box>
      <Heading size="2xl" mb="2">
        Configuració de la navegació
      </Heading>
      <Text color="fg.muted" mb="8">
        Activa o desactiva els elements per a cada secció de navegació
        independentment.
      </Text>

      <VStack align="stretch" gap="6">
        {SECTIONS.map((section) => (
          <Box key={section.key}>
            <Heading size="md" mb="1">
              {section.label}
            </Heading>
            <Text fontSize="sm" color="fg.muted" mb="3">
              {section.description}
            </Text>
            <Box bg="bg.panel" rounded="md" shadow="sm" overflow="hidden">
              <VStack align="stretch" gap="0">
                {visible.map((item, i) => {
                  const Icon = item.icon;
                  const on = isEnabled(section.key, item.id);
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
                        onCheckedChange={() => toggle(section.key, item.id)}
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
          </Box>
        ))}
      </VStack>

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
