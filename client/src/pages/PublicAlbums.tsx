import React, { useEffect, useState } from "react";
import api from "../api";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  IconButton,
  Image,
  Spinner,
  Container,
  Badge,
} from "@chakra-ui/react";

interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
}

const PublicAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode, toggleMode } = useTheme();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get("/albums");
        setAlbums(res.data);
      } catch (err) {
        console.error("Error fetching public albums:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="bg.muted">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="bg.muted" p="8" color="fg">
      <Container maxW="6xl">
        <Flex justify="space-between" align="center" mb="12">
          <Heading size="3xl" fontWeight="extrabold">
            Music
          </Heading>
          <Flex gap="4" align="center">
            <IconButton
              aria-label="Toggle Theme"
              variant="ghost"
              onClick={toggleMode}
              rounded="full"
            >
              {mode === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </IconButton>
            <Link to="/admin" style={{ textDecoration: "none" }}>
              <Button colorPalette="blue" shadow="sm">
                <LayoutDashboard size={16} style={{ marginRight: "8px" }} />{" "}
                Admin Area
              </Button>
            </Link>
          </Flex>
        </Flex>

        {albums.length === 0 ? (
          <Box
            textAlign="center"
            py="20"
            bg="bg.panel"
            rounded="md"
            shadow="sm"
            borderWidth="1px"
          >
            <Text fontSize="xl" color="fg.muted">
              No albums found in the collection.
            </Text>
            <Text mt="2" color="fg.subtle">
              Check if the backend is running and contains data.
            </Text>
          </Box>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            }}
            gap="8"
          >
            {albums.map((album) => (
              <Box
                key={album.id}
                bg="bg.panel"
                rounded="md"
                overflow="hidden"
                shadow="md"
                transition="all 0.2s"
                _hover={{ transform: "scale(1.05)" }}
                borderWidth="1px"
              >
                <Box h="64" overflow="hidden" bg="bg.subtle">
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt={album.title}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  ) : (
                    <Flex
                      w="full"
                      h="full"
                      align="center"
                      justify="center"
                      color="fg.subtle"
                    >
                      No Cover
                    </Flex>
                  )}
                </Box>
                <Box p="6">
                  <Heading size="md" mb="1" truncate>
                    {album.title}
                  </Heading>
                  <Text color="fg.muted" fontWeight="medium">
                    {album.artist}
                  </Text>
                  <Flex mt="4" justify="space-between" align="center">
                    <Badge
                      colorPalette="blue"
                      variant="subtle"
                      fontWeight="bold"
                    >
                      {album.year}
                    </Badge>
                  </Flex>
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default PublicAlbums;
