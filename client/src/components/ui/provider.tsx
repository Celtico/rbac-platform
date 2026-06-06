"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import React from "react";

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {props.children}
      </ColorModeProvider>
    </ChakraProvider>
  );
}
