import React from "react";
import { Link } from "react-router-dom";
import { Box, HStack, Text } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.ts";
import type { NavItemDef } from "../../context/NavConfigContext.ts";

const NavCard: React.FC<{ item: NavItemDef }> = ({ item }) => {
  const Icon: LucideIcon = item.icon;
  const { mode } = useTheme();
  return (
    <Link to={item.path} style={{ textDecoration: "none" }}>
      <Box
        bg={mode === "light" ? "white" : "gray.800"}
        rounded="xl"
        shadow="sm"
        p={[4, 5]}
        overflow="hidden"
        position="relative"
        transition="all 0.2s"
        _hover={{ shadow: "lg", transform: "translateY(-3px)", cursor: "pointer" }}
        role="group"
      >
        <Box
          position="absolute"
          top="0" left="0" right="0"
          h="3px"
          style={{ background: `var(--card-accent, #863bff)` }}
          css={{ "--card-accent": item.color.includes(".") ? undefined : item.color }}
        />
        <HStack justify="space-between" align="flex-start">
          <Box
            p="2.5"
            rounded="lg"
            bg={`${item.color.split(".")[0]}.50`}
            color={item.color}
            _dark={{ bg: `${item.color.split(".")[0]}.900`, opacity: 0.9 }}
          >
            <Icon size={22} />
          </Box>
          <Box
            color="fg.subtle"
            opacity={0}
            transform="translateX(-4px)"
            transition="all 0.2s"
            _groupHover={{ opacity: 1, transform: "translateX(0)" }}
          >
            <ArrowRight size={16} />
          </Box>
        </HStack>
        <Text mt="3" fontWeight="semibold" fontSize="sm" color={mode === "light" ? "gray.800" : "gray.100"}>
          {item.label}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt="0.5">
          {item.path.replace("/admin/", "").replace("/", " › ")}
        </Text>
      </Box>
    </Link>
  );
};

export default NavCard;
