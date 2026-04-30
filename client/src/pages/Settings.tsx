import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext.ts";
import type { ColorTheme, RadiusSize } from "../context/ThemeContext.ts";
import { useAuth } from "../context/AuthContext.ts";
import api from "../api";
import {
  Alert,
  Box,
  Button,
  Dialog,
  Heading,
  Text,
  HStack,
  Grid,
  Stack,
  Code,
  Spinner,
  IconButton,
  Circle,
  Tabs,
} from "@chakra-ui/react";
import { RefreshCw, Rocket, Palette } from "lucide-react";
import { toaster } from "../components/ui/toaster";

const Settings: React.FC = () => {
  const { theme, setTheme, radius, setRadius } = useTheme();
  const { hasPermission } = useAuth();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [deployLogs, setDeployLogs] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    name: string;
    lastCommit: string;
    environment: string;
  } | null>(null);

  const fetchVersion = async () => {
    try {
      const response = await api.get("/deploy/version");
      setVersionInfo(response.data);
    } catch (error: unknown) {
      console.error("Error fetching version:", error);
      setVersionInfo({
        version: "error",
        name: "error",
        lastCommit: "Error en carregar informació",
        environment: "error",
      });
    }
  };

  useEffect(() => {
    if (hasPermission("manage:deploy")) {
      fetchVersion();
    }
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get("/deploy/logs");
      setDeployLogs(response.data.logs);
    } catch (error: unknown) {
      console.error("Error fetching logs:", error);
      setDeployLogs("Error al carregar els logs del servidor.");
    }
  };

  const themes: { id: ColorTheme; name: string; color: string }[] = [
    { id: "default", name: "Default (Blue)", color: "#3b82f6" },
    { id: "ocean", name: "Ocean (Cyan)", color: "#0891b2" },
    { id: "forest", name: "Forest (Green)", color: "#10b981" },
    { id: "sunset", name: "Sunset (Red/Orange)", color: "#f43f5e" },
  ];

  const radiuses: { id: RadiusSize; name: string }[] = [
    { id: "none", name: "None" },
    { id: "sm", name: "Small" },
    { id: "md", name: "Medium" },
    { id: "lg", name: "Large" },
    { id: "xl", name: "Extra Large" },
    { id: "full", name: "Full" },
  ];

  const handleDeploy = async () => {
    setDeployConfirmOpen(false);
    setIsDeploying(true);
    setDeployResult(null);

    try {
      const response = await api.post("/deploy");
      setDeployResult({
        success: true,
        message: response.data.message || "Desplegament completat amb èxit",
      });
      toaster.create({ type: "success", title: "Deploy completed" });
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      console.error("Deploy error:", error);
      const msg =
        axiosError.response?.data?.message || "Error de connexió al servidor";
      setDeployResult({ success: false, message: msg });
      toaster.create({
        type: "error",
        title: "Deploy failed",
        description: msg,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box>
      <Heading size="2xl" mb="8">
        System Settings
      </Heading>

      <Tabs.Root defaultValue="styles" variant="line">
        <Tabs.List mb="6">
          <Tabs.Trigger value="styles">
            <HStack gap="2">
              <Palette size={16} />
              <span>Estils i Temes</span>
            </HStack>
          </Tabs.Trigger>
          {hasPermission("manage:deploy") && (
            <Tabs.Trigger value="deploy">
              <HStack gap="2">
                <Rocket size={16} />
                <span>Desplegament</span>
              </HStack>
            </Tabs.Trigger>
          )}
        </Tabs.List>

        {/* ── Estils i Temes ── */}
        <Tabs.Content value="styles">
          <Box bg="bg.panel" p="8" rounded="md" shadow="md">
            <Stack gap="10">
              <Box as="section">
                <Heading size="md" mb="4">
                  Color Theme
                </Heading>
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    sm: "repeat(4, 1fr)",
                  }}
                  gap="4"
                >
                  {themes.map((t) => (
                    <Button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      variant={theme === t.id ? "surface" : "ghost"}
                      height="auto"
                      p="4"
                      borderWidth="2px"
                      borderColor={theme === t.id ? "blue.500" : "transparent"}
                      display="flex"
                      flexDirection="column"
                      gap="2"
                      _hover={{
                        borderColor:
                          theme === t.id ? "blue.500" : "gray.300",
                      }}
                    >
                      <Circle size="8" bg={t.color} />
                      <Text fontSize="sm" fontWeight="medium">
                        {t.name}
                      </Text>
                    </Button>
                  ))}
                </Grid>
              </Box>

              <Box as="section">
                <Heading size="md" mb="4">
                  Rounded Corners (Border Radius)
                </Heading>
                <HStack flexWrap="wrap" gap="3">
                  {radiuses.map((r) => (
                    <Button
                      key={r.id}
                      onClick={() => setRadius(r.id)}
                      variant={radius === r.id ? "solid" : "outline"}
                      colorPalette={radius === r.id ? "blue" : "gray"}
                    >
                      {r.name}
                    </Button>
                  ))}
                </HStack>
              </Box>

              <Box pt="6" borderTopWidth="1px">
                <Heading size="sm" mb="4">
                  Preview Components
                </Heading>
                <HStack flexWrap="wrap" gap="4" mb="6">
                  <Button colorPalette="blue">Primary Button</Button>
                  <Button colorPalette="purple">Secondary Button</Button>
                  <Button colorPalette="orange">Accent Button</Button>
                </HStack>
                <Box p="4" bg="bg.muted" rounded="md" borderWidth="1px">
                  <Text color="fg.muted">
                    This is a preview of how cards and containers will look
                    with your current settings.
                  </Text>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Tabs.Content>

        {/* ── Desplegament ── */}
        {hasPermission("manage:deploy") && (
          <Tabs.Content value="deploy">
            <Box bg="bg.panel" p="8" rounded="md" shadow="md">
              <Text mb="6" color="fg.muted">
                Pots desplegar la darrera versió de l'aplicació directament des
                d'aquí. Això executarà el script de desplegament al servidor.
              </Text>

              <Button
                colorPalette="orange"
                onClick={() => setDeployConfirmOpen(true)}
                loading={isDeploying}
                loadingText="Desplegant..."
              >
                Desplegar Aplicació
              </Button>

              {versionInfo && (
                <Grid
                  mt="6"
                  templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}
                  gap="4"
                  borderTopWidth="1px"
                  pt="6"
                >
                  <Box>
                    <Text
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      color="fg.muted"
                      fontWeight="semibold"
                      display="block"
                      mb="1"
                    >
                      Versió del Projecte
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {versionInfo.name} v{versionInfo.version}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      color="fg.muted"
                      fontWeight="semibold"
                      display="block"
                      mb="1"
                    >
                      Entorn
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {versionInfo.environment}
                    </Text>
                  </Box>
                  <Box gridColumn={{ sm: "span 2" }}>
                    <Text
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      color="fg.muted"
                      fontWeight="semibold"
                      display="block"
                      mb="1"
                    >
                      Darrer Commit
                    </Text>
                    <Code
                      fontSize="sm"
                      p="1"
                      rounded="sm"
                      variant="surface"
                      wordBreak="break-all"
                      display="block"
                    >
                      {versionInfo.lastCommit}
                    </Code>
                  </Box>
                </Grid>
              )}

              {deployResult && (
                <Box mt="6">
                  <Alert.Root
                    status={deployResult.success ? "success" : "error"}
                    rounded="md"
                  >
                    <Alert.Indicator />
                    <Alert.Description>
                      {deployResult.message}
                    </Alert.Description>
                  </Alert.Root>
                  <HStack mt="2" gap="4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowLogs(!showLogs);
                        if (!showLogs) fetchLogs();
                      }}
                    >
                      {showLogs ? "Amagar logs" : "Veure logs de depuració"}
                    </Button>
                    {showLogs && (
                      <IconButton
                        aria-label="Refresh logs"
                        variant="ghost"
                        size="sm"
                        onClick={fetchLogs}
                      >
                        <RefreshCw size={16} />
                      </IconButton>
                    )}
                  </HStack>

                  {showLogs && (
                    <Box
                      mt="2"
                      p="4"
                      bg="black"
                      color="green.400"
                      fontFamily="mono"
                      fontSize="xs"
                      rounded="md"
                      overflow="auto"
                      maxH="60"
                      whiteSpace="pre-wrap"
                    >
                      {deployLogs || <Spinner size="xs" />}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Tabs.Content>
        )}
      </Tabs.Root>

      {/* Deploy confirmation dialog */}
      <Dialog.Root
        open={deployConfirmOpen}
        onOpenChange={({ open }) => setDeployConfirmOpen(open)}
        role="alertdialog"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirmar desplegament</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Estàs segur que vols desplegar l'aplicació? Això executarà el
              script de desplegament al servidor.
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => setDeployConfirmOpen(false)}
              >
                Cancel·lar
              </Button>
              <Button colorPalette="orange" onClick={handleDeploy} ml="2">
                Desplegar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default Settings;
