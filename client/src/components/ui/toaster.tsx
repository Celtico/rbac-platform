import {
  createToaster,
  Toaster as ChakraToaster,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastIndicator,
  ToastCloseTrigger,
  Stack,
} from "@chakra-ui/react";

export const toaster = createToaster({ placement: "bottom", gap: 12 });

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
      {(toast) => (
        <ToastRoot key={toast.id}>
          <ToastIndicator />
          <Stack gap="1" flex="1" maxWidth="100%" direction="column">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </Stack>
          <ToastCloseTrigger />
        </ToastRoot>
      )}
    </ChakraToaster>
  );
}
