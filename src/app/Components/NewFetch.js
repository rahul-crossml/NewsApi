"use client";

import React, { useState } from "react";

const NewsFetch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setChatHistory((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/news-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      let modelMessage = { role: "model", content: "" };

      if (data.mode === "news") {
        modelMessage.content = `
          <h2 class="font-semibold">📰 News Summary:</h2>
          <div>${data.summary}</div>
         
       `
      } else if (data.mode === "direct") {
        modelMessage.content = `
          <h2 class="font-semibold">💬 Answer:</h2>
          <div>${data.answer}</div>
        `;
      } else {
        modelMessage.content = "Sorry, I couldn't understand the response.";
      }

      setChatHistory((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage = {
        role: "model",
        content: "❌ Something went wrong while fetching the news.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🗞️ News & Chat Bot</h1>

      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your query..."
          className="border p-2 rounded w-full mr-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded ${
              msg.role === "user"
                ? "bg-gray-200 self-end text-right"
                : "bg-blue-100"
            }`}
          >
            {msg.role === "user" ? (
              <p>{msg.content}</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: msg.content }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFetch;
