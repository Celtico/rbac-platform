import { Plus, List, Grid2X2, LayoutGrid } from "lucide-react";
import { Box, Button, Flex, Group, Heading, HStack, Input } from "@chakra-ui/react";
import type { ViewMode } from "../../types/photo";

interface PhotoToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canWrite: boolean;
  onAddClick: () => void;
}

export function PhotoToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  canWrite,
  onAddClick,
}: PhotoToolbarProps) {
  return (
    <Flex justify="space-between" align="center" mb="4" wrap="wrap" gap="3">
      <Heading size="lg">Photos</Heading>
      <HStack gap={[2, 10, 10, 10]}>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          maxW={{ base: "140px", sm: "200px", md: "260px" }}
          size="sm"
        />
        <Group attached>
          <Button
            id="table-view-button"
            aria-label="Table View"
            onClick={(e) => { e.preventDefault(); onViewModeChange("table"); }}
            variant={viewMode === "table" ? "solid" : "ghost"}
            colorPalette="blue"
            size="sm"
          >
            <List size={16} />
          </Button>
          <Button
            id="grid-small-view-button"
            aria-label="Small Grid View"
            onClick={(e) => { e.preventDefault(); onViewModeChange("grid-small"); }}
            variant={viewMode === "grid-small" ? "solid" : "ghost"}
            colorPalette="blue"
            size="sm"
          >
            <Grid2X2 size={16} />
          </Button>
          <Button
            id="grid-view-button"
            aria-label="Grid View"
            onClick={(e) => { e.preventDefault(); onViewModeChange("grid"); }}
            variant={viewMode === "grid" ? "solid" : "ghost"}
            colorPalette="blue"
            size="sm"
          >
            <LayoutGrid size={16} />
          </Button>
        </Group>
        {canWrite && (
          <Button
            id="add-album-button"
            onClick={onAddClick}
            colorPalette="blue"
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Add Photo
            </Box>
          </Button>
        )}
      </HStack>
    </Flex>
  );
}
