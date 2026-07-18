import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Drawer,
  Flex,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
  Badge,
  IconButton,
  Textarea,
  Table,
} from "@chakra-ui/react";
import {
  Bot,
  Send,
  Zap,
  Plus,
  Trash2,
  MessageSquare,
  Wifi,
  WifiOff,
  Menu,
  X,
  PenSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
  BarChart, LineChart, PieChart,
  Bar, Line, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ChartRoot, ChartTooltip, useChart,
  BarListRoot, BarListContent, BarListBar, BarListValue, BarListLabel,
} from "@chakra-ui/charts";
import { io, Socket } from "socket.io-client";
import {
  getChatConversations,
  createChatConversation,
  getChatConversation,
  deleteChatConversation,
  type ChatConversation,
  type ChatMessage,
} from "../api";
import { useTheme } from "../context/ThemeContext";

/* ── Chart + Markdown helpers ───────────────────────────────────────── */

type ChartDef = {
  type: "bar" | "line" | "pie" | "barlist";
  title?: string;
  data: Record<string, any>[];
  series?: { name: string; color?: string }[];
  xKey?: string;
};

type MsgPart = { kind: "text"; content: string } | { kind: "chart"; def: ChartDef };

function parseMessage(content: string): MsgPart[] {
  const parts: MsgPart[] = [];
  const re = /:::chart\n([\s\S]*?)\n:::/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ kind: "text", content: content.slice(last, m.index) });
    try { parts.push({ kind: "chart", def: JSON.parse(m[1]) }); } catch { /* skip bad JSON */ }
    last = re.lastIndex;
  }
  if (last < content.length) parts.push({ kind: "text", content: content.slice(last) });
  return parts;
}

const PIE_COLORS = ["#863bff", "#a855f7", "#c084fc", "#e879f9", "#f0abfc"];

type ChartApi = ReturnType<typeof useChart<Record<string, any>>>;

// Shared frame for the Bar and Line blocks (identical except the chart element
// and how each series is drawn).
function CartesianChartBlock({
  def,
  ChartComp,
  renderSeries,
}: {
  def: ChartDef;
  ChartComp: React.ElementType;
  renderSeries: (s: ChartApi["series"][number], chart: ChartApi) => React.ReactNode;
}) {
  const series = def.series?.length
    ? def.series
    : [{ name: Object.keys(def.data[0] ?? {}).find(k => k !== (def.xKey ?? "name")) ?? "value", color: "purple.500" }];
  const chart = useChart({ data: def.data, series });
  return (
    <Box my="3">
      {def.title && <Text fontWeight="semibold" fontSize="sm" mb="2">{def.title}</Text>}
      <ChartRoot chart={chart} h="220px">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComp data={chart.data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={def.xKey ?? "name"} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip content={<ChartTooltip />} />
            {chart.series.map((s) => renderSeries(s, chart))}
          </ChartComp>
        </ResponsiveContainer>
      </ChartRoot>
    </Box>
  );
}

function BarChartBlock({ def }: { def: ChartDef }) {
  return (
    <CartesianChartBlock
      def={def}
      ChartComp={BarChart}
      renderSeries={(s, chart) => (
        <Bar key={String(s.name)} dataKey={String(s.name)} fill={chart.color(s.color)} radius={[4, 4, 0, 0]} />
      )}
    />
  );
}

function LineChartBlock({ def }: { def: ChartDef }) {
  return (
    <CartesianChartBlock
      def={def}
      ChartComp={LineChart}
      renderSeries={(s, chart) => (
        <Line key={String(s.name)} dataKey={String(s.name)} stroke={chart.color(s.color)} strokeWidth={2} dot={false} />
      )}
    />
  );
}

function PieChartBlock({ def }: { def: ChartDef }) {
  const valueKey = def.series?.[0]?.name ?? "value";
  return (
    <Box my="3">
      {def.title && <Text fontWeight="semibold" fontSize="sm" mb="2">{def.title}</Text>}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={def.data} dataKey={valueKey} nameKey={def.xKey ?? "name"} cx="50%" cy="50%" outerRadius={80} label>
            {def.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

function BarListBlock({ def }: { def: ChartDef }) {
  const listData: { name: string; value: number; href?: string }[] = def.data.map(d => ({ name: String(d[def.xKey ?? "name"] ?? ""), value: Number(d.value ?? 0) }));
  const chart = useChart<{ name: string; value: number; href?: string }>({ data: listData });
  return (
    <Box my="3">
      {def.title && <Text fontWeight="semibold" fontSize="sm" mb="2">{def.title}</Text>}
      <BarListRoot chart={chart} colorPalette="purple">
        <BarListContent>
          <BarListLabel title="Nom" />
          <BarListBar tooltip />
          <BarListValue />
        </BarListContent>
      </BarListRoot>
    </Box>
  );
}

function ChartBlock({ def }: { def: ChartDef }) {
  if (!def?.data?.length) return null;
  if (def.type === "line") return <LineChartBlock def={def} />;
  if (def.type === "pie") return <PieChartBlock def={def} />;
  if (def.type === "barlist") return <BarListBlock def={def} />;
  return <BarChartBlock def={def} />;
}

function MessageContent({ content }: { content: string }) {
  const parts = parseMessage(content);
  return (
    <>
      {parts.map((part, i) =>
        part.kind === "chart" ? (
          <ChartBlock key={i} def={part.def} />
        ) : (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            // Sanitize the rendered HTML: LLM/assistant output is untrusted, so
            // strip any dangerous markup and unsafe URL schemes (e.g. javascript:).
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => <Text fontSize="sm" lineHeight="tall" mb="2">{children}</Text>,
              a: ({ href, children }) => {
                const safe =
                  typeof href === "string" && /^(https?:|mailto:)/i.test(href);
                return safe ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#9f7aea", textDecoration: "underline" }}
                  >
                    {children}
                  </a>
                ) : (
                  <span>{children}</span>
                );
              },
              strong: ({ children }) => <Text as="strong" fontWeight="semibold">{children}</Text>,
              em: ({ children }) => <Text as="em" fontStyle="italic">{children}</Text>,
              h1: ({ children }) => <Text fontSize="lg" fontWeight="bold" mt="3" mb="1">{children}</Text>,
              h2: ({ children }) => <Text fontSize="md" fontWeight="bold" mt="3" mb="1">{children}</Text>,
              h3: ({ children }) => <Text fontSize="sm" fontWeight="bold" mt="2" mb="1">{children}</Text>,
              ul: ({ children }) => <Box as="ul" pl="5" mb="2" fontSize="sm" lineHeight="tall">{children}</Box>,
              ol: ({ children }) => <Box as="ol" pl="5" mb="2" fontSize="sm" lineHeight="tall">{children}</Box>,
              li: ({ children }) => <Box as="li" mb="0.5">{children}</Box>,
              blockquote: ({ children }) => (
                <Box borderLeft="3px solid" borderColor="purple.400" pl="3" my="2" opacity={0.8}>{children}</Box>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.startsWith("language-");
                return isBlock ? (
                  <Box
                    as="pre" bg="gray.100" _dark={{ bg: "gray.900" }}
                    borderRadius="md" p="3" my="2" overflowX="auto"
                    fontSize="xs" fontFamily="mono" lineHeight="tall"
                  >
                    <code>{children}</code>
                  </Box>
                ) : (
                  <Box
                    as="code" bg="gray.100" _dark={{ bg: "gray.900" }}
                    px="1" borderRadius="sm" fontSize="xs" fontFamily="mono"
                  >
                    {children}
                  </Box>
                );
              },
              table: ({ children }) => (
                <Box overflowX="auto" my="2">
                  <Table.Root size="sm" variant="outline">{children}</Table.Root>
                </Box>
              ),
              thead: ({ children }) => <Table.Header>{children}</Table.Header>,
              tbody: ({ children }) => <Table.Body>{children}</Table.Body>,
              tr: ({ children }) => <Table.Row>{children}</Table.Row>,
              th: ({ children }) => <Table.ColumnHeader fontSize="xs" fontWeight="semibold">{children}</Table.ColumnHeader>,
              td: ({ children }) => <Table.Cell fontSize="xs">{children}</Table.Cell>,
            }}
          >
            {part.content}
          </ReactMarkdown>
        )
      )}
    </>
  );
}

/* ── End helpers ─────────────────────────────────────────────────────── */

const EXAMPLES = [
  "Quantes fotos hi ha a la galeria?",
  "Estadístiques del sistema",
  "Quants usuaris té l'aplicació?",
  "Factures pendents d'Odoo",
  "Resum de vendes d'aquest mes",
  "Ajuda'm a navegar per l'app",
];

/* Three bouncing dots typing indicator */
const TypingDots: React.FC = () => (
  <HStack gap="1" py="1">
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        w="2"
        h="2"
        rounded="full"
        bg="purple.400"
        style={{
          animation: "bounce 1.2s infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40%            { transform: translateY(-6px); opacity: 1; }
      }
    `}</style>
  </HStack>
);

const GlobalChat: React.FC = () => {
  const { mode } = useTheme();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  // Mirror of activeConvId so the (mount-once) socket handlers can read the
  // current conversation without being re-subscribed on every change.
  const activeConvIdRef = useRef<number | null>(null);

  const pageBg    = mode === "light" ? "gray.50"  : "gray.900";
  const sidebarBg = mode === "light" ? "white"    : "gray.800";
  const msgBg     = mode === "light" ? "white"    : "gray.800";
  const userBubBg = mode === "light" ? "purple.500" : "purple.600";
  const inputBg   = mode === "light" ? "white"    : "gray.800";
  const borderCol = mode === "light" ? "gray.200" : "gray.700";

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    getChatConversations()
      .then(({ data }) => {
        setConversations(data);
        if (data.length > 0) setActiveConvId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    getChatConversation(activeConvId)
      .then(({ data }) => {
        setMessages(data.messages ?? []);
        setTimeout(scrollToBottom, 50);
      })
      .catch(console.error);
  }, [activeConvId]);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // Create the socket once, wire the handlers once, and disconnect on unmount.
  useEffect(() => {
    // Auth travels via the HttpOnly cookie sent with the handshake; the gateway
    // reads it server-side (no token in JS).
    const socket = io("/chat", { withCredentials: true, path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    });

    socket.on("chat:typing", () => setIsTyping(true));

    socket.on("chat:error", (err: { message: string }) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), conversationId: activeConvIdRef.current ?? 0, role: "assistant", content: err.message, createdAt: new Date().toISOString() },
      ]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on("chat:title_updated", (data: { conversationId: number; title: string }) => {
      setConversations((prev) =>
        prev.map((c) => c.id === data.conversationId ? { ...c, title: data.title } : c)
      );
    });

    setIsConnected(socket.connected);
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConvId) return;
    socket.emit("chat:join", { conversationId: activeConvId });
    return () => { socket.emit("chat:leave", { conversationId: activeConvId }); };
  }, [activeConvId]);

  const send = useCallback((question: string) => {
    if (!question.trim() || isTyping || !activeConvId) return;
    const socket = socketRef.current;
    if (!socket) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    socket.emit("chat:send", { conversationId: activeConvId, message: question });
  }, [isTyping, activeConvId]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const handleNewConversation = async () => {
    try {
      const { data } = await createChatConversation();
      setConversations((prev) => [data, ...prev]);
      setActiveConvId(data.id);
      setMessages([]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) { console.error(err); }
  };

  const handleSelectConversation = (id: number) => {
    if (id !== activeConvId) { setActiveConvId(id); setMessages([]); setIsTyping(false); }
    setDrawerOpen(false);
  };

  const ConversationList = () => (
    <Flex direction="column" h="full" overflow="hidden">
      <Box p="3" borderBottom="1px solid" borderColor={borderCol} flexShrink={0}>
        <Button size="sm" colorPalette="purple" width="full" variant="ghost"
          onClick={() => { handleNewConversation(); setDrawerOpen(false); }}
        >
          <PenSquare size={15} style={{ marginRight: "6px" }} />
          Nova conversa
        </Button>
      </Box>
      <VStack align="stretch" flex="1" overflowY="auto" gap="0" p="2">
        {loadingConvs ? (
          <Flex justify="center" pt="6"><Spinner size="sm" /></Flex>
        ) : conversations.length === 0 ? (
          <Text fontSize="xs" color="fg.muted" textAlign="center" pt="6">Cap conversa</Text>
        ) : conversations.map((conv) => (
          <Flex
            key={conv.id} align="center" justify="space-between"
            px="2.5" py="2" borderRadius="lg" cursor="pointer" gap="1"
            bg={activeConvId === conv.id ? (mode === "light" ? "gray.100" : "gray.700") : "transparent"}
            _hover={{ bg: mode === "light" ? "gray.100" : "gray.700" }}
            onClick={() => handleSelectConversation(conv.id)}
          >
            <HStack gap="2" flex="1" minW="0">
              <MessageSquare size={13} color="#863bff" style={{ flexShrink: 0 }} />
              <Text
                fontSize="xs"
                fontWeight={activeConvId === conv.id ? "medium" : "normal"}
                overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis"
              >
                {conv.title}
              </Text>
            </HStack>
            <IconButton
              aria-label="Eliminar" size="2xs" variant="ghost" colorPalette="red"
              onClick={(e) => handleDeleteConversation(conv.id, e)}
              style={{ flexShrink: 0, opacity: 0.6 }}
            >
              <Trash2 size={11} />
            </IconButton>
          </Flex>
        ))}
      </VStack>
    </Flex>
  );

  const activeTitle = conversations.find(c => c.id === activeConvId)?.title ?? "Chat Global";

  return (
    <>
      {/* Mobile drawer */}
      <Drawer.Root open={drawerOpen} onOpenChange={({ open }) => setDrawerOpen(open)} placement="start">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content w="280px" bg={sidebarBg}>
              <Drawer.Header borderBottomWidth="1px" borderColor={borderCol} pb="3">
                <Drawer.Title fontSize="sm" fontWeight="semibold">Converses</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <IconButton aria-label="Tancar" size="sm" variant="ghost"><X size={16} /></IconButton>
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body p="0" display="flex" flexDirection="column" flex="1" overflow="hidden">
                <ConversationList />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Flex
        direction="row"
        h={{ base: "calc(100dvh - 56px)", md: "calc(100vh - 56px)" }}
        bg={pageBg}
        overflow="hidden"
      >
        {/* Desktop sidebar */}
        <Flex
          direction="column" w="260px" flexShrink={0}
          display={{ base: "none", md: "flex" }}
          bg={sidebarBg}
          borderRight="1px solid" borderColor={borderCol}
        >
          <ConversationList />
        </Flex>

        {/* Main pane */}
        <Flex direction="column" flex="1" minW="0" overflow="hidden">

          {/* Top bar */}
          <HStack
            px={{ base: "3", md: "4" }} h="12" flexShrink={0}
            borderBottom="1px solid" borderColor={borderCol}
            bg={msgBg}
            justify="space-between"
          >
            <HStack gap="2">
              <IconButton
                aria-label="Converses" size="sm" variant="ghost"
                display={{ base: "flex", md: "none" }}
                onClick={() => setDrawerOpen(true)}
              >
                <Menu size={18} />
              </IconButton>
              <Bot size={18} color="#863bff" />
              <Text
                fontSize="sm" fontWeight="semibold"
                maxW={{ base: "160px", md: "320px" }}
                overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis"
              >
                {activeConvId ? activeTitle : "Chat Global"}
              </Text>
            </HStack>
            <HStack gap="1.5">
              {isConnected
                ? <><Wifi size={13} color="#22c55e" /><Text fontSize="xs" color="green.500" display={{ base: "none", md: "block" }}>Connectat</Text></>
                : <><WifiOff size={13} color="#ef4444" /><Text fontSize="xs" color="red.500" display={{ base: "none", md: "block" }}>Desconnectat</Text></>
              }
              {/* New conversation button on desktop */}
              <IconButton
                aria-label="Nova conversa" size="sm" variant="ghost"
                display={{ base: "none", md: "flex" }}
                onClick={handleNewConversation}
              >
                <PenSquare size={16} />
              </IconButton>
            </HStack>
          </HStack>

          {/* Messages */}
          <Box flex="1" overflowY="auto" bg={pageBg}>
            {!activeConvId ? (
              <VStack gap="5" pt="16" pb="8" px="4" align="center">
                <Box p="3" rounded="2xl" bg="purple.500">
                  <Bot size={28} color="white" />
                </Box>
                <VStack gap="1">
                  <Text fontWeight="semibold" fontSize="lg">Chat Global</Text>
                  <Text color="fg.muted" fontSize="sm" textAlign="center" maxW="sm">
                    Crea una nova conversa per parlar amb l'assistent.
                  </Text>
                </VStack>
                <Button colorPalette="purple" size="sm" onClick={handleNewConversation}>
                  <Plus size={14} style={{ marginRight: "6px" }} />
                  Nova conversa
                </Button>
              </VStack>
            ) : messages.length === 0 && !isTyping ? (
              <VStack gap="5" pt="16" pb="8" px="4" align="center">
                <Box p="3" rounded="2xl" bg="purple.500">
                  <Bot size={28} color="white" />
                </Box>
                <VStack gap="1">
                  <Text fontWeight="semibold" fontSize="lg">Com puc ajudar-te?</Text>
                  <Text color="fg.muted" fontSize="sm" textAlign="center" maxW="sm">
                    Pregunta sobre l'aplicació o el teu negoci.
                  </Text>
                </VStack>
                <Flex flexWrap="wrap" gap="2" justify="center" maxW="lg">
                  {EXAMPLES.map((ex) => (
                    <Button
                      key={ex} size="sm" variant="outline" colorPalette="purple"
                      borderRadius="full" onClick={() => send(ex)}
                    >
                      {ex}
                    </Button>
                  ))}
                </Flex>
              </VStack>
            ) : (
              <Box maxW="760px" mx="auto" px={{ base: "4", md: "6" }} py="6">
                <VStack align="stretch" gap="6">
                  {messages.map((msg) => (
                    <Box key={msg.id}>
                      {msg.role === "user" ? (
                        /* User message — right aligned bubble */
                        <Flex justify="flex-end">
                          <Box
                            bg={userBubBg} color="white"
                            px="4" py="2.5" borderRadius="2xl" borderBottomRightRadius="sm"
                            maxW={{ base: "85%", md: "70%" }}
                            fontSize="sm" lineHeight="tall" whiteSpace="pre-wrap"
                          >
                            {msg.content}
                          </Box>
                        </Flex>
                      ) : (
                        /* Assistant message — full width, no bubble */
                        <Flex gap="3" align="flex-start">
                          <Box
                            flexShrink={0} mt="0.5"
                            w="7" h="7" rounded="full" bg="purple.500"
                            display="flex" alignItems="center" justifyContent="center"
                          >
                            <Bot size={14} color="white" />
                          </Box>
                          <Box flex="1" minW="0">
                            <MessageContent content={msg.content} />
                            {msg.intent && (
                              <HStack gap="1.5" mt="2">
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
                        </Flex>
                      )}
                    </Box>
                  ))}

                  {isTyping && (
                    <Flex gap="3" align="flex-start">
                      <Box
                        flexShrink={0} mt="0.5"
                        w="7" h="7" rounded="full" bg="purple.500"
                        display="flex" alignItems="center" justifyContent="center"
                      >
                        <Bot size={14} color="white" />
                      </Box>
                      <TypingDots />
                    </Flex>
                  )}
                  <div ref={bottomRef} />
                </VStack>
              </Box>
            )}
          </Box>

          {/* Input area */}
          <Box
            bg={pageBg}
            px={{ base: "3", md: "6" }}
            pt="3"
            pb={{ base: "calc(env(safe-area-inset-bottom, 0px) + 12px)", md: "4" }}
            flexShrink={0}
          >
            <Box
              maxW="760px" mx="auto"
              bg={inputBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderCol}
              boxShadow="sm"
              display="flex"
              alignItems="flex-end"
              gap="2"
              px="4"
              py="2"
              _focusWithin={{
                borderColor: "purple.400",
                boxShadow: "0 0 0 3px var(--chakra-colors-purple-100)",
              }}
            >
              <Textarea
                ref={textareaRef}
                placeholder={activeConvId ? "Escriu un missatge..." : "Crea una conversa per escriure..."}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKey}
                disabled={isTyping || !activeConvId}
                rows={1}
                resize="none"
                border="none"
                outline="none"
                bg="transparent"
                flex="1"
                fontSize="sm"
                lineHeight="tall"
                py="1.5"
                px="0"
                style={{ boxShadow: "none", overflowY: "auto", maxHeight: "180px" }}
                _focus={{ boxShadow: "none", border: "none" }}
                _disabled={{ opacity: 0.5 }}
              />
              <IconButton
                aria-label="Enviar"
                size="sm"
                colorPalette="purple"
                borderRadius="xl"
                disabled={!input.trim() || isTyping || !activeConvId}
                onClick={() => send(input)}
                mb="0.5"
                flexShrink={0}
              >
                {isTyping ? <Spinner size="xs" /> : <Send size={15} />}
              </IconButton>
            </Box>
            <Text fontSize="2xs" color="fg.subtle" textAlign="center" mt="1.5">
              Enter per enviar · Shift+Enter per saltar línia
            </Text>
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default GlobalChat;
