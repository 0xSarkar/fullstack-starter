import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: {
    id: string;
    title: string | null;
    content: string | null;
  };
  onRename: (note: any) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onRename, onDelete }: NoteCardProps) {
  const cleanText = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  const previewText = note.content ? cleanText(note.content).slice(0, 100) + '...' : 'No content';

  return (
    <Link to="/notes/$noteId" params={{ noteId: note.id }} className="block">
      <Card className='py-3 rounded-md gap-0'>
        <CardHeader className='px-3 pb-0'>
          <CardTitle className='truncate leading-snug'>{note.title || 'Untitled Note'}</CardTitle>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className='-mt-1'>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='right' align='start'>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(note); }}>
                  <Edit className="text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className='px-3 h-16'>
          <p className={cn(!note.content && "text-muted-foreground", "text-sm whitespace-pre-wrap line-clamp-3")}>
            {previewText}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
