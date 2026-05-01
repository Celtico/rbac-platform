import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
  Badge,
  Separator,
} from "@chakra-ui/react";
import { Monitor, Smartphone, Shield, Trash2, LogOut } from "lucide-react";
import { getSessions, revokeSession, revokeAllOtherSessions, type UserSessionDTO } from "../api";
import { useTheme } from "../context/ThemeContext";

function getDeviceIcon(os: string) {
  if (os === "Android" || os === "iOS") return <Smartphone size={24} color="#863bff" />;
  return <Monitor size={24} color="#863bff" />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DeviceManager: React.FC = () => {
  const { mode } = useTheme();
  const [sessions, setSessions] = useState<UserSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const bg = mode === "light" ? "white" : "gray.800";
  const cardBg = mode === "light" ? "gray.50" : "gray.900";

  const fetchSessions = () => {
    setLoading(true);
    getSessions()
      .then(({ data }) => setSessions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevoking("all");
    try {
      await revokeAllOtherSessions();
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <HStack justify="space-between">
        <HStack gap="3">
          <Shield size={28} color="#863bff" />
          <Heading size="lg">Dispositius Connectats</Heading>
        </HStack>
        {otherSessions.length > 0 && (
          <Button
            size="sm"
            colorPalette="red"
            variant="outline"
            loading={revoking === "all"}
            onClick={handleRevokeAll}
          >
            <LogOut size={14} style={{ marginRight: "6px" }} />
            Tancar totes les altres sessions
          </Button>
        )}
      </HStack>

      <Text color="fg.muted" fontSize="sm">
        Aquí pots veure tots els dispositius que han accedit al teu compte. Pots revocar qualsevol sessió no reconeguda per protegir el teu compte.
      </Text>

      {loading ? (
        <Text color="fg.muted">Carregant sessions...</Text>
      ) : sessions.length === 0 ? (
        <Box bg={bg} borderRadius="xl" p="6" textAlign="center" boxShadow="sm">
          <Text color="fg.muted">No hi ha sessions actives registrades.</Text>
        </Box>
      ) : (
        <VStack align="stretch" gap="3">
          {/* Current session first */}
          {sessions
            .sort((a, b) => (a.isCurrent ? -1 : b.isCurrent ? 1 : 0))
            .map((session, idx) => (
              <React.Fragment key={session.id}>
                {idx > 0 && sessions[idx - 1].isCurrent && !session.isCurrent && (
                  <Box>
                    <Text fontSize="xs" color="fg.muted" fontWeight="medium" mb="2">
                      ALTRES SESSIONS
                    </Text>
                    <Separator />
                  </Box>
                )}
                <Box bg={session.isCurrent ? (mode === "light" ? "purple.50" : "purple.900") : cardBg} borderRadius="xl" p="4" boxShadow="sm" border="1px solid" borderColor={session.isCurrent ? "purple.200" : (mode === "light" ? "gray.200" : "gray.700")}>
                  <Flex align="flex-start" justify="space-between" gap="4">
                    <HStack gap="3" align="flex-start">
                      <Box mt="0.5">{getDeviceIcon(session.os)}</Box>
                      <VStack align="start" gap="0.5">
                        <HStack gap="2">
                          <Text fontWeight="semibold" fontSize="sm">
                            {session.browser} · {session.os}
                          </Text>
                          {session.isCurrent && (
                            <Badge colorPalette="purple" size="xs">Sessió actual</Badge>
                          )}
                          {session.isNewDevice && !session.isCurrent && (
                            <Badge colorPalette="orange" size="xs">Nou dispositiu</Badge>
                          )}
                        </HStack>
                        <Text fontSize="xs" color="fg.muted">
                          IP: {session.ipAddress}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          Primera connexió: {formatDate(session.firstSeen)}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          Última activitat: {formatDate(session.lastSeen)}
                        </Text>
                      </VStack>
                    </HStack>
                    {!session.isCurrent && (
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        loading={revoking === session.id}
                        onClick={() => handleRevoke(session.id)}
                        flexShrink={0}
                      >
                        <Trash2 size={14} style={{ marginRight: "4px" }} />
                        Revocar
                      </Button>
                    )}
                  </Flex>
                </Box>
              </React.Fragment>
            ))}
        </VStack>
      )}
    </Flex>
  );
};

export default DeviceManager;
