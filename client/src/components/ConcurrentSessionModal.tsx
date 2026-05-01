import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Users, LogIn, LogOut } from "lucide-react";
import { revokeAllOtherSessions } from "../api";

interface Props {
  onClose: () => void;
}

const ConcurrentSessionModal: React.FC<Props> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleRevokeOthers = async () => {
    setLoading(true);
    try {
      await revokeAllOtherSessions();
    } catch {
      // Continue
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Flex
      position="fixed"
      inset="0"
      bg="blackAlpha.600"
      zIndex={9998}
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
            <Box color="blue.500">
              <Users size={28} />
            </Box>
            <Heading size="md">Sessió activa en un altre dispositiu</Heading>
          </HStack>

          <Text fontSize="sm" color="fg.muted">
            El teu compte ja té una sessió activa en un altre dispositiu o navegador. Per seguretat, pots tancar les sessions anteriors.
          </Text>

          <HStack gap="3" justify="flex-end">
            <Button
              colorPalette="gray"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <LogIn size={14} style={{ marginRight: "6px" }} />
              Continuar igualment
            </Button>
            <Button
              colorPalette="orange"
              size="sm"
              loading={loading}
              onClick={handleRevokeOthers}
            >
              <LogOut size={14} style={{ marginRight: "6px" }} />
              Tancar les altres sessions
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ConcurrentSessionModal;
