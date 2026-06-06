import { Button, Dialog } from "@chakra-ui/react";
import type { Photo } from "../../types/photo";

interface PhotoDeleteDialogProps {
  target: Photo | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PhotoDeleteDialog({ target, onCancel, onConfirm }: PhotoDeleteDialogProps) {
  return (
    <Dialog.Root
      open={!!target}
      onOpenChange={({ open }) => { if (!open) onCancel(); }}
      role="alertdialog"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete Photo</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            Are you sure you want to delete <strong>{target?.title}</strong>?
            This action cannot be undone.
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button colorPalette="red" onClick={onConfirm} ml="2">
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
