import React from "react";
import { useTheme } from "../context/ThemeContext.ts";
import type { ColorTheme, RadiusSize, FontFamily, FontSize } from "../context/ThemeContext.ts";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Circle,
  Grid,
  Heading,
  HStack,
  Input,
  Progress,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Bell, Mail, Settings, Star, TrendingUp, User } from "lucide-react";

const SettingsStyles: React.FC = () => {
  const { theme, setTheme, radius, setRadius, font, setFont, fontSize, setFontSize } = useTheme();

  const themes: { id: ColorTheme; name: string; color: string }[] = [
    { id: "default",  name: "Default",  color: "#a855f7" },
    { id: "sky",      name: "Sky",      color: "#0ea5e9" },
    { id: "ocean",    name: "Ocean",    color: "#06b6d4" },
    { id: "forest",   name: "Forest",   color: "#10b981" },
    { id: "sunset",   name: "Sunset",   color: "#f43f5e" },
    { id: "violet",   name: "Violet",   color: "#8b5cf6" },
    { id: "amber",    name: "Amber",    color: "#f59e0b" },
    { id: "coral",    name: "Coral",    color: "#f97316" },
    { id: "crimson",  name: "Crimson",  color: "#ef4444" },
    { id: "midnight", name: "Midnight", color: "#1d4ed8" },
  ];

  const fonts: { id: FontFamily; name: string }[] = [
    { id: "system",   name: "System"          },
    { id: "inter",    name: "Inter"            },
    { id: "nunito",   name: "Nunito"           },
    { id: "poppins",  name: "Poppins"          },
    { id: "lato",     name: "Lato"             },
    { id: "playfair", name: "Playfair Display" },
    { id: "mono",     name: "JetBrains Mono"   },
  ];

  const fontFamilyMap: Record<FontFamily, string> = {
    system:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    inter:    "'Inter', sans-serif",
    nunito:   "'Nunito', sans-serif",
    poppins:  "'Poppins', sans-serif",
    lato:     "'Lato', sans-serif",
    playfair: "'Playfair Display', serif",
    mono:     "'JetBrains Mono', monospace",
  };

  const fontSizes: { id: FontSize; name: string; label: string }[] = [
    { id: "xs", name: "XS", label: "12" },
    { id: "sm", name: "S",  label: "14" },
    { id: "md", name: "M",  label: "16" },
    { id: "lg", name: "L",  label: "18" },
    { id: "xl", name: "XL", label: "20" },
  ];

  const radiuses: { id: RadiusSize; name: string }[] = [
    { id: "none", name: "Cap" },
    { id: "sm",   name: "S"   },
    { id: "md",   name: "M"   },
    { id: "lg",   name: "L"   },
    { id: "xl",   name: "XL"  },
    { id: "full", name: "Full"},
  ];

  return (
    <Box>
      <Heading size={{ base: "xl", md: "2xl" }} mb={{ base: "4", md: "8" }}>
        Estils i Temes
      </Heading>

      <Box bg="bg.panel" p={{ base: "4", md: "8" }} rounded="md" shadow="md">
        <Stack gap={{ base: "6", md: "10" }}>

          {/* ── Color Theme ──────────────────────────────────── */}
          <Box as="section">
            <Heading size="sm" mb="3" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Color
            </Heading>
            <Grid templateColumns="repeat(5, 1fr)" gap={{ base: "2", md: "3" }}>
              {themes.map((t) => (
                <Button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  variant={theme === t.id ? "surface" : "ghost"}
                  height="auto"
                  p={{ base: "2", md: "3" }}
                  borderWidth="2px"
                  borderColor={theme === t.id ? "blue.500" : "transparent"}
                  display="flex"
                  flexDirection="column"
                  gap="1"
                  _hover={{ borderColor: theme === t.id ? "blue.500" : "gray.300" }}
                >
                  <Circle size={{ base: "6", md: "8" }} bg={t.color} />
                  <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="medium" lineHeight="1">
                    {t.name}
                  </Text>
                </Button>
              ))}
            </Grid>
          </Box>

          {/* ── Tipografia ───────────────────────────────────── */}
          <Box as="section">
            <Heading size="sm" mb="3" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Tipografia
            </Heading>
            <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(7, 1fr)" }} gap="2">
              {fonts.map((f) => (
                <Button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  variant={font === f.id ? "solid" : "outline"}
                  colorPalette={font === f.id ? "blue" : "gray"}
                  height="auto"
                  py="3"
                  px="2"
                  display="flex"
                  flexDirection="column"
                  gap="1"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="600"
                    lineHeight="1"
                    style={{ fontFamily: fontFamilyMap[f.id] }}
                  >
                    Aa
                  </Text>
                  <Text fontSize="2xs" fontWeight="normal" lineHeight="1.2" textAlign="center">
                    {f.name}
                  </Text>
                </Button>
              ))}
            </Grid>
          </Box>

          {/* ── Mida de lletra ──────────────────────────────── */}
          <Box as="section">
            <Heading size="sm" mb="3" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Mida de lletra
            </Heading>
            <HStack gap="2" flexWrap="wrap">
              {fontSizes.map((s) => (
                <Button
                  key={s.id}
                  onClick={() => setFontSize(s.id)}
                  variant={fontSize === s.id ? "solid" : "outline"}
                  colorPalette={fontSize === s.id ? "blue" : "gray"}
                  size="sm"
                  minW="14"
                  display="flex"
                  flexDirection="column"
                  gap="0"
                  h="auto"
                  py="2"
                >
                  <Text fontSize={s.id === "xs" ? "xs" : s.id === "sm" ? "sm" : s.id === "md" ? "md" : s.id === "lg" ? "lg" : "xl"} lineHeight="1.2" fontWeight="bold">
                    Aa
                  </Text>
                  <Text fontSize="2xs" fontWeight="normal">{s.label}px</Text>
                </Button>
              ))}
            </HStack>
          </Box>

          {/* ── Border Radius ────────────────────────────────── */}
          <Box as="section">
            <Heading size="sm" mb="3" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Cantonades
            </Heading>
            <HStack gap="2" flexWrap="wrap">
              {radiuses.map((r) => (
                <Button
                  key={r.id}
                  onClick={() => setRadius(r.id)}
                  variant={radius === r.id ? "solid" : "outline"}
                  colorPalette={radius === r.id ? "blue" : "gray"}
                  size="sm"
                >
                  {r.name}
                </Button>
              ))}
            </HStack>
          </Box>

          {/* ── Preview ──────────────────────────────────────── */}
          <Box pt="4" borderTopWidth="1px">
            <Heading size="sm" mb="4" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Previsualització
            </Heading>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">

              {/* Card — Perfil */}
              <Box borderWidth="1px" rounded="md" p="4" bg="bg.panel" shadow="sm">
                <HStack gap="3" mb="3">
                  <Avatar.Root size="md" colorPalette="blue">
                    <Avatar.Fallback><User size={16} /></Avatar.Fallback>
                  </Avatar.Root>
                  <VStack align="start" gap="0">
                    <Text fontWeight="semibold" fontSize="sm">Anna García</Text>
                    <Text fontSize="xs" color="fg.muted">anna@empresa.cat</Text>
                  </VStack>
                  <Badge colorPalette="green" ml="auto" size="sm">Actiu</Badge>
                </HStack>
                <HStack gap="2">
                  <Button colorPalette="blue" size="xs" flex="1">Editar</Button>
                  <Button variant="outline" size="xs" flex="1">Missatge</Button>
                </HStack>
              </Box>

              {/* Card — Estadístiques */}
              <Box borderWidth="1px" rounded="md" p="4" bg="bg.panel" shadow="sm">
                <HStack justify="space-between" mb="3">
                  <Text fontWeight="semibold" fontSize="sm">Vendes aquest mes</Text>
                  <TrendingUp size={15} color="var(--chakra-colors-green-500)" />
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" mb="1">12.480€</Text>
                <Text fontSize="xs" color="green.500" mb="3">+18% respecte el mes anterior</Text>
                <VStack gap="1.5">
                  <HStack w="full" justify="space-between">
                    <Text fontSize="xs" color="fg.muted">Objectiu</Text>
                    <Text fontSize="xs" fontWeight="medium">76%</Text>
                  </HStack>
                  <Progress.Root value={76} colorPalette="blue" size="sm" w="full" rounded="full">
                    <Progress.Track><Progress.Range /></Progress.Track>
                  </Progress.Root>
                </VStack>
              </Box>

              {/* Card — Notificacions */}
              <Box borderWidth="1px" rounded="md" p="4" bg="bg.panel" shadow="sm">
                <HStack justify="space-between" mb="3">
                  <Text fontWeight="semibold" fontSize="sm">Notificacions</Text>
                  <Badge colorPalette="red" size="sm">3</Badge>
                </HStack>
                <VStack gap="2" align="stretch">
                  {[
                    { icon: <Mail size={13} />, text: "Nou missatge de Joan", time: "fa 2 min", color: "blue" },
                    { icon: <Bell size={13} />, text: "Factura #1042 vencuda", time: "fa 1 h",   color: "orange" },
                    { icon: <Star size={13} />, text: "Valoració rebuda: 5★",  time: "fa 3 h",   color: "yellow" },
                  ].map((n, i) => (
                    <HStack key={i} gap="2.5" p="2" rounded="sm" bg="bg.muted">
                      <Circle size="6" bg={`${n.color}.100`} color={`${n.color}.600`} flexShrink={0}>
                        {n.icon}
                      </Circle>
                      <Text fontSize="xs" flex="1">{n.text}</Text>
                      <Text fontSize="2xs" color="fg.subtle">{n.time}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* Card — Formulari */}
              <Box borderWidth="1px" rounded="md" p="4" bg="bg.panel" shadow="sm">
                <HStack justify="space-between" mb="3">
                  <Text fontWeight="semibold" fontSize="sm">Configuració ràpida</Text>
                  <Settings size={14} color="var(--chakra-colors-fg-muted)" />
                </HStack>
                <VStack gap="3">
                  <Box w="full">
                    <Text fontSize="xs" color="fg.muted" mb="1">Nom d'empresa</Text>
                    <Input size="sm" defaultValue="Empresa Demo SL" readOnly />
                  </Box>
                  <Box w="full">
                    <Text fontSize="xs" color="fg.muted" mb="1">Correu de contacte</Text>
                    <Input size="sm" defaultValue="hola@empresa.cat" readOnly />
                  </Box>
                  <HStack w="full" gap="2" pt="1">
                    <Button colorPalette="blue" size="sm" flex="1">Desar</Button>
                    <Button variant="ghost" size="sm" colorPalette="gray">Cancel·lar</Button>
                  </HStack>
                </VStack>
              </Box>

            </Grid>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
};

export default SettingsStyles;
