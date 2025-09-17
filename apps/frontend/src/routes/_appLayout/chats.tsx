import { ChatsPage } from '@/pages/chats-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_appLayout/chats')({
  component: ChatsPage,
});
