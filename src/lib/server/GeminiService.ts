import type { AiScanResult } from '@/types/models';

export class GeminiService {
  static async analyzeImage(prompt: string, imageBase64: string, imageMimeType: string): Promise<AiScanResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('AI service is not configured. Contact support.');
    }

    const geminiModel = 'gemini-flash-latest';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imageMimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const lower = errBody.toLowerCase();
      
      if (response.status === 429 || lower.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please wait a few minutes and try again.');
      }
      if (response.status === 400) {
        throw new Error('The image was rejected by the AI (unsupported format or safety filter). Please try a different image.');
      }
      if (response.status === 403) {
        throw new Error('Permission denied. Ensure the Gemini API is enabled in your Google Cloud project.');
      }
      throw new Error(`Gemini AI error (HTTP ${response.status}). Please try again.`);
    }

    const geminiBody = await response.json();
    const rawText = geminiBody?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const finishReason = geminiBody?.candidates?.[0]?.finishReason ?? 'unknown';

    if (!rawText.trim()) {
      const blocked = finishReason === 'SAFETY' || finishReason === 'RECITATION';
      if (blocked) {
        throw new Error('The image was blocked by safety filters. Please try a different image.');
      }
      throw new Error(`The AI did not return a result (finish reason: ${finishReason}). Please try again.`);
    }

    return this.parseResponse(rawText);
  }

  private static parseResponse(text: string): AiScanResult {
    const clean = text
      .replace(/```json\s*/gm, '')
      .replace(/```\s*/gm, '')
      .trim();

    let decoded: unknown;
    try {
      decoded = JSON.parse(clean);
    } catch {
      throw new Error('The AI returned an unreadable response. Please try again.');
    }

    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
      throw new Error('The AI returned an unreadable response. Please try again.');
    }

    const d = decoded as Record<string, unknown>;

    return {
      diseaseName: typeof d.diseaseName === 'string' ? d.diseaseName : 'Unknown',
      confidence: typeof d.confidence === 'number' ? Math.round(d.confidence) : 0,
      severity: typeof d.severity === 'string' ? d.severity : 'Unknown',
      possibleCause: typeof d.possibleCause === 'string' ? d.possibleCause : '',
      immediateAction: typeof d.immediateAction === 'string' ? d.immediateAction : '',
      treatment: typeof d.treatment === 'string' ? d.treatment : '',
      prevention: typeof d.prevention === 'string' ? d.prevention : '',
      isolationRequired: typeof d.isolationRequired === 'boolean' ? d.isolationRequired : false,
    };
  }
}