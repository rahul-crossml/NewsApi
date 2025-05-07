// pages/api/smart-search.js

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;


  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  // ✅ 1️⃣ Check if the query is "news-related"
  const newsKeywords = ["news", "latest", "headlines", "breaking", "update", "updates"];
  const isNewsQuery = newsKeywords.some((word) =>
    query.toLowerCase().includes(word)
  );


  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
  });

  if (isNewsQuery) {
    // ✅ 2️⃣ News mode: use SerpAPI to fetch results
    try {
      const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(
        query
      )}&api_key=${process.env.SERPAPI_API_KEY}`;

      const searchResponse = await axios.get(serpApiUrl);
      const searchResults = searchResponse.data?.organic_results;

      if (!searchResults || searchResults.length === 0) {
        return res.status(404).json({ error: "No search results found." });
      }



      const formattedResults = searchResults
        .map((item, index) => {
          return `${index + 1}. ${item.title}\n${item.snippet || ""}\n${item.link || ""}`;
        })
        .join("\n\n");

      const systemMsg = new SystemMessage(
        "You are a helpful assistant. Please summarize and rephrase the following news results in a clear and concise way for the user."
      );

      const humanMsg = new HumanMessage(
        `Search results for: "${query}"\n\n${formattedResults}`
      );

      const llmResponse = await llm.invoke([systemMsg, humanMsg]);

      return res.status(200).json({
        mode: "news",
        summary: llmResponse.content,
        searchResults,
      });
    } catch (error) {
     
      return res.status(500).json({ error: "Failed to fetch news." });
    }
  } else {
    // ✅ 3️⃣ Non-news mode: directly answer with LLM
    try {
      const systemMsg = new SystemMessage(
        "You are a helpful assistant. Answer the user's question clearly."
      );

      const humanMsg = new HumanMessage(query);

      const llmResponse = await llm.invoke([systemMsg, humanMsg]);

      return res.status(200).json({
        mode: "direct",
        answer: llmResponse.content,
      });
    } catch (error) {
      console.error("Error answering query:", error);
      return res.status(500).json({ error: "Failed to get answer." });
    }
  }
}
