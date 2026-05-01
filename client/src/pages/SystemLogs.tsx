import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  Select,
  Text,
  VStack,
  Badge,
  createListCollection,
} from "@chakra-ui/react";
import { ScrollText, Wifi, WifiOff, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { getLogs, type LogEntryDTO } from "../api";
import { useTheme } from "../context/ThemeContext";

const LEVEL_COLORS: Record<string, string> = {
  log: "green",
  error: "red",
  warn: "yellow",
  debug: "blue",
  verbose: "gray",
};

const LEVELS = ["all", "log", "warn", "error", "debug", "verbose"];

const levelCollection = createListCollection({
  items: LEVELS.map((l) => ({ label: l === "all" ? "Tots els nivells" : l.toUpperCase(), value: l })),
});

const SystemLogs: React.FC = () => {
  const { mode } = useTheme();
  const [logs, setLogs] = useState<LogEntryDTO[]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterContext, setFilterContext] = useState("");
  const [search, setSearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const bg = mode === "light" ? "white" : "gray.800";
  const rowBg = mode === "light" ? "gray.50" : "gray.900";

  const scrollToBottom = useCallback(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [autoScroll]);

  // Load history
  useEffect(() => {
    setLoadingHistory(true);
    getLogs({ limit: 200 })
      .then(({ data }) => {
        setLogs(data.entries.reverse()); // oldest first
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, []);

  // SSE live stream
  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    const es = new EventSource(`/api/logs/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.onmessage = (e) => {
      try {
        const entry: LogEntryDTO = JSON.parse(e.data as string);
        setLogs((prev) => [...prev.slice(-499), entry]);
      } catch {
        // ignore malformed
      }
    };

    return () => {
      es.close();
      setSseConnected(false);
    };
  }, []);

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [logs, scrollToBottom]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (filterContext && !log.context?.toLowerCase().includes(filterContext.toLowerCase())) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <Flex direction="column" h="full" gap="4">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap="2">
        <HStack gap="2">
          <ScrollText size={22} color="#f97316" />
          <Heading size={{ base: "md", md: "lg" }}>Registre del Sistema</Heading>
        </HStack>
        <HStack gap="2">
          {sseConnected ? (
            <HStack gap="1">
              <Wifi size={13} color="green" />
              <Text fontSize="xs" color="green.500" display={{ base: "none", md: "block" }}>En viu</Text>
            </HStack>
          ) : (
            <HStack gap="1">
              <WifiOff size={13} color="gray" />
              <Text fontSize="xs" color="fg.muted" display={{ base: "none", md: "block" }}>Desconnectat</Text>
            </HStack>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoScroll((v) => !v)}
            colorPalette={autoScroll ? "orange" : "gray"}
          >
            {autoScroll ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            <Text ml="1" fontSize="xs" display={{ base: "none", md: "block" }}>{autoScroll ? "Pausar" : "Auto-scroll"}</Text>
          </Button>
          <Button size="sm" variant="outline" colorPalette="red" onClick={() => setLogs([])}>
            <Trash2 size={14} />
          </Button>
        </HStack>
      </HStack>

      {/* Filters */}
      <Flex gap="2" flexWrap="wrap" align="center">
        <Select.Root
          collection={levelCollection}
          size="sm"
          minW="130px"
          flex={{ base: "1", md: "none" }}
          value={[filterLevel]}
          onValueChange={(details) => setFilterLevel(details.value[0] ?? "all")}
        >
          <Select.Trigger>
            <Select.ValueText />
          </Select.Trigger>
          <Select.Content>
            {levelCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Input
          placeholder="Context..."
          value={filterContext}
          onChange={(e) => setFilterContext(e.target.value)}
          size="sm"
          flex={{ base: "1", md: "none" }}
          minW="80px"
          w={{ base: "auto", md: "140px" }}
          borderRadius="md"
        />
        <Input
          placeholder="Cerca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
          flex={{ base: "1 1 100%", md: "none" }}
          w={{ base: "full", md: "200px" }}
          borderRadius="md"
        />
        <Badge colorPalette="gray" size="sm" flexShrink={0}>
          {filteredLogs.length}
        </Badge>
      </Flex>

      {/* Log list */}
      <Box
        flex="1"
        overflowY="auto"
        bg={bg}
        borderRadius="xl"
        p="2"
        boxShadow="sm"
        fontFamily="mono"
      >
        {loadingHistory && logs.length === 0 ? (
          <Flex justify="center" align="center" h="100%">
            <Text color="fg.muted" fontSize="sm">Carregant historial...</Text>
          </Flex>
        ) : filteredLogs.length === 0 ? (
          <Flex justify="center" align="center" h="100%">
            <VStack gap="2">
              <ScrollText size={32} opacity={0.3} />
              <Text color="fg.muted" fontSize="sm">Cap entrada que coincideixi</Text>
            </VStack>
          </Flex>
        ) : (
          <VStack align="stretch" gap="0">
            {filteredLogs.map((log) => (
              <Box
                key={log.id}
                px="3" py="1.5"
                borderRadius="sm"
                _hover={{ bg: rowBg }}
                fontSize="xs"
                lineHeight="short"
              >
                {/* Mobile: stacked. Desktop: row */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  gap={{ base: "1", md: "3" }}
                  align={{ base: "flex-start", md: "flex-start" }}
                >
                  <HStack gap="2" flexShrink={0}>
                    <Text color="fg.muted" fontFamily="mono" w={{ base: "auto", md: "20" }}>
                      {formatTime(log.timestamp)}
                    </Text>
                    <Badge
                      colorPalette={LEVEL_COLORS[log.level] ?? "gray"}
                      size="xs"
                      w="14"
                      textAlign="center"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    {log.context && (
                      <Badge colorPalette="purple" variant="outline" size="xs">
                        {log.context}
                      </Badge>
                    )}
                  </HStack>
                  <Text
                    flex="1"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    color={log.level === "error" ? "red.500" : log.level === "warn" ? "yellow.600" : undefined}
                  >
                    {log.message}
                  </Text>
                </Flex>
              </Box>
            ))}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>
    </Flex>
  );
};

export default SystemLogs;
