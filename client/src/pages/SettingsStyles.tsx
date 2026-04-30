import React from "react";
import { useTheme } from "../context/ThemeContext.ts";
import type { ColorTheme, RadiusSize, FontFamily } from "../context/ThemeContext.ts";
import {
  Box,
  Button,
  Circle,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";

const SettingsStyles: React.FC = () => {
  const { theme, setTheme, radius, setRadius, font, setFont } = useTheme();

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
            <Heading size="sm" mb="3" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
              Previsualització
            </Heading>
            <HStack flexWrap="wrap" gap="2" mb="4">
              <Button colorPalette="blue" size="sm">Primari</Button>
              <Button colorPalette="purple" size="sm">Secundari</Button>
              <Button colorPalette="orange" size="sm">Accent</Button>
            </HStack>
            <Box p="3" bg="bg.muted" rounded="md" borderWidth="1px">
              <Text fontSize="sm" color="fg.muted">
                Previsualització de cards i contenidors amb la configuració actual.
              </Text>
            </Box>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
};

export default SettingsStyles;
