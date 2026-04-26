import React from "react";
import { Link } from "react-router-dom";
import {
  Flex,
  Button,
  IconButton,
  Container,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { Moon, Sun, Menu as IconMenu } from "lucide-react";
import { useTheme } from "../context/ThemeContext.ts";

const PublicHeader: React.FC = () => {
  const { mode, toggleMode } = useTheme();

  return (
    <Container mb="12">
      <Flex justify="space-between" align="center">
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="subtle" size="sm">
              <IconMenu size={20} /> Menu
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="index" asChild>
                  <Link to="/">Photos</Link>
                </Menu.Item>
                <Menu.Item
                  color="fg.error"
                  _hover={{ bg: "bg.error", color: "fg.error" }}
                  value="admin"
                  asChild
                >
                  <Link to="/admin">Admin</Link>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <Flex gap="4" align="center">
          <IconButton
            aria-label="Toggle Theme"
            variant="ghost"
            onClick={toggleMode}
            rounded="full"
          >
            {mode === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </IconButton>
        </Flex>
      </Flex>
    </Container>
  );
};

export default PublicHeader;
