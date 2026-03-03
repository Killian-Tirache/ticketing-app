import { useEffect, useRef, useState } from "react";
import { messageService } from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Message } from "@/types/message.types";
import { cn } from "@/lib/utils";

interface TicketChatProps {
  ticketId: string;
}

const PAGE_SIZE = 30;

export function TicketChat({ ticketId }: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [content, setContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadMessages(1, true);

    const socket = socketService.getSocket();
    socket?.emit("ticket:join", ticketId);

    return () => {
      socket?.emit("ticket:leave", ticketId);
    };
  }, [ticketId]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    };

    socketService.on<Message>("message:created", handleNewMessage);
    return () => socketService.off("message:created", handleNewMessage);
  }, []);

  const loadMessages = async (targetPage: number, initial = false) => {
    try {
      initial ? setIsLoading(true) : setIsLoadingMore(true);
      const response = await messageService.getAll(
        ticketId,
        targetPage,
        PAGE_SIZE,
      );
      setMessages((prev) =>
        targetPage === 1 ? response.data : [...response.data, ...prev],
      );
      setTotalPages(response.totalPages);
      setPage(targetPage);
      if (initial) setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      initial ? setIsLoading(false) : setIsLoadingMore(false);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      setContent("");
      const message = await messageService.create(ticketId, trimmed);
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error("Error sending message:", error);
      setContent(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    support: "Support",
    user: "Utilisateur",
  };

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-500",
    support: "bg-blue-500",
    user: "bg-gray-500",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-3 h-100 overflow-y-auto pr-2"
      >
        {page < totalPages && (
          <div className="flex justify-center sticky top-0 z-10 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMessages(page + 1)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronUp className="mr-2 h-4 w-4" />
              )}
              Charger les messages précédents
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun message pour l'instant. Démarrez la conversation !
          </p>
        ) : (
          messages.map((message) => {
            const isMe = message.author._id === user?._id;
            return (
              <div
                key={message._id}
                className={cn(
                  "flex flex-col gap-1 max-w-[75%] min-w-0",
                  isMe ? "self-end items-end" : "self-start items-start",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {isMe
                      ? "Vous"
                      : `${message.author.firstName} ${message.author.lastName}`}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs px-1.5 py-0 h-4",
                      roleBadgeColor[message.author.role],
                    )}
                  >
                    {roleLabels[message.author.role]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), "dd MMM à HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm whitespace-pre-wrap break-all",
                    isMe ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 items-end pt-2 border-t">
        <Textarea
          placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-15 max-h-40 resize-none"
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !content.trim()}
          size="icon"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
