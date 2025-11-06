import { useState, startTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useNotesStore } from "@/stores/notes-store";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { updateNoteApi } from "@fullstack-starter/shared-api";
import { getFieldErrors } from '@fullstack-starter/shared-api';

interface RenameNoteFormData {
  title: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />} Rename
    </Button>
  );
}

export function RenameNoteDialog() {
  const router = useRouter();

  const editDialog = useNotesStore(state => state.editDialog);
  const closeEditDialog = useNotesStore(state => state.closeEditDialog);

  const [errors, setErrors] = useState<Partial<RenameNoteFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const titleEntry = formData.get('title');
      const title = typeof titleEntry === 'string' ? titleEntry.trim() : '';

      // Basic validation
      const newErrors: Partial<RenameNoteFormData> = {};
      if (!title) newErrors.title = "Title is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        if (!editDialog.note) {
          return;
        }

        await updateNoteApi(editDialog.note.id, { title });
        toast.success("Note renamed successfully!");
        await router.invalidate({ sync: true });
        closeEditDialog();
      } catch (err: unknown) {
        const fieldErrorsList = getFieldErrors(err);
        if (fieldErrorsList.length > 0) {
          const fieldErrors: Partial<RenameNoteFormData> = {};
          fieldErrorsList.forEach((error) => {
            if (error.field === 'title') {
              fieldErrors.title = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          const message = err instanceof Error ? err.message : "Failed to rename note. Please try again.";
          toast.error(message);
        }
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeEditDialog();
      setErrors({});
    }
  };

  return (
    <Dialog open={editDialog.note !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Note</DialogTitle>
          <DialogDescription>
            Enter a new title for your note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                name="title"
                placeholder="Enter note title"
                defaultValue={editDialog.note?.title || ""}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.title}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
