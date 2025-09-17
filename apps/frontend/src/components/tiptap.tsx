// src/components/tiptap.tsx
import { EditorContent, useEditorState, Editor } from '@tiptap/react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

function MenuBar({ editor }: { editor: Editor; }) {
  // Read the current editor's state, and re-render the component when it changes
  const editorState = useEditorState({
    editor,
    selector: ctx => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
      };
    },
  });

  return (
    <div className="flex items-center space-x-1 mb-2 border-b border-b-input px-2 py-1 h-10">
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        className={cn("font-bold px-3", editorState.isBold ? 'is-active' : '')}
      >
        B
      </Button>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        className={cn("italic px-3", editorState.isItalic ? 'is-active' : '')}
      >
        i
      </Button>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        className={cn("line-through px-3", editorState.isStrike ? 'is-active' : '')}
      >
        S
      </Button>
    </div>
  );
}

const Tiptap = ({ editor }: { editor: Editor; }) => {
  // Use the passed editor instance
  return (
    <div className='border border-input dark:bg-input/30 bg-transparent rounded-md min-h-[300px] h-full'>
      <MenuBar editor={editor} />
      <div
        className='px-4 pb-3 pt-2 h-full max-h-[calc(100%-3.5rem)] overflow-y-auto'
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Tiptap;