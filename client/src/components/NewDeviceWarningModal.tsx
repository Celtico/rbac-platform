import React from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { AlertTriangle, Monitor, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.ts";
import { revokeSession } from "../api";

interface Props {
  deviceInfo?: {
    browser?: string;
    os?: string;
    ip?: string;
    sessionId?: string;
  };
  onClose: () => void;
}

const NewDeviceWarningModal: React.FC<Props> = ({ deviceInfo, onClose }) => {
  const { logout } = useAuth();

  const handleNotMe = async () => {
    // If we have the session ID, revoke it and logout
    if (deviceInfo?.sessionId) {
      try {
        await revokeSession(deviceInfo.sessionId);
      } catch {
        // Continue to logout regardless
      }
    }
    logout();
  };

  return (
    <Flex
      position="fixed"
      inset="0"
      bg="blackAlpha.600"
      zIndex={9999}
      align="center"
      justify="center"
      p="4"
    >
      <Box
        bg="bg.panel"
        borderRadius="xl"
        p="6"
        maxW="md"
        w="full"
        boxShadow="2xl"
      >
        <VStack gap="4" align="stretch">
          <HStack gap="3">
            <Box color="orange.500">
              <AlertTriangle size={28} />
            </Box>
            <Heading size="md">
              Primera connexió des d'aquest dispositiu
            </Heading>
          </HStack>

          <Text fontSize="sm" color="fg.muted">
            Hem detectat que t'has connectat des d'un dispositiu o navegador que
            no reconeixem.
          </Text>

          {deviceInfo && (
            <Box bg="bg.muted" borderRadius="md" p="3">
              <VStack align="start" gap="1.5">
                <HStack gap="2">
                  <Monitor size={16} />
                  <Text fontSize="sm">
                    <strong>Dispositiu:</strong>{" "}
                    {[deviceInfo.browser, deviceInfo.os]
                      .filter(Boolean)
                      .join(" · ") || "Desconegut"}
                  </Text>
                </HStack>
                {deviceInfo.ip && (
                  <Text fontSize="sm">
                    <strong>IP:</strong> {deviceInfo.ip}
                  </Text>
                )}
              </VStack>
            </Box>
          )}

          <Text fontSize="sm" color="fg.muted">
            Si no has estat tu, revoca la sessió i contacta amb l'administrador.
          </Text>

          <Flex
            gap="3"
            direction={{ base: "column", sm: "row" }}
            justify="flex-end"
          >
            <Button
              colorPalette="red"
              variant="outline"
              size="sm"
              onClick={handleNotMe}
              width={{ base: "full", sm: "auto" }}
            >
              <XCircle size={14} style={{ marginRight: "6px" }} />
              No soc jo — Tancar sessió
            </Button>
            <Button
              colorPalette="green"
              size="sm"
              onClick={onClose}
              width={{ base: "full", sm: "auto" }}
            >
              <CheckCircle size={14} style={{ marginRight: "6px" }} />
              Soc jo — Continuar
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
};

export default NewDeviceWarningModal;
