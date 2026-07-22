"use client";

import { useState, useCallback } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy el asistente de Reboot IT 🌱 ¿En qué puedo ayudarte hoy? Puedo guiarte sobre cómo donar materiales tecnológicos, sacar un turno o registrarte como donante.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const history = [...messages, userMessage]
        .filter((m) => m.id !== "welcome" || m.role !== "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/apiChatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error desconocido");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError("No se pudo enviar el mensaje. Intentá de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "¡Hola! Soy el asistente de RebootIt 🌱 ¿En qué puedo ayudarte hoy? Puedo guiarte sobre cómo donar materiales tecnológicos, sacar un turno o registrarte como donante.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}