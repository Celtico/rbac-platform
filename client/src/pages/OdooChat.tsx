import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { Bot, Send, User, Zap, Lightbulb } from "lucide-react";
import { odooChat } from "../api";
import { useTheme } from "../context/ThemeContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: number;
}

const EXAMPLES = [
  "Quantes factures pendents hi ha?",
  "Resum de vendes d'aquest mes",
  "Quins són els millors clients?",
  "Mostra'm els KPIs del negoci",
  "Comandes en retard",
  "Empleats actius",
];

const OdooChat: React.FC = () => {
  const { mode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const bg = mode === "light" ? "white" : "gray.800";
  const bubbleBgUser = mode === "light" ? "purple.500" : "purple.600";
  const bubbleBgBot = mode === "light" ? "gray.100" : "gray.700";

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await odooChat(question);
      const botMsg: Message = {
        role: "assistant",
        content: data.answer,
        intent: data.intent,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No he pogut connectar amb l'orquestrador d'Odoo. Comprova que estigui en marxa.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) send(input);
  };

  return (
    <Flex
      direction="column"
      h={{ base: "calc(100dvh - 155px)", md: "calc(100vh - 130px)" }}
      gap="4"
    >
      {/* Header */}
      <HStack gap="3">
        <Bot size={28} color="#863bff" />
        <Heading size="lg">Odoo AI Assistant</Heading>
      </HStack>

      {/* Chat area */}
      <Box
        flex="1"
        overflowY="auto"
        bg={bg}
        borderRadius="xl"
        p="4"
        boxShadow="sm"
      >
        {messages.length === 0 ? (
          <VStack gap="4" pt="8" align="center">
            <Bot size={48} color="#863bff" opacity={0.4} />
            <Text color="fg.muted" textAlign="center" maxW="sm">
              Pregunta qualsevol cosa sobre el teu Odoo en llengua natural.
            </Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="4">
            {messages.map((msg, i) => (
              <Flex
                key={i}
                justify={msg.role === "user" ? "flex-end" : "flex-start"}
                gap="2"
                align="flex-start"
              >
                {msg.role === "assistant" && (
                  <Box
                    bg="purple.100"
                    borderRadius="full"
                    p="1.5"
                    flexShrink={0}
                    mt="0.5"
                  >
                    <Bot size={16} color="#863bff" />
                  </Box>
                )}
                <Box maxW="75%">
                  <Box
                    bg={msg.role === "user" ? bubbleBgUser : bubbleBgBot}
                    color={msg.role === "user" ? "white" : undefined}
                    px="4"
                    py="3"
                    borderRadius="2xl"
                    borderTopRightRadius={msg.role === "user" ? "sm" : "2xl"}
                    borderTopLeftRadius={msg.role === "assistant" ? "sm" : "2xl"}
                    whiteSpace="pre-wrap"
                    fontSize="sm"
                    lineHeight="tall"
                  >
                    {msg.content}
                  </Box>
                  {msg.intent && msg.role === "assistant" && (
                    <HStack gap="1.5" mt="1" px="1">
                      <Zap size={11} color="#863bff" />
                      <Badge size="xs" colorPalette="purple" variant="subtle">
                        {msg.intent}
                      </Badge>
                      <Text fontSize="xs" color="fg.muted">
                        {Math.round((msg.confidence ?? 0) * 100)}%
                      </Text>
                    </HStack>
                  )}
                </Box>
                {msg.role === "user" && (
                  <Box
                    bg="purple.100"
                    borderRadius="full"
                    p="1.5"
                    flexShrink={0}
                    mt="0.5"
                  >
                    <User size={16} color="#863bff" />
                  </Box>
                )}
              </Flex>
            ))}
            {loading && (
              <Flex align="center" gap="2">
                <Box bg="purple.100" borderRadius="full" p="1.5" flexShrink={0}>
                  <Bot size={16} color="#863bff" />
                </Box>
                <Box
                  bg={bubbleBgBot}
                  px="4"
                  py="3"
                  borderRadius="2xl"
                  borderTopLeftRadius="sm"
                >
                  <Spinner size="xs" color="purple.500" />
                </Box>
              </Flex>
            )}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>

      {/* Example questions panel */}
      {showExamples && (
        <Flex flexWrap="wrap" gap="2" px="1">
          {EXAMPLES.map((ex) => (
            <Button
              key={ex}
              size="sm"
              variant="outline"
              colorPalette="purple"
              borderRadius="full"
              onClick={() => {
                send(ex);
                setShowExamples(false);
              }}
            >
              {ex}
            </Button>
          ))}
        </Flex>
      )}

      {/* Input */}
      <HStack gap="2">
        <Button
          variant={showExamples ? "subtle" : "outline"}
          colorPalette="purple"
          size="lg"
          borderRadius="xl"
          onClick={() => setShowExamples((v) => !v)}
          px="3"
          title="Preguntes d'exemple"
        >
          <Lightbulb size={18} />
        </Button>
        <Input
          placeholder="Pregunta sobre Odoo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          size="lg"
          borderRadius="xl"
          bg={bg}
        />
        <Button
          colorPalette="purple"
          size="lg"
          borderRadius="xl"
          disabled={!input.trim() || loading}
          onClick={() => send(input)}
          px="5"
        >
          <Send size={18} />
        </Button>
      </HStack>
    </Flex>
  );
};

export default OdooChat;
