import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// AI Betting Suggestion endpoint
router.post('/api/ai/betting-suggestion', async (req: Request, res: Response) => {
  try {
    const { eventName, sport, homeTeam, awayTeam } = req.body;

    // Call OpenAI via Replit AI Integrations
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert sports betting advisor. Analyze sports events and provide betting recommendations with confidence scores and reasoning. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Analyze this ${sport} event and provide betting recommendations:
Event: ${eventName}
${homeTeam ? `Home Team: ${homeTeam}` : ''}
${awayTeam ? `Away Team: ${awayTeam}` : ''}

Provide 2-3 betting recommendations in this JSON format:
{
  "suggestions": [
    {
      "market": "Market Name",
      "recommendation": "Specific bet recommendation",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }
  ]
}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await aiResponse.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.json({ suggestions: [] });
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };

    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.json({ suggestions: [] });
  }
});

export default router;
