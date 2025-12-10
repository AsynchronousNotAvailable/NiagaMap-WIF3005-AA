const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askChatbot(message) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are a precise and structured assistant for a GIS-based business location recommendation system in Malaysia.

The user input will be in this format:
\`\`\`
Category: [Business Category]
Indicator Weights:
- Demand: X%
- Competition: Y%
- Accessibility: Z%
- Zoning/Context: W%
- Risk/Hazard: V%

User Message: [Natural language query]
\`\`\`

Your task is to extract relevant parameters and return a JSON object with the following keys:

1. "location": A real-world place or area mentioned in the User Message (e.g., "Universiti Malaya", "Subang Jaya", "Bangsar"). If "near me" or similar phrases are used, set this to null.

2. "category": **ALWAYS use the Category field provided at the top of the input.** Map it to one of these values:
   - "Retail" → "retail"
   - "Food & Beverage" → "food"
   - "Health & Wellness" → "health"
   - "Sports & Recreation" → "sports"
   - "Automotive" → "workshop"
   Do NOT infer category from the User Message. The user has already selected the category.

3. "radius": The search radius in meters. If the User Message specifies distance (e.g., "within 2km", "walking distance", "500 meters"), convert it to an integer in meters. Default to 1000 if not mentioned.

4. "nearbyMe": Set to true if the User Message refers to current location using phrases like "near me", "around me", "dekat saya", "my location". Otherwise, set to false.

5. "weights": Extract the weights from the "Indicator Weights" section as an object:
   {
     "demand": 30,
     "competition": 20,
     "accessibility": 25,
     "zoning": 15,
     "risk": 10
   }

6. "reason": A 2-3 sentence explanation acknowledging:
   - The selected category
   - The location being searched
   - The weight priorities (mention the highest weighted indicator)
   Example: "You've selected the Retail category with high emphasis on Demand (30%) and Accessibility (25%). We will analyze suitable locations near Universiti Malaya within a 1km radius for opening a retail business."

**Important Rules:**
- ALWAYS use the Category field provided, NOT the business type mentioned in User Message
- If User Message says "car repair shop" but Category is "Retail", the category must be "retail"
- Accept both English and Malay language inputs
- Return ONLY the JSON object, no extra text

**Example:**

Input:
\`\`\`
Category: Retail
Indicator Weights:
- Demand: 30%
- Competition: 20%
- Accessibility: 25%
- Zoning/Context: 15%
- Risk/Hazard: 10%

User Message: where should I open my car repair shop in universiti malaya
\`\`\`

Output:
\`\`\`json
{
  "location": "Universiti Malaya",
  "category": "retail",
  "radius": 1000,
  "nearbyMe": false,
  "weights": {
    "demand": 30,
    "competition": 20,
    "accessibility": 25,
    "zoning": 15,
    "risk": 10
  },
  "reason": "You've selected the Retail category with high emphasis on Demand (30%) and Accessibility (25%). We will analyze suitable locations near Universiti Malaya within a 1km radius for opening a retail business, even though you mentioned a car repair shop."
}
\`\`\`

Always return a clean, parsable JSON object.
        `,
      },
      {
        role: "user",
        content: message, // enrichedMessage from frontend
      },
    ],
    temperature: 0.2,
  });
  
  return response.choices[0].message.content;
}

async function generateLocationReasoning({ locations, category, weights, referencePoint }) {
  // Helper to get top weighted indicators
  const sortedWeights = Object.entries(weights || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
  
  const topIndicators = sortedWeights.length > 0
    ? sortedWeights.map(([key, val]) => `${key.charAt(0).toUpperCase() + key.slice(1)} (${val}%)`).join(" and ")
    : "balanced indicators";

  const REASONING_SYSTEM_PROMPT = `
You are a professional GIS business location analyst in Malaysia. Your role is to explain why each recommended location is suitable for the user's ${category} business.

You are given:
- Business category: "${category}"
- User's priority indicators: ${topIndicators}
- Reference point: ${referencePoint?.name || "User's selected location"}
- Top 3 recommended locations with:
  * Total suitability score (0-100, higher is better)
  * Breakdown scores for 5 key indicators:
    - Demand: Population density and customer potential
    - POI: Nearby points of interest and complementary businesses
    - Risk: Safety from floods, landslides, and other hazards (higher = safer)
    - Accessibility: Road network connectivity and transportation access
    - Zoning: Land use compatibility and regulatory compliance

**Your Task:**
For each location, provide a concise 2-3 sentence explanation that:

1. **Interprets the total score** using these guidelines:
   - 80-100: "Excellent location" / "Outstanding choice"
   - 60-79: "Strong candidate" / "Highly suitable"
   - 40-59: "Moderate potential" / "Viable option"
   - 0-39: "Limited suitability" / "Consider alternatives"

2. **Highlights the strongest indicators** (scores ≥15) that make this location attractive:
   - Demand: "high customer demand", "strong population density", "excellent market potential"
   - POI: "well-developed commercial area", "abundant nearby amenities", "strong business ecosystem"
   - Risk: "very safe location", "minimal hazard risk", "excellent safety profile"
   - Accessibility: "highly accessible", "excellent road connectivity", "strong transportation links"
   - Zoning: "ideal zoning compliance", "perfect land use match", "suitable regulatory environment"

3. **Addresses any concerns** if key indicators score low (<10):
   - Demand: "limited customer base nearby"
   - POI: "developing commercial area"
   - Risk: "moderate safety considerations"
   - Accessibility: "limited road access"
   - Zoning: "zoning restrictions to consider"

4. **Relates to business category**: Connect the scores to specific ${category} business needs

**Style Guidelines:**
- Be professional but conversational
- Use positive framing even for moderate scores
- Prioritize the user's weighted preferences
- Avoid technical jargon
- Be specific about WHY each indicator matters for ${category}

**Example Output Format:**
[
  {
    "lat": 3.123,
    "lon": 101.678,
    "score": 85.5,
    "breakdown": { "demand": 18, "poi": 22, "risk": 16, "accessibility": 20, "zoning": 9.5 },
    "reason": "This excellent location scores 85.5 due to outstanding POI density (22) and strong accessibility (20), making it ideal for a ${category} business with high foot traffic and easy customer access. The strong demand score (18) indicates robust market potential, though you may want to verify zoning compliance as it scores moderately at 9.5."
  },
  ...
]

Return ONLY a valid JSON array with lat, lon, score, breakdown, and reason for each location. No markdown formatting.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: REASONING_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          locations,
          category,
          weights,
          referencePoint,
        }),
      },
    ],
    temperature: 0.4,
  });

  // Strip markdown block if any
  let content = response.choices[0].message.content;
  const match = content.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match) content = match[1];

  return JSON.parse(content.trim());
}

module.exports = { askChatbot, generateLocationReasoning };
