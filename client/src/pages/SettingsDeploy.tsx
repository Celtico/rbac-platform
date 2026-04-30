import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.ts";
import api from "../api";
import { deployHistory, deployRollback } from "../api";
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Dialog,
  Grid,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RefreshCw, RotateCcw, History } from "lucide-react";
import { toaster } from "../components/ui/toaster";
import { useTheme } from "../context/ThemeContext.ts";

interface DeployRecord {
  id: string;
  timestamp: string;
  commit: string;
  version: string;
  deployedBy: string;
  status: "success" | "pending" | "rollback";
}

const STATUS_PALETTE: Record<DeployRecord["status"], string> = {
  success: "green",
  pending: "yellow",
  rollback: "orange",
};

const STATUS_LABEL: Record<DeployRecord["status"], string> = {
  success: "OK",
  pending: "En curs",
  rollback: "Rollback",
};

const SettingsDeploy: React.FC = () => {
  const { hasPermission } = useAuth();
  const { mode } = useTheme();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deployLogs, setDeployLogs] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<DeployRecord | null>(null);
  const [versionInfo, setVersionInfo] = useState<{ version: string; name: string; lastCommit: string; environment: string } | null>(null);
  const [history, setHistory] = useState<DeployRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const canDeploy = hasPermission("manage:deploy");

  useEffect(() => {
    if (!canDeploy) return;
    fetchVersion();
    fetchHistory();
  }, []);

  const fetchVersion = async () => {
    try {
      const response = await api.get("/deploy/version");
      setVersionInfo(response.data);
    } catch {
      setVersionInfo({ version: "error", name: "error", lastCommit: "Error en carregar informació", environment: "error" });
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await deployHistory();
      setHistory(data.history);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
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
      setDeployResult({ success: true, message: response.data.message || "Desplegament completat amb èxit" });
      toaster.create({ type: "success", title: "Deploy iniciat" });
      setTimeout(fetchHistory, 1000);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Error de connexió al servidor";
      setDeployResult({ success: false, message: msg });
      toaster.create({ type: "error", title: "Deploy failed", description: msg });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    const commitHash = rollbackTarget.commit.split(" ")[0];
    setRollbackTarget(null);
    try {
      const { data } = await deployRollback(commitHash);
      toaster.create({ type: "success", title: "Rollback iniciat", description: data.message });
      setTimeout(fetchHistory, 1000);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Error en el rollback";
      toaster.create({ type: "error", title: "Rollback failed", description: msg });
    }
  };

  const cardBg = mode === "light" ? "white" : "gray.800";

  return (
    <Box>
      <Heading size="2xl" mb="8">Desplegament</Heading>

      <VStack align="stretch" gap="6">
        {/* Deploy action */}
        <Box bg="bg.panel" p={{ base: "4", md: "8" }} rounded="md" shadow="md">
          <Text mb="6" color="fg.muted">
            Desplega la darrera versió de l'aplicació directament des d'aquí.
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
            <Grid mt="6" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap="4" borderTopWidth="1px" pt="6">
              <Box>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="fg.muted" fontWeight="semibold" display="block" mb="1">
                  Versió
                </Text>
                <Text fontSize="sm" fontWeight="medium">{versionInfo.name} v{versionInfo.version}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="fg.muted" fontWeight="semibold" display="block" mb="1">
                  Entorn
                </Text>
                <Text fontSize="sm" fontWeight="medium">{versionInfo.environment}</Text>
              </Box>
              <Box gridColumn={{ sm: "span 2" }}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="fg.muted" fontWeight="semibold" display="block" mb="1">
                  Darrer Commit
                </Text>
                <Code fontSize="sm" p="1" rounded="sm" variant="surface" wordBreak="break-all" display="block">
                  {versionInfo.lastCommit}
                </Code>
              </Box>
            </Grid>
          )}

          {deployResult && (
            <Box mt="6">
              <Alert.Root status={deployResult.success ? "success" : "error"} rounded="md">
                <Alert.Indicator />
                <Alert.Description>{deployResult.message}</Alert.Description>
              </Alert.Root>
              <HStack mt="2" gap="4">
                <Button variant="ghost" size="sm" onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}>
                  {showLogs ? "Amagar logs" : "Veure logs"}
                </Button>
                {showLogs && (
                  <IconButton aria-label="Refresh logs" variant="ghost" size="sm" onClick={fetchLogs}>
                    <RefreshCw size={16} />
                  </IconButton>
                )}
              </HStack>
              {showLogs && (
                <Box mt="2" p="4" bg="black" color="green.400" fontFamily="mono" fontSize="xs" rounded="md" overflow="auto" maxH="60" whiteSpace="pre-wrap">
                  {deployLogs || <Spinner size="xs" />}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* History */}
        <Box bg={cardBg} rounded="md" shadow="sm" overflow="hidden">
          <HStack px="6" py="4" borderBottomWidth="1px" justify="space-between">
            <HStack gap="2">
              <History size={16} />
              <Text fontWeight="semibold" fontSize="sm">Historial de desplegaments</Text>
            </HStack>
            <IconButton aria-label="Refresh" variant="ghost" size="sm" onClick={fetchHistory}>
              <RefreshCw size={14} />
            </IconButton>
          </HStack>

          {historyLoading ? (
            <Box p="8" textAlign="center"><Spinner size="sm" color="purple.400" /></Box>
          ) : history.length === 0 ? (
            <Box p="6"><Text fontSize="sm" color="fg.muted">Encara no hi ha desplegaments registrats.</Text></Box>
          ) : (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs">Data</Table.ColumnHeader>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs">Commit</Table.ColumnHeader>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs">Versió</Table.ColumnHeader>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs">Per</Table.ColumnHeader>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs">Estat</Table.ColumnHeader>
                  <Table.ColumnHeader px="5" py="2" fontSize="xs" textAlign="right">Acció</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {history.map((rec) => (
                  <Table.Row key={rec.id}>
                    <Table.Cell px="5" py="3" fontSize="sm" color="fg.muted">
                      {new Date(rec.timestamp).toLocaleString("ca-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </Table.Cell>
                    <Table.Cell px="5" py="3">
                      <Code fontSize="xs">{rec.commit.split(" ")[0]}</Code>
                    </Table.Cell>
                    <Table.Cell px="5" py="3" fontSize="sm">{rec.version}</Table.Cell>
                    <Table.Cell px="5" py="3" fontSize="sm">{rec.deployedBy}</Table.Cell>
                    <Table.Cell px="5" py="3">
                      <Badge colorPalette={STATUS_PALETTE[rec.status]} variant="subtle" size="sm">
                        {STATUS_LABEL[rec.status]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell px="5" py="3" textAlign="right">
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="orange"
                        onClick={() => setRollbackTarget(rec)}
                      >
                        <RotateCcw size={12} style={{ marginRight: 4 }} />
                        Rollback
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </VStack>

      {/* Deploy confirm */}
      <Dialog.Root open={deployConfirmOpen} onOpenChange={({ open }) => setDeployConfirmOpen(open)} role="alertdialog">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>Confirmar desplegament</Dialog.Title></Dialog.Header>
            <Dialog.Body>Estàs segur que vols desplegar l'aplicació? El servidor es reiniciarà.</Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setDeployConfirmOpen(false)}>Cancel·lar</Button>
              <Button colorPalette="orange" onClick={handleDeploy} ml="2">Desplegar</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Rollback confirm */}
      <Dialog.Root open={!!rollbackTarget} onOpenChange={({ open }) => { if (!open) setRollbackTarget(null); }} role="alertdialog">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>Confirmar rollback</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              Vols revertir al commit{" "}
              <Code fontSize="sm">{rollbackTarget?.commit.split(" ")[0]}</Code>{" "}
              del {rollbackTarget ? new Date(rollbackTarget.timestamp).toLocaleString("ca-ES") : ""}?
              <Text mt="2" fontSize="sm" color="red.500">
                Això farà un git checkout i re-deployarà. L'aplicació es reiniciarà.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setRollbackTarget(null)}>Cancel·lar</Button>
              <Button colorPalette="red" onClick={handleRollback} ml="2">Fer Rollback</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default SettingsDeploy;
