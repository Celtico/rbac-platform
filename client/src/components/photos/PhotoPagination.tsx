import {
  Button,
  Flex,
  HStack,
  NativeSelect,
  Spacer,
  Text,
} from "@chakra-ui/react";

interface PhotoPaginationProps {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PhotoPagination({
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PhotoPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 5) return true;
      return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
    })
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (
        idx > 0 &&
        typeof arr[idx - 1] === "number" &&
        (p as number) - (arr[idx - 1] as number) > 1
      ) {
        acc.push("…");
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      w="full"
      align={{ base: "stretch", sm: "center" }}
      gap="5"
      pt="4"
    >
      <HStack gap={{ base: "3", md: "4" }} flexWrap="wrap">
        <Text fontSize="sm" color="fg.muted">
          Total: {totalItems} photos
        </Text>
        <Spacer />
        <HStack gap="2">
          <Text fontSize="sm">Items/page:</Text>
          <NativeSelect.Root size="sm" width="80px">
            <NativeSelect.Field
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </HStack>
      </HStack>

      <HStack gap="1" justify={{ base: "center", sm: "flex-end" }}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          px={{ base: "2", md: "3" }}
        >
          ‹
        </Button>
        <HStack gap="1">
          {pages.map((p, idx) =>
            p === "…" ? (
              <Text
                key={`ellipsis-${idx}`}
                fontSize="sm"
                px="1"
                color="fg.muted"
              >
                …
              </Text>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === currentPage ? "solid" : "ghost"}
                colorPalette={p === currentPage ? "blue" : "gray"}
                onClick={() => onPageChange(p as number)}
                minW="8"
              >
                {p}
              </Button>
            )
          )}
        </HStack>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          px={{ base: "2", md: "3" }}
        >
          ›
        </Button>
      </HStack>
    </Flex>
  );
}
