import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.ts";
import api from "../api";
import {
  Alert,
  Box,
  Button,
  Code,
  Dialog,
  Grid,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { toaster } from "../components/ui/toaster";

const SettingsDeploy: React.FC = () => {
  const { hasRole } = useAuth();
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

  useEffect(() => {
    if (hasRole("admin")) fetchVersion();
  }, []);

  const fetchVersion = async () => {
    try {
      const response = await api.get("/deploy/version");
      setVersionInfo(response.data);
    } catch {
      setVersionInfo({
        version: "error",
        name: "error",
        lastCommit: "Error en carregar informació",
        environment: "error",
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get("/deploy/logs");
      setDeployLogs(response.data.logs);
    } catch {
      setDeployLogs("Error al carregar els logs del servidor.");
    }
  };

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
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Error de connexió al servidor";
      setDeployResult({ success: false, message: msg });
      toaster.create({ type: "error", title: "Deploy failed", description: msg });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box>
      <Heading size="2xl" mb="8">
        Desplegament
      </Heading>

      <Box bg="bg.panel" p="8" rounded="md" shadow="md">
        <Text mb="6" color="fg.muted">
          Pots desplegar la darrera versió de l'aplicació directament des d'aquí.
          Això executarà el script de desplegament al servidor.
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
              <Alert.Description>{deployResult.message}</Alert.Description>
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
              <Button variant="outline" onClick={() => setDeployConfirmOpen(false)}>
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

export default SettingsDeploy;
