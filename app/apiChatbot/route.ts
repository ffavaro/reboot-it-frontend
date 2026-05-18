import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sos el asistente virtual de RebootIt, una plataforma de reciclado de materiales tecnológicos de MSIT S.A.S. en Córdoba, Argentina.

Tu rol es ayudar y guiar a los clientes con sus dudas sobre:
- Cómo donar materiales tecnológicos (computadoras, celulares, tablets, cables, periféricos, etc.)
- Cómo registrarse como donante en el sistema
- Cómo sacar un turno para entregar materiales
- Qué materiales se aceptan y cuáles no
- El proceso de reciclado y su impacto ambiental
- Información sobre la empresa y sus valores

Reglas de comportamiento:
- Respondé siempre en español, de forma amigable, clara y concisa.
- Si no sabés algo específico de la empresa, decí que vas a derivar la consulta al equipo.
- No inventes información. Si no tenés certeza, reconocelo.
- Mantené las respuestas cortas (máximo 3-4 oraciones) salvo que se necesite más detalle.
- Usá un tono cálido y cercano, acorde a una empresa comprometida con el medio ambiente.
- Si te preguntan algo que no tiene que ver con RebootIt o reciclado tecnológico, redirigí amablemente la conversación.

Información base sobre RebootIt:
- Aceptamos: computadoras, laptops, celulares, tablets, monitores, teclados, mouses, cables, cargadores, impresoras, routers.
- No aceptamos: electrodomésticos de línea blanca, televisores CRT muy antiguos sin consultar, baterías de auto.
- El proceso es: el donante se registra, saca un turno y trae los materiales al punto de entrega.
- Dirección: Haedo 858, Córdoba, Argentina.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Formato de mensajes inválido." }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ChatBotprueba ?? "",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic API error:", error);
      return NextResponse.json({ error: "Error al contactar el servicio de IA." }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content
      ?.filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("") ?? "";

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}