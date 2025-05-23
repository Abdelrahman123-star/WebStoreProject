const { OpenAI } = require('openai');

class AIController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async handleChat(req, res) {
    try {
      if (!req.body?.message) {
        return this.sendError(res, 400, "Invalid request format", "Please provide a message in your request");
      }

      console.log("Received message:", req.body.message);

      const completion = await this.getCompletionWithTimeout(req.body.message);
      const reply = completion?.choices?.[0]?.message?.content;
      
      if (!reply) {
        throw new Error("Empty response from API");
      }

      return res.json({ reply });

    } catch (error) {
      console.error("AI Chat error:", {
        error: error.message,
        stack: error.stack,
        type: error.name
      });

      return this.sendError(res, 500, error.message, "Sorry, I'm having trouble responding. Please try again later.");
    }
  }

  async getCompletionWithTimeout(message) {
    return await Promise.race([
      this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant for WebStore. Be concise and helpful."
          },
          { role: "user", content: message }
        ],
        max_tokens: 100
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API timeout")), 5000)
      )
    ]);
  }

  sendError(res, status, error, reply) {
    return res.status(status).json({ 
      error,
      reply 
    });
  }
}

// Export an instance of the class
module.exports = new AIController();