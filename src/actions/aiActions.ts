"use server";

export async function extractDealData(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    // 1. Convert the PDF into a Base64 string so the API can read it
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("Google API Key is missing");

    // 2. Use Gemini 2.5 Flash (1.5 Flash was retired and throws 404s)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { 
              text: `You are an expert commodity trading assistant. Extract the trading parameters from the provided document.
              
              Return ONLY a valid JSON object. Do NOT wrap it in markdown formatting like \`\`\`json.
              
              Expected Schema:
              {
                "title": "Concise professional summary (e.g. 50,000 MT Urea)",
                "quantity": 50000, 
                "quantityUnit": "MT", 
                "price": 150, 
                "incoterms": "FOB", 
                "origin": "Oman", 
                "destination": "India", 
                "specs": "Brief 2-3 sentence summary of specs."
              }
              
              If a field is missing, use "" for text or null for numbers.`
            },
            { 
              // Native Gemini payload structure for documents
              inline_data: { 
                mime_type: file.type, 
                data: base64Data 
              } 
            }
          ]
        }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || "Google API Error");
    }

    // 3. Extract and parse the returned JSON
    const textOutput = result.candidates[0].content.parts[0].text;
    
    // Clean the output in case Gemini returns markdown code fences
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return { success: true, data: parsedData };
    
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return { success: false, error: "Failed to extract data from document." };
  }
}