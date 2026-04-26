import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import unsplash from "../lib/unsplash";
import type { Basic as UnsplashPhoto } from "unsplash-js/dist/methods/photos/types";
import {
  Box,
  Button,
  Field,
  Input,
  Stack,
  Image,
  Flex,
  Text,
  Textarea,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { Save, Upload, Search, X, Sparkles } from "lucide-react";

interface PhotoFormData {
  title: string;
  description: string;
  coverUrl: string;
}

interface AlbumFormProps {
  albumId?: number;
  onSuccess: () => void;
  onClose: () => void;
}

const AlbumForm: React.FC<AlbumFormProps> = ({
  albumId,
  onSuccess,
  onClose,
}) => {
  const isEditing = Boolean(albumId);
  const [formData, setFormData] = useState<PhotoFormData>({
    title: "",
    description: "",
    coverUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Unsplash picker state
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && albumId) {
      const fetchAlbum = async () => {
        try {
          const res = await api.get(`/photos/${albumId}`);
          setFormData({
            title: res.data.title,
            description: res.data.description || "",
            coverUrl: res.data.coverUrl || "",
          });
        } catch (err) {
          console.error("Error fetching album:", err);
        }
      };
      fetchAlbum();
    }
  }, [albumId, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/photos/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, coverUrl: res.data.url }));
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleAiRecommend = async () => {
    if (!aiContext.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/recommend-album", { context: aiContext });
      const { title, description, imageQuery } = res.data;
      setFormData((prev) => ({ ...prev, title, description }));
      // Auto-search Unsplash with the suggested query
      setUnsplashQuery(imageQuery);
      setShowUnsplash(true);
      setUnsplashResults([]);
      searchUnsplash(imageQuery);
    } catch (err) {
      console.error("AI recommendation error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await api.patch(`/photos/${albumId}`, formData);
      } else {
        await api.post("/photos", formData);
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving album:", err);
    } finally {
      setLoading(false);
    }
  };

  const openUnsplash = () => {
    const q = [formData.title, formData.description].filter(Boolean).join(" ");
    setUnsplashQuery(q);
    setShowUnsplash(true);
    setUnsplashResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 50);
    if (q) searchUnsplash(q);
  };

  const searchUnsplash = async (q: string) => {
    if (!q.trim()) return;
    setUnsplashLoading(true);
    try {
      const result = await unsplash.search.getPhotos({
        query: q,
        perPage: 12,
        orientation: "squarish",
      });
      if (result.type === "success") {
        setUnsplashResults(result.response.results);
      }
    } catch (err) {
      console.error("Unsplash search error:", err);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const selectUnsplashPhoto = async (photo: UnsplashPhoto) => {
    setFormData((prev) => ({ ...prev, coverUrl: photo.urls.regular }));
    setShowUnsplash(false);
    // Required by Unsplash API guidelines: trigger a download on selection
    try {
      await unsplash.photos.trackDownload({
        downloadLocation: photo.links.download_location,
      });
    } catch {
      // non-blocking
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="6">
        <Field.Root>
          <Field.Label>Describe the photo (AI suggestion)</Field.Label>
          <Textarea
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            placeholder="e.g. A misty mountain landscape at sunrise..."
            rows={2}
            resize="none"
            w="full"
          />
          <Button
            onClick={handleAiRecommend}
            loading={aiLoading}
            disabled={!aiContext.trim()}
            colorPalette="purple"
            variant="outline"
            size="sm"
            type="button"
            flexShrink={0}
            mb="1px"
          >
            <Sparkles size={15} />
            Suggest
          </Button>
        </Field.Root>

        <Field.Root>
          <Field.Label>Title</Field.Label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Photo title"
            required
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Photo description"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Photo</Field.Label>
          <Stack gap="3">
            <Flex gap="2" align="center" wrap="wrap">
              <Input
                name="coverUrl"
                value={formData.coverUrl}
                onChange={handleChange}
                placeholder="Image URL"
                flex="1"
                minW="0"
              />
              <Text color="fg.muted" fontSize="sm" flexShrink={0}>
                or
              </Text>
              <Box position="relative" flexShrink={0}>
                <label
                  htmlFor="file-upload"
                  style={{ cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  <Button
                    as="span"
                    variant="outline"
                    size="sm"
                    loading={uploading}
                    pointerEvents="none"
                  >
                    <Upload size={16} />
                    Upload
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </Box>
              <Button
                variant="outline"
                size="sm"
                onClick={openUnsplash}
                type="button"
                flexShrink={0}
              >
                <Search size={16} />
                Unsplash
              </Button>
            </Flex>

            {/* Unsplash picker */}
            {showUnsplash && (
              <Box
                borderWidth="1px"
                borderColor="border.subtle"
                rounded="md"
                p="3"
                bg="bg.panel"
              >
                <Flex gap="2" mb="3" align="center">
                  <Input
                    ref={searchInputRef}
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    placeholder="Search Unsplash…"
                    size="sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchUnsplash(unsplashQuery);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => searchUnsplash(unsplashQuery)}
                    type="button"
                    colorPalette="blue"
                  >
                    <Search size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowUnsplash(false)}
                    type="button"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </Button>
                </Flex>

                {unsplashLoading ? (
                  <Flex justify="center" py="6">
                    <Spinner size="md" color="blue.500" />
                  </Flex>
                ) : unsplashResults.length > 0 ? (
                  <>
                    <SimpleGrid columns={3} gap="2">
                      {unsplashResults.map((photo) => (
                        <Box
                          key={photo.id}
                          position="relative"
                          pt="100%"
                          overflow="hidden"
                          rounded="sm"
                          cursor="pointer"
                          onClick={() => selectUnsplashPhoto(photo)}
                          _hover={{
                            opacity: 0.8,
                            ring: "2px",
                            ringColor: "blue.400",
                          }}
                          transition="all 0.15s"
                        >
                          <Image
                            src={photo.urls.thumb}
                            alt={photo.alt_description ?? ""}
                            position="absolute"
                            top="0"
                            left="0"
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                    <Text
                      fontSize="2xs"
                      color="fg.muted"
                      mt="2"
                      textAlign="right"
                    >
                      Photos by{" "}
                      <a
                        href="https://unsplash.com/?utm_source=rbac_album_app&utm_medium=referral"
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "underline" }}
                      >
                        Unsplash
                      </a>
                    </Text>
                  </>
                ) : (
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    textAlign="center"
                    py="4"
                  >
                    Search for an image above
                  </Text>
                )}
              </Box>
            )}

            {formData.coverUrl && (
              <Box
                boxSize="160px"
                rounded="md"
                overflow="hidden"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Image
                  src={formData.coverUrl}
                  alt="Preview"
                  objectFit="cover"
                  w="full"
                  h="full"
                />
              </Box>
            )}
          </Stack>
        </Field.Root>

        <Flex gap="3" justify="flex-end" mt="2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" colorPalette="blue" loading={loading}>
            <Save size={18} />
            {isEditing ? "Update Photo" : "Add Photo"}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
};

export default AlbumForm;
