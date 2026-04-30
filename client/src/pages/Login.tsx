import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.ts";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  VStack,
  IconButton,
  Separator,
  Text,
} from "@chakra-ui/react";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { username, password });
      login(response.data.access_token, response.data.user);
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box
      id="login-page"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="bg.muted"
    >
      <Container maxW="md">
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="bg.panel"
          p="8"
          rounded="md"
          shadow="md"
        >
          <VStack gap="6" align="stretch">
            <Heading size="xl" textAlign="center">
              Login
            </Heading>

            {error && (
              <Box
                id="login-error"
                p="3"
                bg="red.subtle"
                color="red.fg"
                rounded="sm"
                fontSize="sm"
              >
                {error}
              </Box>
            )}

            <VStack gap="4">
              <Field.Root>
                <Field.Label htmlFor="username">Username</Field.Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field.Root>

              <Field.Root>
                <Field.Label htmlFor="password">Password</Field.Label>
                <Box position="relative" w="full">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    pr="10"
                  />
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right="1"
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </IconButton>
                </Box>
              </Field.Root>
            </VStack>

            <Button
              id="login-button"
              type="submit"
              colorPalette="blue"
              size="lg"
              fontWeight="bold"
            >
              Sign In
            </Button>

            <Box position="relative" py="2">
              <Separator />
              <Text
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="bg.panel"
                px="3"
                fontSize="xs"
                color="fg.muted"
              >
                o
              </Text>
            </Box>

            <a href="/api/auth/google" style={{ textDecoration: "none", display: "block" }}>
              <Button variant="outline" size="lg" width="full">
                <Box as="span" mr="2" fontSize="lg">G</Box>
                Continua amb Google
              </Button>
            </a>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
