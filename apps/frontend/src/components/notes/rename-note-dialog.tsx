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
  const noteToRename = useNotesStore((state) => state.noteToRename);
  const setNoteToRename = useNotesStore((state) => state.setNoteToRename);
  const [errors, setErrors] = useState<Partial<RenameNoteFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const title = formData.get('title') as string;

      // Basic validation
      const newErrors: Partial<RenameNoteFormData> = {};
      if (!title) newErrors.title = "Title is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        await updateNoteApi(noteToRename!.id, { title });
        toast.success("Note renamed successfully!");
        await router.invalidate({ sync: true });
        setNoteToRename(null);
      } catch (err: any) {
        if (err.details?.errors) {
          const fieldErrors: Partial<RenameNoteFormData> = {};
          err.details.errors.forEach((error: { field: string; message: string; }) => {
            if (error.field === 'title') {
              fieldErrors.title = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          toast.error(err.message || "Failed to rename note. Please try again.");
        }
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNoteToRename(null);
      setErrors({});
    }
  };

  return (
    <Dialog open={noteToRename !== null} onOpenChange={handleOpenChange}>
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
                defaultValue={noteToRename?.title || ""}
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
