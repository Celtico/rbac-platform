import { Edit2, Trash2 } from "lucide-react";
import {
  Box,
  EmptyState,
  HStack,
  IconButton,
  Image,
  Table,
} from "@chakra-ui/react";
import type { Photo } from "../../types/photo";

interface PhotoTableProps {
  photos: Photo[];
  canWrite: boolean;
  onEdit: (id: number) => void;
  onDelete: (photo: Photo) => void;
}

export function PhotoTable({ photos, canWrite, onEdit, onDelete }: PhotoTableProps) {
  return (
    <Box
      id="albums-table-container"
      overflowX="auto"
      bg="bg.panel"
      rounded="md"
      shadow="sm"
      borderWidth="1px"
    >
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Photo</Table.ColumnHeader>
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {photos.map((photo) => (
            <Table.Row key={photo.id} data-testid={`album-row-${photo.id}`}>
              <Table.Cell>
                {photo.coverUrl ? (
                  <Image
                    src={photo.coverUrl}
                    alt={photo.title}
                    boxSize="40px"
                    objectFit="cover"
                    rounded="sm"
                  />
                ) : (
                  <Box boxSize="40px" bg="gray.200" rounded="sm" />
                )}
              </Table.Cell>
              <Table.Cell fontWeight="medium">{photo.title}</Table.Cell>
              <Table.Cell>{photo.description}</Table.Cell>
              <Table.Cell textAlign="right">
                <HStack gap="2" justify="flex-end">
                  {canWrite && (
                    <>
                      <IconButton
                        id={`edit-album-${photo.id}`}
                        aria-label="Edit Photo"
                        onClick={() => onEdit(photo.id)}
                        variant="ghost"
                        colorPalette="blue"
                        size="sm"
                      >
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton
                        id={`delete-album-${photo.id}`}
                        aria-label="Delete Photo"
                        onClick={() => onDelete(photo)}
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </>
                  )}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {photos.length === 0 && (
        <EmptyState.Root py="12">
          <EmptyState.Content>
            <EmptyState.Title>No photos found</EmptyState.Title>
            <EmptyState.Description>
              Try a different search or add a new photo.
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
    </Box>
  );
}
