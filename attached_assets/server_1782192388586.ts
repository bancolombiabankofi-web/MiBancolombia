import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialize GoogleGenAI to avoid crashing if GEMINI_API_KEY is not defined at startup
let aiClient: any = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clave de API GEMINI_API_KEY no está configurada. Por favor, añádela en Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support base64 images uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // End point to provide full clean source code of App.tsx and PhoneContainer.tsx for external projects
  app.get("/api/get-source-code", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const appCode = await fs.readFile(path.join(process.cwd(), "src", "App.tsx"), "utf-8");
      const phoneContainerCode = await fs.readFile(path.join(process.cwd(), "src", "components", "PhoneContainer.tsx"), "utf-8");
      const indexCssCode = await fs.readFile(path.join(process.cwd(), "src", "index.css"), "utf-8");
      const typesCode = await fs.readFile(path.join(process.cwd(), "src", "types.ts"), "utf-8");
      res.json({ appCode, phoneContainerCode, indexCssCode, typesCode });
    } catch (error: any) {
      console.error("Error en /api/get-source-code:", error);
      res.status(500).json({ error: "No se pudo leer el código fuente del proyecto." });
    }
  });

  // Multi-turn chatbot proxy route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "El mensaje es obligatorio." });
      }

      const ai = getGeminiClient();

      // System instruction defines the specific banking role for the chatbot
      const systemInstruction = 
        "Eres el Asistente Financiero Inteligente de Bancolombia (puedes llamarte Tabby o simplemente tu Asistente Virtual). " +
        "Tu objetivo es ayudar al usuario a entender sus finanzas, aconsejarle sobre presupuestos, guiarle sobre " +
        "el uso del portal móvil, la Clave Dinámica, explicarle transacciones o sugerir transferencias de forma amigable. " +
        "Siempre respondes en un español neutro con toques amables de Colombia (por ejemplo, hablar de pesos colombianos COP, " +
        "mencionar de forma casual palabras amables comunes en el ámbito de atención respetuosa como 'estimado/a', 'con gusto', 'claro que sí'). " +
        "Mantén tus respuestas bien formateadas con viñetas elegantes o negritas cuando sea útil, y sé conciso para " +
        "que sea cómodo leerlo en pantallas móviles.";

      // format conversation history to match the type expected by the @google/genai SDK
      // history items format: { role: 'user' | 'model', parts: [{ text: '...' }] }
      const formattedHistory = (history || []).map((msg: any) => {
        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        };
      });

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const response = await chat.sendMessage({ message: message });
      const text = response.text || "";

      res.json({ text, role: "assistant" });
    } catch (error: any) {
      console.error("Error en /api/chat:", error);
      res.status(500).json({ 
        error: error.message || "Error al comunicarse con el asistente de inteligencia artificial." 
      });
    }
  });

  // Image analysis proxy route
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "La imagen base64 y el tipo MIME son obligatorios." });
      }

      const ai = getGeminiClient();

      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      };

      const promptPart = {
        text: "Analiza detalladamente esta imagen de factura, recibo público, código QR o comprobante de pago subido al Portal Bancolombia. " +
              "Actúa como un lector automático de documentos financieros inteligente. " +
              "Por favor realiza lo siguiente: \n" +
              "1. Determina el TIPO de documento (ej. Factura de Servicio Público, Ticket de Compra, Recibo de Matrícula, Código QR de Transferencia, Tarjeta o Comprobante de Pago).\n" +
              "2. Extrae de forma explícita estos campos: Empresa/Emisor, Monto de Dinero (en Pesos Colombianos COP si aplica), Fecha, y Número de Referencia o Factura.\n" +
              "3. Devuelve los resultados estructurados en un formato JSON amigable al inicio, rodeado por delimitadores ```json ... ```, " +
              "que contenga los campos: { \"tipo\": \"...\", \"emisor\": \"...\", \"monto\": 0, \"referencia\": \"...\", \"fecha\": \"...\" }\n" +
              "4. Después del JSON, escribe un resumen amigable en español conversacional de máximo 3 oraciones " +
              "explicando los detalles principales encontrados, y preguntando activamente al usuario si le gustaría proceder a depositar, pagar o transferir " +
              "esa cantidad usando los simuladores correspondientes."
      };

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [imagePart, promptPart],
        config: {
          temperature: 0.2
        }
      });

      const text = result.text || "";
      res.json({ text });
    } catch (error: any) {
      console.error("Error en /api/analyze-image:", error);
      res.status(500).json({ 
        error: error.message || "Error al analizar la imagen con Gemini. Asegúrate de configurar la clave en Secrets." 
      });
    }
  });

  // Vite development middleware or static production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bancolombia Express server running on port ${PORT}`);
  });
}

startServer();
