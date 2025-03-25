const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const { OpenAI, toFile } = require("openai");
const mongoose = require("mongoose");
const { generateChatName } = require("../utils/nameGenerator");
const ChatHistory = require("../models/chatHistoryModel");
const puppeteer = require("puppeteer");
// const fetch = require('node-fetch');
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ensure the upload directory exists
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize OpenAI client
const openai = new OpenAI({
  // apiKey: process.env.OPENAI_API_KEY
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

// Middleware to parse JSON bodies
router.use(express.json());

// Middleware to handle file uploads
router.use(fileUpload());

// Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    const { message, session_id, tools, user_id, custom_prompt, custom_temp } =
      req.body;

    if (!message || !user_id) {
      return res.status(400).json({
        error: "Message and user_id are required",
      });
    }

    // Find or create chat history
    let chatHistory = await ChatHistory.findOne({ session_id, user_id });
    if (!chatHistory) {
      const chatName = await generateChatName(message);
      chatHistory = new ChatHistory({
        user_id,
        session_id,
        name: chatName,
        messages: [
          {
            role: "system",
            content:
              custom_prompt ||
              `
                        Your name is OhanaPal. You are a helpful assistant. You can use your tools to help the user with their queries.
                        Format your responses as structured HTML with the appropriate tags and styling like lists, paragraphs, etc.
                        Only respond in HTML no markdown. You have the ability to run parallel tool calls.
                    `,
          },
        ],
      });
    }

    // Add user message to history
    chatHistory.messages.push({
      role: "user",
      content: message,
    });

    // Clean messages before sending to OpenAI
    const cleanedMessages = chatHistory.messages.map((msg) => {
      const cleanMsg = {
        role: msg.role,
        content: msg.content,
      };

      // Only include additional fields if they have values
      if (msg.name) cleanMsg.name = msg.name;
      if (msg.function_call) cleanMsg.function_call = msg.function_call;
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls;
      }
      if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;

      return cleanMsg;
    });

    // Prepare messages for OpenAI
    const completion = await openai.chat.completions.create({
      model: "llama3.2",
      messages: cleanedMessages,
      temperature: custom_temp ? parseFloat(custom_temp) : 0.7,
      ...(tools && tools.length > 0
        ? {
            tools: tools,
            parallel_tool_calls: true,
          }
        : {}),
    });

    // Get the assistant's response and completion details
    const assistantResponse = completion.choices[0].message;
    const finishReason = completion.choices[0].finish_reason;

    // Add assistant response to history
    chatHistory.messages.push(assistantResponse);

    // Update timestamp
    chatHistory.updated_at = new Date();

    // Save to database
    await chatHistory.save();

    // Prepare response based on finish_reason
    const responseData = {
      session_id,
      finish_reason: finishReason,
    };

    if (finishReason === "tool_calls") {
      responseData.tool_calls = assistantResponse.tool_calls;
      responseData.response = null; // No content when it's a tool call
    } else {
      responseData.response = assistantResponse.content;
      responseData.tool_calls = null;
    }

    // Send response
    res.json(responseData);
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tool call response endpoint
router.post("/tool-response", async (req, res) => {
  try {
    const { session_id, tool_responses } = req.body;
    // console.log('Received tool responses:', JSON.stringify(tool_responses, null, 2));

    // Find chat history
    let chatHistory = await ChatHistory.findOne({ session_id });
    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    // Find the last assistant message with tool calls
    const lastAssistantMessage = [...chatHistory.messages]
      .reverse()
      .find((msg) => msg.role === "assistant" && msg.tool_calls);

    if (!lastAssistantMessage) {
      return res.status(400).json({ error: "No tool call message found" });
    }

    console.log(
      "Last assistant message:",
      JSON.stringify(lastAssistantMessage, null, 2)
    );

    // Add tool responses in the correct format
    tool_responses.forEach((response) => {
      chatHistory.messages.push({
        role: "tool",
        content:
          typeof response.function_response === "string"
            ? response.function_response
            : JSON.stringify(response.function_response),
        tool_call_id: response.tool_call_id,
        name: response.function_name, // Add function name to match OpenAI's format
      });
    });

    // console.log('Messages before OpenAI call:', JSON.stringify(chatHistory.messages, null, 2));

    // Clean messages before sending to OpenAI
    const cleanedMessages = chatHistory.messages.map((msg) => {
      const cleanMsg = {
        role: msg.role,
        content: msg.content,
      };

      // Only include additional fields if they have values
      if (msg.name) cleanMsg.name = msg.name;
      if (msg.function_call) cleanMsg.function_call = msg.function_call;
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls;
      }
      if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;

      return cleanMsg; // {{ }}
    });

    // console.log('Cleaned messages:', JSON.stringify(cleanedMessages, null, 2));

    // Get OpenAI's response to all tool results
    const completion = await openai.chat.completions.create({
      model: "llama3.2",
      messages: cleanedMessages,
      temperature: 0.7,
    });

    // Get the assistant's response and completion details
    const assistantResponse = completion.choices[0].message;
    const finishReason = completion.choices[0].finish_reason;

    // Add assistant response to history
    chatHistory.messages.push(assistantResponse);

    // Update timestamp
    chatHistory.updated_at = new Date();

    // Save to database
    await chatHistory.save();

    // Prepare response based on finish_reason
    const responseData = {
      session_id,
      finish_reason: finishReason,
    };

    if (finishReason === "tool_calls") {
      responseData.tool_calls = assistantResponse.tool_calls;
      responseData.response = null;
    } else {
      responseData.response = assistantResponse.content;
      responseData.tool_calls = null;
    }

    // Send response
    res.json(responseData);
  } catch (error) {
    console.error("Tool Response API Error:", error);
    console.error("Error details:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get chat history endpoint
router.get("/history/:session_id", async (req, res) => {
  try {
    const { session_id } = req.params;
    const chatHistory = await ChatHistory.findOne({ session_id });

    if (!chatHistory) {
      return res.status(404).json({ error: "Chat history not found" });
    }

    res.json(chatHistory);
  } catch (error) {
    console.error("History API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history/list/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { last_n_items } = req.query; // Get the query parameter

    // Create base query and sort
    let query = ChatHistory.find({ user_id }).sort({ updated_at: -1 });

    // Apply limit if last_n_items is provided and is a valid number
    if (last_n_items && !isNaN(last_n_items)) {
      query = query.limit(parseInt(last_n_items));
    }

    const chatHistories = await query;

    if (!chatHistories || chatHistories.length === 0) {
      return res
        .status(404)
        .json({ error: "No chat histories found for this user" });
    }

    res.json(chatHistories);
  } catch (error) {
    console.error("List History API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Suggestions endpoint
router.get("/suggest", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content:
            "You return three suggestions as JSON data. You will suggest a topic to research, a topic to stay updated on (latest news, current events), and a topic to learn.",
        },
        {
          role: "user",
          content: "Generate three suggestions now!",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "suggestions_schema",
          schema: {
            type: "object",
            properties: {
              research_topic: {
                description:
                  "A suggested topic for the user to research. Example: Overview of the solar panel industry.",
                type: "string",
              },
              update_topic: {
                description:
                  "A suggested topic for the user to stay updated on. Example: Latest news on the stock market.",
                type: "string",
              },
              learn_topic: {
                description:
                  "A suggested topic for the user to learn. Example: How to code in Python.",
                type: "string",
              },
            },
            additionalProperties: false,
          },
        },
      },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error("Suggestions API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Web scraping endpoint
router.post("/scrape", async (req, res) => {
  let browser;
  try {
    console.log("[Scrape] Starting scrape request:", { url: req.body.url });
    const { url } = req.body;
    const CHARACTER_LIMIT = 6000;

    if (!url) {
      console.log("[Scrape] Error: No URL provided");
      return res.status(400).json({ error: "URL is required" });
    }

    // Launch browser
    console.log("[Scrape] Launching browser...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/usr/bin/chromium-browser",
    });
    console.log("[Scrape] Browser launched successfully");

    const page = await browser.newPage();
    console.log("[Scrape] New page created");

    // Set timeout and navigate to page
    console.log("[Scrape] Navigating to URL:", url);
    await page.setDefaultNavigationTimeout(10000);
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("[Scrape] Successfully loaded page");

    // Extract text from specified tags
    console.log("[Scrape] Starting content extraction");
    const content = await page.evaluate(() => {
      const tagsToScrape = ["p", "h1", "h2", "h3"];
      const elements = document.querySelectorAll(tagsToScrape.join(","));
      const result = Array.from(elements)
        .map((element) => element.textContent.trim())
        .filter((text) => text)
        .join("\n");
      return result;
    });
    console.log("[Scrape] Content extracted, length:", content.length);

    // Truncate content if necessary
    const truncatedContent = content.slice(0, CHARACTER_LIMIT);
    console.log(
      "[Scrape] Content truncated to length:",
      truncatedContent.length
    );

    await browser.close();
    console.log("[Scrape] Browser closed successfully");

    res.json({ content: truncatedContent || "No matching tags found" });
    console.log("[Scrape] Response sent successfully");
  } catch (error) {
    console.error("[Scrape] Error details:", {
      message: error.message,
      stack: error.stack,
      url: req.body.url,
      browserState: browser ? "initialized" : "not initialized",
    });

    if (browser) {
      try {
        await browser.close();
        console.log("[Scrape] Browser closed after error");
      } catch (closeError) {
        console.error("[Scrape] Error closing browser:", closeError.message);
      }
    }

    res.status(500).json({
      error: "Scraping failed",
      details: error.message,
    });
  }
});

// Speech-to-text endpoint
router.post("/speech-to-text", async (req, res) => {
  try {
    // Extract Base64 encoded data from the request
    const { audioData } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: "Base64 audio data is required" });
    }

    // Decode Base64 to binary
    const audioBuffer = Buffer.from(audioData, "base64");

    // Use OpenAI API to transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, "audio.mp3", {
        contentType: "audio/mpeg",
      }),
      model: "whisper-1",
    });

    // Send the transcription text as response
    res.json({ transcription: transcription.text });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(500).json({ error: "Error during transcription" });
  }
});

// ... existing code ...

// Text-to-Speech endpoint
router.post("/text-to-speech", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Create speech from text using OpenAI
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Set headers for audio file response
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'attachment; filename="speech.mp3"',
    });

    // Send the audio file
    res.send(buffer);
  } catch (error) {
    console.error("Text-to-Speech API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ... existing code ...

// Clean HTML endpoint
router.post("/clean-html", async (req, res) => {
  try {
    const { htmlText } = req.body;

    if (!htmlText) {
      return res.status(400).json({ error: "htmlText is required" });
    }

    // Ensure htmlText is a string
    const htmlTextString = JSON.stringify(htmlText);

    // Use OpenAI to clean HTML and return plain text

    const completion = await openai.chat.completions.create({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that removes all HTML tags from the input and returns plain text. Do not output any other formatting like markdown. Only output plain text",
        },
        {
          role: "user",
          content: htmlTextString, // Ensure this is a string
        },
      ],
      temperature: 0.0, // Use a low temperature for deterministic output
    });

    const plainText = completion.choices[0].message.content;
    console.log("plantext", plainText);

    // Send the plain text as response
    res.json({ plainText });
  } catch (error) {
    console.error("Clean HTML API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get an ephemeral API key
router.get("/session", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/realtime/sessions",
      {
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching ephemeral key" + error);
  }
});

router.post("/generate-image", async (req, res) => {
  const { contents } = req.body;

  if (!contents) {
    return res.status(400).send("Content is required");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"],
    },
  });

  try {
    // Extract prompt text
    const promptText =
      typeof contents === "string"
        ? contents
        : Array.isArray(contents) && contents.length > 0 && contents[0].text
        ? contents[0].text
        : "image";

    // Remove the prefix if it exists
    const prefix = "Create an image: ";
    const cleanedPrompt = promptText.startsWith(prefix)
      ? promptText.substring(prefix.length)
      : promptText;

    // Clean the prompt to create a filename-safe string
    const cleanPrompt = cleanedPrompt
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s]+/g, "-") // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    // Add timestamp for uniqueness
    const timestamp = new Date().getTime();
    const filename = `${cleanPrompt}-${timestamp}.png`;

    const response = await model.generateContent(contents);
    for (const part of response.response.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const imagePath = `${uploadDir}/${filename}`;
        fs.writeFileSync(imagePath, buffer);
        console.log(`Image saved as ${filename}`);
        return res.status(200).send({
          message: "Image generated successfully",
          imagePath,
          filename,
        });
      }
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return res.status(500).send("Error generating content");
  }
});

router.post("/edit-image", async (req, res) => {
  // Expecting an array of image paths and a common edit instruction
  const { imagePaths, editInstruction } = req.body;

  if (
    !imagePaths ||
    !Array.isArray(imagePaths) ||
    imagePaths.length === 0 ||
    !editInstruction
  ) {
    return res
      .status(400)
      .send("Image paths array and edit instruction are required");
  }

  try {
    // Prepare the content parts
    const contents = [{ text: editInstruction }]; // Start with the instruction

    // Load each image and add it to the contents array
    for (const imagePath of imagePaths) {
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      });
    }

    // Model configuration remains the same
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ["Text", "Image"],
      },
    });

    const response = await model.generateContent(contents);
    for (const part of response.response.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const timestamp = new Date().getTime();
        const filename = `merged_edited_${timestamp}.png`; // More descriptive filename
        const newImagePath = `${uploadDir}/${filename}`;
        fs.writeFileSync(newImagePath, buffer);
        // console.log(`Image saved as ${filename}`);
        return res.status(200).json({
          message: "Images merged and edited successfully",
          imagePath: newImagePath,
          filename: `http://localhost:3001/uploads/${filename}`,
        });
      }
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return res.status(500).json("Error generating content");
  }
});

router.post('/vision-analysis', async (req, res) => {
  console.log(process.env.GEMINI_API_KEY)
  try {
    // Check if image file is provided
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'Image file is required' })
    }

    console.log('[Vision Analysis] Starting image analysis request')
    const imageFile = req.files.image
    const prompt =
      req.body.prompt ||
      'Analyze this image and describe what you see in detail.'

    // Convert image to base64
    const imageBase64 = imageFile.data.toString('base64')

    // Initialize the Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageFile.mimetype,
      },
    }

    console.log('[Vision Analysis] Sending request to Gemini API')
    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    console.log('[Vision Analysis] Successfully received analysis from Gemini')
    // Return the analysis result
    res.json({ analysis: text })
  } catch (error) {
    console.error('[Vision Analysis] Error:', error)
    res.status(500).json({
      error: 'Vision analysis failed',
      details: error.message,
    })
  }
})


module.exports = router;
