import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  Field,
  Portal,
} from "@chakra-ui/react";

interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
}

const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<Partial<Album> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbums = async () => {
    try {
      const res = await api.get("/albums");
      setAlbums(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/albums/${id}`);
    fetchAlbums();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await api.post("/albums/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing({ ...editing, coverUrl: res.data.url });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing?.id) {
      await api.patch(`/albums/${editing.id}`, editing);
    } else {
      await api.post("/albums", editing);
    }
    setEditing(null);
    fetchAlbums();
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">Albums</Heading>
        {hasPermission("write:albums") && (
          <Button
            id="add-album-button"
            onClick={() =>
              setEditing({
                title: "",
                artist: "",
                year: new Date().getFullYear(),
                coverUrl: "",
              })
            }
            colorPalette="blue"
          >
            <Plus size={16} style={{ marginRight: "8px" }} /> Add Album
          </Button>
        )}
      </Flex>

      {editing && (
        <Portal>
          <Box
            position="fixed"
            top="0"
            left="0"
            w="full"
            h="full"
            bg="blackAlpha.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p="4"
            zIndex="1000"
          >
            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="bg.panel"
              p="6"
              rounded="md"
              shadow="lg"
              w="full"
              maxW="md"
            >
              <Heading size="md" mb="4">
                {editing.id ? "Edit" : "Add"} Album
              </Heading>
              <Stack gap="4">
                <Field.Root>
                  <Field.Label>Title</Field.Label>
                  <Input
                    id="album-title"
                    placeholder="Title"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    required
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Artist</Field.Label>
                  <Input
                    id="album-artist"
                    placeholder="Artist"
                    value={editing.artist}
                    onChange={(e) =>
                      setEditing({ ...editing, artist: e.target.value })
                    }
                    required
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Year</Field.Label>
                  <Input
                    id="album-year"
                    type="number"
                    placeholder="Year"
                    value={editing.year}
                    onChange={(e) =>
                      setEditing({ ...editing, year: +e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Cover URL</Field.Label>
                  <Input
                    id="album-cover"
                    placeholder="Cover URL"
                    value={editing.coverUrl}
                    onChange={(e) =>
                      setEditing({ ...editing, coverUrl: e.target.value })
                    }
                  />
                </Field.Root>
                <Flex align="center" gap="2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    accept="image/*"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="surface"
                    size="sm"
                  >
                    <Upload size={16} style={{ marginRight: "8px" }} />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  {editing.coverUrl && (
                    <Text fontSize="xs" color="green.500">
                      Image uploaded!
                    </Text>
                  )}
                </Flex>
              </Stack>
              <Flex justify="flex-end" mt="6" gap="2">
                <Button
                  id="cancel-album-button"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button
                  id="save-album-button"
                  type="submit"
                  colorPalette="blue"
                >
                  Save
                </Button>
              </Flex>
            </Box>
          </Box>
        </Portal>
      )}

      <Grid
        id="albums-grid"
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap="6"
      >
        {albums.map((album) => (
          <Box
            key={album.id}
            data-testid={`album-card-${album.id}`}
            bg="bg.panel"
            p="4"
            rounded="md"
            shadow="sm"
            display="flex"
            flexDirection="column"
            borderWidth="1px"
          >
            {album.coverUrl && (
              <Image
                src={album.coverUrl}
                alt={album.title}
                w="full"
                h="48"
                objectFit="cover"
                rounded="md"
                mb="4"
                shadow="sm"
              />
            )}
            <Heading size="md">{album.title}</Heading>
            <Text color="fg.muted">
              {album.artist} ({album.year})
            </Text>
            <Flex justify="flex-end" mt="4" gap="2">
              {hasPermission("write:albums") && (
                <>
                  <IconButton
                    id={`edit-album-${album.id}`}
                    aria-label="Edit Album"
                    onClick={() => setEditing(album)}
                    variant="ghost"
                    colorPalette="blue"
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton
                    id={`delete-album-${album.id}`}
                    aria-label="Delete Album"
                    onClick={() => handleDelete(album.id)}
                    variant="ghost"
                    colorPalette="red"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </>
              )}
            </Flex>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default Albums;
