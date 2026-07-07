import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '5mb' }));

  app.post('/api/enrich', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          termo_nucleo: { type: Type.STRING, description: "O termo principal ou assunto central do dispositivo." },
          nome_crime: { type: Type.STRING, description: "O nome do crime, se aplicável ao dispositivo. Deixe vazio caso não seja matéria penal." },
          principio: { type: Type.STRING, description: "Princípio jurídico aplicável, se houver." },
          novidade_legislativa: { type: Type.BOOLEAN, description: "Verdadeiro se houver indicação de que o dispositivo é novidade (de 2024 em diante)." },
          verbos_nucleares: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Verbos que compõem o núcleo do tipo ou ação central do artigo." },
          palavras_chave: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Palavras-chave importantes para o entendimento do dispositivo." },
          alertas_fgv: { type: Type.STRING, description: "Avisos curtos, dicas doutrinárias ou teses defensivas importantes." }
        }
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analise o seguinte dispositivo legal e extraia os metadados solicitados: \n\n"${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        }
      });

      if (response.text) {
        const metadata = JSON.parse(response.text);
        return res.json(metadata);
      } else {
         return res.status(500).json({ error: 'Failed to generate content' });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/mindmap', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analise o seguinte dispositivo legal e gere um mapa mental hierárquico estruturado em JSON para facilitar o estudo e memorização. 
O JSON deve ter este formato (onde children é opcional):
{
  "name": "Ideia Central (ex: Homicídio Qualificado)",
  "children": [
    { "name": "Motivo Torpe", "children": [...] },
    { "name": "Motivo Fútil" }
  ]
}

Dispositivo legal:
"${text}"`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      if (response.text) {
        const metadata = JSON.parse(response.text);
        return res.json(metadata);
      } else {
         return res.status(500).json({ error: 'Failed to generate content' });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/autohighlight', async (req, res) => {
    try {
      const { text, rule } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const schema: Schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            textStr: { type: Type.STRING, description: "O trecho exato retirado do texto original. DEVE ser uma cópia literal, preservando pontuação, acentos e maiúsculas/minúsculas." },
            color: { type: Type.STRING, description: "A cor ou estilo correspondente: 'yellow', 'green', 'pink', 'blue', 'bold' ou 'underline'" }
          },
          required: ["textStr", "color"]
        }
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Baseado na REGRA DE CORES abaixo, identifique os trechos do TEXTO LEGAL que devem ser formatados e grifados.
Retorne EXATAMENTE os trechos do texto original, sem NENHUMA alteração, para que possamos fazer um "match" perfeito.
Selecione as cores estritamente de acordo com a regra do usuário.
As opções válidas de cor/estilo são: 'yellow', 'green', 'pink', 'blue', 'bold', 'underline'.

REGRA DE CORES:
"${rule || 'Destaque prazos de verde, e penalidades de vermelho (pink)'}"

TEXTO LEGAL:
"${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        }
      });

      if (response.text) {
        const highlights = JSON.parse(response.text);
        return res.json(highlights);
      } else {
         return res.status(500).json({ error: 'Failed to generate content' });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
