import { Dialog } from "@chakra-ui/react";
import AlbumForm from "../../pages/AlbumForm";

interface PhotoFormDialogProps {
  open: boolean;
  editingId?: number;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PhotoFormDialog({
  open,
  editingId,
  onOpenChange,
  onSuccess,
}: PhotoFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={({ open }) => onOpenChange(open)} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{editingId ? "Edit Photo" : "Add New Photo"}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body pb="6">
            <AlbumForm
              albumId={editingId}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
