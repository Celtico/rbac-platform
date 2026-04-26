import React, { useEffect, useState } from "react";
import api from "../api";
import PublicHeader from "../components/PublicHeader";
import {
  Box,
  Button,
  EmptyState,
  Grid,
  Heading,
  Text,
  Flex,
  Spinner,
  Container,
  Image,
} from "@chakra-ui/react";
import { ImageIcon, TriangleAlert } from "lucide-react";

interface Photo {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
}

const PublicAlbums: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/photos");
      setPhotos(res.data.items);
    } catch (err) {
      console.error("Error fetching public photos:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="bg.muted">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="bg.muted" px={[0, 8]} py={[4, 8]} color="fg">
      <PublicHeader />
      <Container>
        {error ? (
          <EmptyState.Root py="20" bg="bg.panel" rounded="md" shadow="sm" borderWidth="1px">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <TriangleAlert size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>Could not load photos</EmptyState.Title>
              <EmptyState.Description>
                Check that the server is running and try again.
              </EmptyState.Description>
              <Button size="sm" onClick={fetchPhotos} mt="2">
                Retry
              </Button>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : photos.length === 0 ? (
          <EmptyState.Root py="20" bg="bg.panel" rounded="md" shadow="sm" borderWidth="1px">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <ImageIcon size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>No photos yet</EmptyState.Title>
              <EmptyState.Description>
                The collection is empty. Check back later.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Grid
            id="public-photos-grid"
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            }}
            gap="8"
          >
            {photos.map((photo) => (
              <Box
                key={photo.id}
                bg="bg.panel"
                rounded="md"
                overflow="hidden"
                shadow="md"
                transition="all 0.2s"
                _hover={{ transform: "scale(1.05)" }}
                borderWidth="1px"
              >
                <Box
                  position="relative"
                  pt="100%"
                  overflow="hidden"
                  bg="bg.subtle"
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
                      No Image
                    </Flex>
                  )}
                </Box>
                <Box p="6">
                  <Heading size="md" mb="1" truncate>
                    {photo.title}
                  </Heading>
                  {photo.description && (
                    <Text color="fg.muted" fontSize="sm">
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
  );
};

export default PublicAlbums;
