import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import api from "../api";
import { useAuth } from "../context/AuthContext.ts";
import { toaster } from "../components/ui/toaster";
import { PhotoToolbar } from "../components/photos/PhotoToolbar";
import { PhotoTable } from "../components/photos/PhotoTable";
import { PhotoGrid } from "../components/photos/PhotoGrid";
import { PhotoPagination } from "../components/photos/PhotoPagination";
import { PhotoFormDialog } from "../components/photos/PhotoFormDialog";
import { PhotoDeleteDialog } from "../components/photos/PhotoDeleteDialog";
import type { Photo, ViewMode } from "../types/photo";

const Albums = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("write:photos");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([5, 10, 20, 50, 100]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("albumsViewMode") as ViewMode) || "grid"
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);

  const fetchPhotos = async () => {
    try {
      const res = await api.get("/photos", {
        params: { page: currentPage, limit: pageSize, search: search || undefined },
      });
      setPhotos(res.data.items);
      setTotalPages(res.data.meta.totalPages);
      setTotalItems(res.data.meta.totalItems);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.get("/photos/page-sizes")
      .then((res) => setPageSizeOptions(res.data.pageSizes))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchPhotos(); }, [currentPage, pageSize, search]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("albumsViewMode", mode);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const openCreate = () => { setEditingId(undefined); setModalOpen(true); };
  const openEdit = (id: number) => { setEditingId(id); setModalOpen(true); };

  const handleFormSuccess = () => {
    setModalOpen(false);
    fetchPhotos();
    toaster.create({ type: "success", title: editingId ? "Photo updated" : "Photo created" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/photos/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.title}" deleted` });
      fetchPhotos();
    } catch {
      toaster.create({ type: "error", title: "Failed to delete photo" });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Box>
        <PhotoToolbar
          search={search}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          canWrite={canWrite}
          onAddClick={openCreate}
        />

        <Box mb="4">
          {viewMode === "table" ? (
            <PhotoTable
              photos={photos}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ) : (
            <PhotoGrid
              photos={photos}
              viewMode={viewMode}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </Box>

        <PhotoPagination
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </Box>

      <PhotoFormDialog
        open={modalOpen}
        editingId={editingId}
        onOpenChange={setModalOpen}
        onSuccess={handleFormSuccess}
      />

      <PhotoDeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Albums;
