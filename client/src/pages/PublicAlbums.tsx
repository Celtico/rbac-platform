import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import {
  Box,
  Button,
  Container,
  EmptyState,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bot,
  Building2,
  Check,
  FileText,
  ImageIcon,
  Lock,
  Monitor,
  Moon,
  ScrollText,
  Shield,
  ShoppingCart,
  Smartphone,
  Sun,
  TriangleAlert,
  User,
  Users,
  Zap,
} from "lucide-react";
import m1 from "../assets/m1.png";
import m2 from "../assets/m2.png";
import { useTheme } from "../context/ThemeContext";
import {
  Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface Photo {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
}

const FEATURES = [
  {
    icon: Bot,
    color: "purple.500",
    bg: "purple.50",
    darkBg: "purple.950",
    title: "IA Conversacional",
    desc: "Xat integrat amb LangChain que respon preguntes sobre el negoci, estadístiques i dades d'Odoo en temps real.",
  },
  {
    icon: ShoppingCart,
    color: "blue.500",
    bg: "blue.50",
    darkBg: "blue.950",
    title: "Integració Odoo",
    desc: "KPIs en viu: vendes, clients, productes, factures pendents, oportunitats CRM i empleats.",
  },
  {
    icon: Shield,
    color: "orange.500",
    bg: "orange.50",
    darkBg: "orange.950",
    title: "Control d'Accés RBAC",
    desc: "Rols i permisos granulars. Cada usuari veu exactament allò que li pertoca, res més.",
  },
  {
    icon: Users,
    color: "teal.500",
    bg: "teal.50",
    darkBg: "teal.950",
    title: "Gestió d'Usuaris",
    desc: "Alta, edició i desactivació d'usuaris. Assignació de rols i auditoria d'accions.",
  },
  {
    icon: Building2,
    color: "cyan.500",
    bg: "cyan.50",
    darkBg: "cyan.950",
    title: "Multi-tenant",
    desc: "Suport per múltiples organitzacions sota la mateixa plataforma, cadascuna amb la seva configuració.",
  },
  {
    icon: Monitor,
    color: "gray.500",
    bg: "gray.50",
    darkBg: "gray.800",
    title: "Gestió de Dispositius",
    desc: "Control de sessions actives per dispositiu. Revoca l'accés remotament en qualsevol moment.",
  },
  {
    icon: ScrollText,
    color: "yellow.600",
    bg: "yellow.50",
    darkBg: "yellow.950",
    title: "Logs del Sistema",
    desc: "Registre d'esdeveniments en temps real via SSE. Diagnosi ràpida sense eines externes.",
  },
  {
    icon: Lock,
    color: "red.500",
    bg: "red.50",
    darkBg: "red.950",
    title: "Seguretat Avançada",
    desc: "Autenticació JWT, detecció de nous dispositius, alertes de sessions concurrents i tokens de refresc.",
  },
  {
    icon: ImageIcon,
    color: "pink.500",
    bg: "pink.50",
    darkBg: "pink.950",
    title: "Galeria Pública",
    desc: "Àlbums i fotos accessibles sense login. Gestió completa des del panell d'administració.",
  },
];

/* ── Tech Section ────────────────────────────────────────────────────── */

const RADAR_DATA = [
  { axis: "Frontend",    val: 95 },
  { axis: "Backend",     val: 92 },
  { axis: "IA / LLM",   val: 88 },
  { axis: "ERP / Odoo",  val: 82 },
  { axis: "Seguretat",   val: 90 },
  { axis: "Multi-tenant",val: 85 },
];

const PILLARS = [
  {
    icon: Building2,
    color: "purple",
    title: "SaaS multi-tenant",
    desc: "Múltiples organitzacions sota una sola plataforma, cadascuna amb la seva configuració, usuaris i dades completament aïllades.",
    tags: ["NestJS", "TypeORM", "SQLite"],
  },
  {
    icon: Bot,
    color: "cyan",
    title: "Chat IA connectat a ERP",
    desc: "LangChain + GPT orquestra les respostes consultant Odoo en temps real. Vendes, factures i KPIs a un missatge de distància.",
    tags: ["LangChain", "OpenAI", "Odoo JSON-RPC"],
  },
  {
    icon: Zap,
    color: "pink",
    title: "Frontend modern",
    desc: "React 19 + Chakra UI v3 amb temes personalitzables, mode fosc, responsive complet i animacions fluides.",
    tags: ["React 19", "Chakra UI", "Recharts"],
  },
  {
    icon: Shield,
    color: "orange",
    title: "Backend intel·ligent",
    desc: "NestJS modular amb guards RBAC, middleware de sessions, SSE per logs en temps real i API RESTful documentada amb Swagger.",
    tags: ["NestJS", "JWT", "Socket.IO"],
  },
  {
    icon: Monitor,
    color: "green",
    title: "Arquitectura vendible",
    desc: "Docker multi-stage, desplegament zero-downtime des del propi panell, logs estructurats i rollback automàtic.",
    tags: ["Docker", "CI/CD", "Auto-deploy"],
  },
];

const TechSection: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <Box py={{ base: "16", md: "24" }} bg={isDark ? "gray.900" : "white"}>
    <Container maxW="7xl">
      <VStack gap="4" textAlign="center" mb="12">
        <Text fontSize="xs" fontWeight="bold" color="purple.500" textTransform="uppercase" letterSpacing="widest">
          Stack tecnològic
        </Text>
        <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          Construït per durar
        </Heading>
        <Text color="fg.muted" maxW="xl" fontSize={{ base: "sm", md: "md" }}>
          Cada capa de la plataforma ha estat triada per maximitzar rendiment, seguretat i velocitat de desenvolupament.
        </Text>
      </VStack>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: "10", lg: "16" }} alignItems="center" mb="16">

        {/* Radar chart */}
        <Box
          rounded="2xl"
          borderWidth="1px"
          borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
          bg={isDark ? "gray.800" : "gray.50"}
          p={{ base: "4", md: "8" }}
        >
          <Text fontWeight="semibold" fontSize="sm" mb="4" textAlign="center" color="fg.muted">
            Cobertura per capa
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke={isDark ? "#ffffff15" : "#00000010"} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 11, fill: isDark ? "#aaa" : "#666" }}
              />
              <Radar
                name="Plataforma"
                dataKey="val"
                stroke="#863bff"
                fill="#863bff"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 3, fill: "#863bff" }}
                isAnimationActive
                animationDuration={1200}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#1a1a2e" : "#fff",
                  border: `1px solid ${isDark ? "#ffffff20" : "#00000015"}`,
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(v) => [`${v}%`, "Maduresa"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        {/* Right: tag cloud */}
        <VStack align="start" gap="5">
          {[
            { label: "Llenguatges",   tags: ["TypeScript", "SQL", "Bash"] },
            { label: "Frontend",      tags: ["React 19", "Chakra UI v3", "Vite", "Recharts"] },
            { label: "Backend",       tags: ["NestJS", "Socket.IO", "Swagger", "TypeORM"] },
            { label: "IA & ERP",      tags: ["LangChain", "OpenAI GPT-4o", "Odoo 17"] },
            { label: "Infraestructura",tags: ["Docker", "Nginx", "SQLite", "JWT"] },
          ].map(({ label, tags }) => (
            <Box key={label} w="full">
              <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase"
                letterSpacing="wide" mb="2">{label}</Text>
              <HStack flexWrap="wrap" gap="2">
                {tags.map(tag => (
                  <Box
                    key={tag}
                    px="3" py="1"
                    rounded="full"
                    fontSize="xs"
                    fontWeight="medium"
                    borderWidth="1px"
                    borderColor={isDark ? "purple.700" : "purple.200"}
                    bg={isDark ? "purple.950" : "purple.50"}
                    color="purple.500"
                  >
                    {tag}
                  </Box>
                ))}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Grid>

      {/* Pillars */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="5">
        {PILLARS.map(({ icon: Icon, color, title, desc, tags }) => (
          <Box
            key={title}
            p="6"
            rounded="xl"
            borderWidth="1px"
            borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
            bg={isDark ? "gray.800" : "gray.50"}
            transition="all 0.2s"
            _hover={{ shadow: "lg", transform: "translateY(-3px)", borderColor: `${color}.400` }}
          >
            <HStack gap="3" mb="3">
              <Box
                w="9" h="9" rounded="lg" flexShrink={0}
                bg={isDark ? `${color}.900` : `${color}.50`}
                display="flex" alignItems="center" justifyContent="center"
              >
                <Icon size={18} color={`var(--chakra-colors-${color}-500)`} />
              </Box>
              <Text fontWeight="semibold" fontSize="sm">{title}</Text>
            </HStack>
            <Text fontSize="xs" color="fg.muted" lineHeight="relaxed" mb="3">{desc}</Text>
            <HStack flexWrap="wrap" gap="1.5">
              {tags.map(t => (
                <Box
                  key={t} px="2" py="0.5" rounded="sm" fontSize="2xs" fontWeight="medium"
                  bg={isDark ? `${color}.900` : `${color}.50`}
                  color={`${color}.500`}
                >
                  {t}
                </Box>
              ))}
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  </Box>
);

/* ── Helpers ─────────────────────────────────────────────────────────── */

function rnd(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function genPoint(t: number) {
  return { t: `${String(t).padStart(2,"0")}:00`, vendes: rnd(8,42), cpu: rnd(18,72), usuaris: rnd(3,18) };
}

const INITIAL_DATA = Array.from({ length: 10 }, (_, i) => genPoint(i + 8));

const METRICS = [
  { key: "vendes",  label: "Vendes/h",      color: "#863bff", unit: "" },
  { key: "cpu",     label: "CPU %",         color: "#06b6d4", unit: "%" },
  { key: "usuaris", label: "Usuaris actius", color: "#10b981", unit: "" },
];

const LiveDataSection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [data, setData] = useState(INITIAL_DATA);
  const [pulse, setPulse] = useState(false);
  const hourRef = useRef(18);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      hourRef.current = (hourRef.current + 1) % 24;
      setData(prev => [...prev.slice(-11), genPoint(hourRef.current)]);
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }, 1800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const last = data[data.length - 1];

  return (
    <Box py={{ base: "16", md: "24" }} bg={isDark ? "gray.950" : "gray.50"} overflow="hidden">
      <Container maxW="7xl">
        <VStack gap="4" textAlign="center" mb="12">
          <HStack gap="2" justify="center">
            <Box w="2" h="2" rounded="full" bg="green.400"
              style={{ animation: "ping 1.5s cubic-bezier(0,0,.2,1) infinite" }}
            />
            <Text fontSize="xs" fontWeight="bold" color="green.500" textTransform="uppercase" letterSpacing="widest">
              Dades en temps real
            </Text>
          </HStack>
          <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            El teu negoci,{" "}
            <Box as="span" bgGradient="to-r" gradientFrom="purple.500" gradientTo="cyan.400" bgClip="text">
              sempre al dia
            </Box>
          </Heading>
          <Text color="fg.muted" maxW="xl" fontSize={{ base: "sm", md: "md" }}>
            La plataforma recull i visualitza mètriques en temps real: vendes, rendiment del servidor i activitat d'usuaris, tot en un sol panell.
          </Text>
        </VStack>

        {/* Dashboard card */}
        <Box
          maxW="4xl" mx="auto"
          rounded="2xl"
          borderWidth="1px"
          borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
          bg={isDark ? "gray.900" : "white"}
          shadow="xl"
          overflow="hidden"
        >
          {/* Window bar */}
          <HStack
            px="4" py="2.5"
            bg={isDark ? "gray.800" : "gray.100"}
            borderBottomWidth="1px"
            borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
            gap="2"
          >
            <HStack gap="1.5">
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <Box key={c} w="3" h="3" rounded="full" bg={c} />
              ))}
            </HStack>
            <Text fontSize="xs" color="fg.muted" flex="1" textAlign="center" fontFamily="mono">
              RBAC Platform — Live Dashboard
            </Text>
            <HStack gap="1">
              <Box
                w="2" h="2" rounded="full"
                bg={pulse ? "green.400" : "green.500"}
                style={{ transition: "background 0.2s", boxShadow: pulse ? "0 0 6px #4ade80" : "none" }}
              />
              <Text fontSize="2xs" color="green.500" fontFamily="mono">LIVE</Text>
            </HStack>
          </HStack>

          {/* Metric badges */}
          <SimpleGrid columns={3} gap="0" borderBottomWidth="1px" borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}>
            {METRICS.map(m => (
              <Box
                key={m.key}
                px="4" py="3"
                textAlign="center"
                borderRightWidth="1px"
                borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
                _last={{ borderRight: "none" }}
              >
                <Text
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="bold"
                  fontFamily="mono"
                  color={m.color}
                  style={{ transition: "all 0.4s" }}
                >
                  {(last as { t: string; vendes: number; cpu: number; usuaris: number })[m.key as "vendes"|"cpu"|"usuaris"]}{m.unit}
                </Text>
                <Text fontSize="2xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">{m.label}</Text>
              </Box>
            ))}
          </SimpleGrid>

          {/* Chart */}
          <Box px={{ base: "2", md: "4" }} py="4" h="220px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  {METRICS.map(m => (
                    <linearGradient key={m.key} id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff12" : "#00000010"} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: isDark ? "#888" : "#aaa" }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? "#888" : "#aaa" }} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1a1a2e" : "#fff",
                    border: `1px solid ${isDark ? "#ffffff20" : "#00000015"}`,
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                {METRICS.map(m => (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#g-${m.key})`}
                    dot={false}
                    isAnimationActive
                    animationDuration={600}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          {/* Legend */}
          <HStack justify="center" gap="5" pb="4" flexWrap="wrap">
            {METRICS.map(m => (
              <HStack key={m.key} gap="1.5">
                <Box w="2.5" h="2.5" rounded="sm" bg={m.color} />
                <Text fontSize="xs" color="fg.muted">{m.label}</Text>
              </HStack>
            ))}
          </HStack>
        </Box>

        <style>{`
          @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </Container>
    </Box>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────── */

const PublicAlbums: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isDark = mode === "dark";

  const fetchPhotos = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/photos", { params: { page: 1, limit: 4 } });
      setPhotos(res.data.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return (
    <Box minH="100vh" bg={isDark ? "gray.950" : "gray.50"} color="fg">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <Box
        as="nav"
        position="sticky"
        top="0"
        zIndex="banner"
        bg={isDark ? "rgba(10,10,20,0.85)" : "rgba(255,255,255,0.85)"}
        backdropFilter="blur(12px)"
        borderBottomWidth="1px"
        borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
      >
        <Container maxW="7xl" py="3">
          <Flex justify="space-between" align="center">
            <HStack gap="2">
              <Box
                w="8"
                h="8"
                rounded="lg"
                bgGradient="to-br"
                gradientFrom="purple.500"
                gradientTo="blue.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Zap size={16} color="white" />
              </Box>
              <Text
                fontWeight="bold"
                fontSize="lg"
                letterSpacing="tight"
                display={{ base: "none", sm: "block" }}
              >
                RBAC Platform
              </Text>
            </HStack>
            <HStack gap="2">
              <IconButton
                aria-label="Canviar tema"
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={toggleMode}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <Button size="sm" colorPalette="purple" asChild>
                <Link to="/admin">Panell Admin</Link>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <Box position="relative" overflow="hidden" py={{ base: "20", md: "32" }}>
        {/* Background gradient blobs */}
        <Box
          position="absolute"
          top="-20%"
          left="-10%"
          w="600px"
          h="600px"
          rounded="full"
          bg={isDark ? "purple.900" : "purple.100"}
          opacity={isDark ? 0.4 : 0.6}
          filter="blur(80px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-20%"
          right="-5%"
          w="500px"
          h="500px"
          rounded="full"
          bg={isDark ? "blue.900" : "blue.100"}
          opacity={isDark ? 0.3 : 0.5}
          filter="blur(80px)"
          pointerEvents="none"
        />

        <Container maxW="5xl" position="relative">
          <VStack gap="6" textAlign="center">
            <Box
              display="inline-flex"
              px="4"
              py="1.5"
              rounded="full"
              bg={isDark ? "purple.900" : "purple.50"}
              borderWidth="1px"
              borderColor={isDark ? "purple.700" : "purple.200"}
            >
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="purple.500"
                letterSpacing="wide"
                textTransform="uppercase"
              >
                Plataforma d'Administració Empresarial
              </Text>
            </Box>

            <Heading
              fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
              fontWeight="extrabold"
              lineHeight="1.1"
              letterSpacing="tight"
            >
              Tot el control,{" "}
              <Box
                as="span"
                bgGradient="to-r"
                gradientFrom="purple.500"
                gradientTo="blue.400"
                bgClip="text"
              >
                en un sol lloc
              </Box>
            </Heading>

            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color="fg.muted"
              maxW="2xl"
              lineHeight="relaxed"
            >
              Gestió d'usuaris, rols i permisos, integració Odoo, IA
              conversacional, galeria multimèdia i logs del sistema. Una
              plataforma RBAC pensada per a equips reals.
            </Text>

            <HStack gap="4" flexWrap="wrap" justify="center" pt="2">
              <Button
                size="xl"
                colorPalette="purple"
                rounded="full"
                px="8"
                asChild
              >
                <Link to="/admin">Obrir el panell</Link>
              </Button>
              <Button size="xl" variant="outline" rounded="full" px="8" asChild>
                <a href="#galeria">Veure galeria</a>
              </Button>
            </HStack>

            {/* Stats */}
            <SimpleGrid columns={3} gap={{ base: "6", md: "12" }} pt="8">
              {[
                { value: "RBAC", label: "Control d'accés" },
                { value: "LangChain", label: "IA integrada" },
                { value: "Odoo", label: "ERP connectat" },
              ].map(({ value, label }) => (
                <VStack key={label} gap="1">
                  <Text
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="bold"
                    color="purple.500"
                  >
                    {value}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {label}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* ── Features ────────────────────────────────────────────────── */}
      <Box py={{ base: "16", md: "24" }} bg={isDark ? "gray.900" : "white"}>
        <Container maxW="7xl">
          <VStack gap="4" textAlign="center" mb="12">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="purple.500"
              textTransform="uppercase"
              letterSpacing="widest"
            >
              Funcionalitats
            </Text>
            <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              Tot el que necessites
            </Heading>
            <Text color="fg.muted" maxW="xl">
              Cada mòdul està dissenyat per treballar de forma integrada amb la
              resta de la plataforma.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="6">
            {FEATURES.map(({ icon: Icon, color, bg, darkBg, title, desc }) => (
              <Box
                key={title}
                p="6"
                rounded="xl"
                borderWidth="1px"
                borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
                bg={isDark ? "gray.800" : "white"}
                transition="all 0.2s"
                _hover={{
                  shadow: "lg",
                  transform: "translateY(-3px)",
                  borderColor: color,
                }}
              >
                <Box
                  w="10"
                  h="10"
                  rounded="lg"
                  mb="4"
                  bg={isDark ? darkBg : bg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon
                    size={20}
                    color={`var(--chakra-colors-${color.replace(".", "-")})`}
                  />
                </Box>
                <Text fontWeight="semibold" mb="2">
                  {title}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight="relaxed">
                  {desc}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <LiveDataSection isDark={isDark} />

      {/* ── Invoice Chat Spotlight ──────────────────────────────────── */}
      <Box py={{ base: "16", md: "24" }} bg={isDark ? "gray.950" : "gray.50"}>
        <Container maxW="7xl">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: "10", lg: "16" }} alignItems="center">

            {/* Left: description */}
            <VStack align="start" gap="6">
              <Box
                display="inline-flex"
                px="3" py="1"
                rounded="full"
                bg={isDark ? "green.900" : "green.50"}
                borderWidth="1px"
                borderColor={isDark ? "green.700" : "green.200"}
              >
                <Text fontSize="xs" fontWeight="semibold" color="green.500" letterSpacing="wide" textTransform="uppercase">
                  Nova funcionalitat
                </Text>
              </Box>
              <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="1.2">
                Crea factures a Odoo{" "}
                <Box as="span" bgGradient="to-r" gradientFrom="purple.500" gradientTo="blue.500" bgClip="text">
                  parlant amb el chat
                </Box>
              </Heading>
              <Text color="fg.muted" fontSize={{ base: "sm", md: "md" }} lineHeight="relaxed">
                L'assistent IA t'acompanya pas a pas: et demana el client, els articles i els imports, i crea la factura directament a Odoo sense que hagis de sortir de la plataforma.
              </Text>
              <VStack align="start" gap="3">
                {[
                  "Detecta automàticament el client per nom o NIF",
                  "Afegeix múltiples línies de productes i quantitats",
                  "Aplica descomptes i calcula l'IVA",
                  "Crea la factura a Odoo amb un sol missatge de confirmació",
                ].map((item) => (
                  <HStack key={item} gap="3">
                    <Box
                      w="5" h="5" rounded="full" bg="green.500" flexShrink={0}
                      display="flex" alignItems="center" justifyContent="center"
                    >
                      <Check size={11} color="white" />
                    </Box>
                    <Text fontSize="sm" color="fg.muted">{item}</Text>
                  </HStack>
                ))}
              </VStack>
              <Button colorPalette="purple" rounded="full" px="6" asChild>
                <Link to="/admin">Provar ara</Link>
              </Button>
            </VStack>

            {/* Right: mock chat */}
            <Box
              bg={isDark ? "gray.800" : "white"}
              rounded="2xl"
              shadow="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
            >
              {/* Chat header */}
              <HStack px="4" py="3" borderBottomWidth="1px" borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"} bg={isDark ? "gray.900" : "gray.50"} gap="2">
                <Box w="6" h="6" rounded="full" bg="purple.500" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Bot size={13} color="white" />
                </Box>
                <Text fontSize="sm" fontWeight="semibold">Chat Global</Text>
                <Box w="2" h="2" rounded="full" bg="green.400" ml="auto" />
              </HStack>

              {/* Messages */}
              <VStack align="stretch" gap="4" p="4">
                {[
                  { role: "user",      text: "Necessito fer una factura per a Acme Corp" },
                  { role: "assistant", text: "D'acord! He trobat el client Acme Corp (NIF: B-12345678). Quins articles vols afegir a la factura?" },
                  { role: "user",      text: "2 llicències de software a 450€ i 1 hora de consultoria a 120€" },
                  { role: "assistant", text: "Perfecte. Resum de la factura:\n• 2× Llicència software → 900,00 €\n• 1× Consultoria (1h) → 120,00 €\n• IVA 21% → 214,20 €\n\nTotal: 1.234,20 €\n\nConfirmes que vols crear la factura a Odoo?" },
                  { role: "user",      text: "Sí, crea-la" },
                  { role: "assistant", text: "✅ Factura creada a Odoo! Referència: INV/2026/00142 — Acme Corp — 1.234,20 €", isSuccess: true },
                ].map((msg, i) => (
                  <Flex key={i} justify={msg.role === "user" ? "flex-end" : "flex-start"} gap="2" align="flex-start">
                    {msg.role === "assistant" && (
                      <Box w="6" h="6" rounded="full" bg="purple.500" display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt="0.5">
                        <Bot size={12} color="white" />
                      </Box>
                    )}
                    <Box
                      maxW="80%"
                      px="3" py="2"
                      rounded="xl"
                      borderTopRightRadius={msg.role === "user" ? "sm" : "xl"}
                      borderTopLeftRadius={msg.role === "assistant" ? "sm" : "xl"}
                      bg={
                        msg.role === "user"
                          ? "purple.500"
                          : (msg as { isSuccess?: boolean }).isSuccess
                          ? (isDark ? "green.900" : "green.50")
                          : (isDark ? "gray.700" : "gray.100")
                      }
                      borderWidth={(msg as { isSuccess?: boolean }).isSuccess ? "1px" : "0"}
                      borderColor="green.300"
                    >
                      <Text
                        fontSize="xs"
                        color={msg.role === "user" ? "white" : (msg as { isSuccess?: boolean }).isSuccess ? "green.600" : undefined}
                        whiteSpace="pre-wrap"
                        lineHeight="relaxed"
                      >
                        {msg.text}
                      </Text>
                    </Box>
                    {msg.role === "user" && (
                      <Box w="6" h="6" rounded="full" bg="gray.200" display="flex" alignItems="center" justifyContent="center" flexShrink={0} mt="0.5">
                        <User size={12} color="#6b7280" />
                      </Box>
                    )}
                  </Flex>
                ))}

                {/* Invoice badge */}
                <Flex justify="center">
                  <HStack gap="2" px="3" py="2" rounded="full" bg={isDark ? "green.900" : "green.50"} borderWidth="1px" borderColor="green.300">
                    <FileText size={13} color="#16a34a" />
                    <Text fontSize="xs" fontWeight="semibold" color="green.600">INV/2026/00142 creada a Odoo</Text>
                  </HStack>
                </Flex>
              </VStack>
            </Box>

          </Grid>
        </Container>
      </Box>

      {/* ── Mobile Section ──────────────────────────────────────────── */}
      <Box py={{ base: "16", md: "24" }} bg={isDark ? "gray.900" : "white"}>
        <Container maxW="7xl">
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: "12", lg: "16" }} alignItems="center">

            {/* Left: phones */}
            <Flex justify="center" gap={{ base: "4", md: "6" }} align="flex-end">
              {[m1, m2].map((src, i) => (
                <Box
                  key={i}
                  flexShrink={0}
                  w={{ base: "140px", md: "170px" }}
                  style={{
                    transform: i === 0 ? "rotate(-4deg) translateY(12px)" : "rotate(3deg)",
                  }}
                >
                  {/* Phone frame */}
                  <Box
                    position="relative"
                    rounded="3xl"
                    borderWidth="3px"
                    borderColor={isDark ? "gray.600" : "gray.300"}
                    bg={isDark ? "gray.950" : "gray.900"}
                    shadow="2xl"
                    overflow="hidden"
                    pt="5"
                    pb="3"
                    px="1.5"
                  >
                    {/* Notch */}
                    <Box
                      position="absolute"
                      top="0"
                      left="50%"
                      transform="translateX(-50%)"
                      w="28%"
                      h="3"
                      bg={isDark ? "gray.800" : "gray.700"}
                      roundedBottom="full"
                    />
                    {/* Screen */}
                    <Box rounded="2xl" overflow="hidden">
                      <Image src={src} alt={`Vista mòbil ${i + 1}`} w="full" display="block" />
                    </Box>
                    {/* Home bar */}
                    <Flex justify="center" pt="2">
                      <Box w="20%" h="1" rounded="full" bg={isDark ? "gray.600" : "gray.500"} />
                    </Flex>
                  </Box>
                </Box>
              ))}
            </Flex>

            {/* Right: description */}
            <VStack align="start" gap="6">
              <Box
                display="inline-flex"
                px="3" py="1"
                rounded="full"
                bg={isDark ? "purple.900" : "purple.50"}
                borderWidth="1px"
                borderColor={isDark ? "purple.700" : "purple.200"}
              >
                <HStack gap="1.5">
                  <Smartphone size={12} color="var(--chakra-colors-purple-500)" />
                  <Text fontSize="xs" fontWeight="semibold" color="purple.500" letterSpacing="wide" textTransform="uppercase">
                    Mobile-first
                  </Text>
                </HStack>
              </Box>
              <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="1.2">
                Gestiona el teu negoci{" "}
                <Box as="span" bgGradient="to-r" gradientFrom="purple.500" gradientTo="blue.500" bgClip="text">
                  des de qualsevol lloc
                </Box>
              </Heading>
              <Text color="fg.muted" fontSize={{ base: "sm", md: "md" }} lineHeight="relaxed">
                La plataforma s'adapta automàticament a qualsevol pantalla. Des del mòbil pots consultar dades d'Odoo, parlar amb l'assistent IA, veure les estadístiques del servidor i gestionar la galeria, sense instal·lar cap aplicació.
              </Text>
              <VStack align="start" gap="3">
                {[
                  "Disseny responsive per a mòbil, tauleta i escriptori",
                  "Chat amb gràfiques interactives des del telèfon",
                  "Panell de sistema amb CPU i RAM en temps real",
                  "Navegació optimitzada amb menú lateral lliscant",
                ].map((item) => (
                  <HStack key={item} gap="3">
                    <Box
                      w="5" h="5" rounded="full" bg="purple.500" flexShrink={0}
                      display="flex" alignItems="center" justifyContent="center"
                    >
                      <Check size={11} color="white" />
                    </Box>
                    <Text fontSize="sm" color="fg.muted">{item}</Text>
                  </HStack>
                ))}
              </VStack>
              <Button colorPalette="purple" rounded="full" px="6" asChild>
                <Link to="/admin">Accedir ara</Link>
              </Button>
            </VStack>

          </Grid>
        </Container>
      </Box>

      <TechSection isDark={isDark} />

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <Box
        py={{ base: "16", md: "20" }}
        bgGradient="to-r"
        gradientFrom={isDark ? "purple.900" : "purple.500"}
        gradientTo={isDark ? "blue.900" : "blue.500"}
      >
        <Container maxW="3xl" textAlign="center">
          <VStack gap="6">
            <Heading
              fontSize={{ base: "2xl", md: "3xl" }}
              color="white"
              fontWeight="bold"
            >
              Preparat per gestionar el teu negoci?
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Accedeix al panell d'administració i descobreix totes les
              funcionalitats.
            </Text>
            <HStack gap="4" flexWrap="wrap" justify="center">
              <Button
                size="lg"
                bg="white"
                color="purple.600"
                rounded="full"
                px="8"
                _hover={{ bg: "gray.100" }}
                asChild
              >
                <Link to="/admin">Accedir ara</Link>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* ── Photo Gallery ───────────────────────────────────────────── */}
      <Box
        id="galeria"
        py={{ base: "16", md: "24" }}
        bg={isDark ? "gray.950" : "gray.50"}
      >
        <Container maxW="7xl">
          <VStack gap="4" textAlign="center" mb="12">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="purple.500"
              textTransform="uppercase"
              letterSpacing="widest"
            >
              Galeria
            </Text>
            <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              Col·lecció pública
            </Heading>
          </VStack>

          {loading ? (
            <Flex justify="center" py="20">
              <Spinner size="xl" color="purple.500" />
            </Flex>
          ) : error ? (
            <EmptyState.Root
              py="20"
              bg={isDark ? "gray.800" : "white"}
              rounded="xl"
              shadow="sm"
              borderWidth="1px"
            >
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <TriangleAlert size={32} />
                </EmptyState.Indicator>
                <EmptyState.Title>
                  No s'han pogut carregar les fotos
                </EmptyState.Title>
                <EmptyState.Description>
                  Comprova que el servidor estigui actiu i torna-ho a intentar.
                </EmptyState.Description>
                <Button
                  size="sm"
                  onClick={fetchPhotos}
                  mt="2"
                  colorPalette="purple"
                >
                  Reintentar
                </Button>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : photos.length === 0 ? (
            <EmptyState.Root
              py="20"
              bg={isDark ? "gray.800" : "white"}
              rounded="xl"
              shadow="sm"
              borderWidth="1px"
            >
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <ImageIcon size={32} />
                </EmptyState.Indicator>
                <EmptyState.Title>Col·lecció buida</EmptyState.Title>
                <EmptyState.Description>
                  Encara no hi ha fotos. Torna aviat.
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Grid
              templateColumns={{
                base: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)",
              }}
              gap="6"
            >
              {photos.map((photo) => (
                <Box
                  key={photo.id}
                  bg={isDark ? "gray.800" : "white"}
                  rounded="xl"
                  overflow="hidden"
                  shadow="md"
                  borderWidth="1px"
                  borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
                  transition="all 0.2s"
                  _hover={{ shadow: "xl", transform: "translateY(-4px)" }}
                >
                  <Box
                    position="relative"
                    pt="100%"
                    overflow="hidden"
                    bg={isDark ? "gray.700" : "gray.100"}
                  >
                    {photo.coverUrl ? (
                      <Image
                        src={photo.coverUrl}
                        alt={photo.title}
                        position="absolute"
                        top="0"
                        left="0"
                        w="full"
                        h="full"
                        objectFit="cover"
                        transition="transform 0.3s"
                        _groupHover={{ transform: "scale(1.05)" }}
                      />
                    ) : (
                      <Flex
                        position="absolute"
                        top="0"
                        left="0"
                        w="full"
                        h="full"
                        align="center"
                        justify="center"
                        color="fg.subtle"
                      >
                        <ImageIcon size={32} />
                      </Flex>
                    )}
                  </Box>
                  <Box p="5">
                    <Text fontWeight="semibold" truncate mb="1">
                      {photo.title}
                    </Text>
                    {photo.description && (
                      <Text color="fg.muted" fontSize="sm" lineClamp={2}>
                        {photo.description}
                      </Text>
                    )}
                  </Box>
                </Box>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <Box
        as="footer"
        py="8"
        borderTopWidth="1px"
        borderColor={isDark ? "whiteAlpha.100" : "blackAlpha.100"}
        bg={isDark ? "gray.900" : "white"}
      >
        <Container maxW="7xl">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap="4">
            <HStack gap="2">
              <Box
                w="6"
                h="6"
                rounded="md"
                bgGradient="to-br"
                gradientFrom="purple.500"
                gradientTo="blue.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Zap size={12} color="white" />
              </Box>
              <Text fontSize="sm" color="fg.muted">
                © {new Date().getFullYear()} Cel Ticó Petit
              </Text>
            </HStack>
            <HStack gap="4">
              <Button size="xs" variant="ghost" colorPalette="purple" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="xs" variant="ghost" colorPalette="purple" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicAlbums;
