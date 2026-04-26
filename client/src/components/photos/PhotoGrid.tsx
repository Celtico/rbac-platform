import { Edit2, Trash2 } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Image,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import type { Photo, ViewMode } from "../../types/photo";

interface PhotoGridProps {
  photos: Photo[];
  viewMode: Extract<ViewMode, "grid" | "grid-small">;
  canWrite: boolean;
  onEdit: (id: number) => void;
  onDelete: (photo: Photo) => void;
}

type ChakraSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

export function PhotoGrid({
  photos,
  viewMode,
  canWrite,
  onEdit,
  onDelete,
}: PhotoGridProps) {
  const isSmall = viewMode === "grid-small";

  const titleSize: ChakraSize[] = isSmall
    ? ["md", "lg", "xl", "2xl", "3xl"]
    : ["sm", "md", "md", "md", "md"];

  const descSize: ChakraSize[] = isSmall
    ? ["xs", "sm", "md", "lg", "xl"]
    : ["xs", "xs", "xs", "sm", "md"];

  return (
    <SimpleGrid
      columns={[isSmall ? 1 : 2, 2, 3, isSmall ? 5 : 10]}
      id="albums-grid-small"
      gap="4"
    >
      {photos.map((photo) => (
        <Box
          key={photo.id}
          data-testid={`album-card-small-${photo.id}`}
          bg="bg.panel"
          p="2"
          rounded="md"
          shadow="sm"
          display="flex"
          flexDirection="column"
          borderWidth="1px"
        >
          <Box
            mb="2"
            position="relative"
            pt="100%"
            rounded="md"
            overflow="hidden"
          >
            {photo.coverUrl ? (
              <>
                <Box position="absolute" top="0" left="0" w="full" h="full" />
                <Image
                  src={photo.coverUrl}
                  alt={photo.title}
                  position="absolute"
                  top="0"
                  left="0"
                  w="full"
                  h="full"
                  objectFit="cover"
                  shadow="xs"
                />
              </>
            ) : (
              <Box
                position="absolute"
                top="0"
                left="0"
                w="full"
                h="full"
                bg="gray.200"
                rounded="md"
              />
            )}
          </Box>
          <Heading size={titleSize} truncate title={photo.title}>
            {photo.title}
          </Heading>
          <Text fontSize={descSize} color="fg.muted" truncate>
            {photo.description}
          </Text>
          <Flex justify="flex-end" mt="2" gap="1">
            {canWrite && (
              <>
                <IconButton
                  aria-label="Edit Photo"
                  onClick={() => onEdit(photo.id)}
                  variant="ghost"
                  colorPalette="blue"
                  size="xs"
                >
                  <Edit2 size={12} />
                </IconButton>
                <IconButton
                  aria-label="Delete Photo"
                  onClick={() => onDelete(photo)}
                  variant="ghost"
                  colorPalette="red"
                  size="xs"
                >
                  <Trash2 size={12} />
                </IconButton>
              </>
            )}
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
}
