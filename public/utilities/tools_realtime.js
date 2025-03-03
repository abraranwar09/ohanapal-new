// Keep only the tools array and remove toolMapping and getActiveTools
const tools = [
    {
        type: "function",
        name: "getCalendarEvents",
        description: "You can use the Google API to fetch the user's events based on time period.",
        parameters: {
            type: "object",
            properties: {
                timePeriod: {
                    type: "string",
                    description: "Allows you to control the time period of events retrieved. All values include today.",
                    enum: ["last 30 days", "last week", "today", "next week", "next 30 days"],
                },
                query: {
                    type: "string",
                    description: "The query the user is asking about his past events.",
                },
            },
            required: ["timePeriod", "query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "saveEvent",
        description: "Saves an event to the user's Google Calendar.",
        parameters: {
            type: "object",
            properties: {
                summary: {
                    type: "string",
                    description: "The title or summary of the event.",
                },
                location: {
                    type: "string",
                    description: "The location where the event will take place.",
                },
                description: {
                    type: "string",
                    description: "A detailed description of the event.",
                },
                start: {
                    type: "string",
                    description: "The start date and time of the event in ISO 8601 format.",
                },
                end: {
                    type: "string",
                    description: "The end date and time of the event in ISO 8601 format.",
                },
            },
            required: ["summary", "location", "description", "start", "end"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "listGmailMessages",
        description: "Fetches a list of Gmail messages based on the specified query parameters.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to filter Gmail messages.",
                },
                maxResults: {
                    type: "integer",
                    description: "The maximum number of messages to retrieve.",
                }
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "getGmailMessage",
        description: "Fetches details of a specific Gmail message using its messageId. Use this tool only when the user provides a messageId and explicitly asks for Gmail message details.",
        parameters: {
            type: "object",
            properties: {
                messageId: {
                    type: "string",
                    description: "The ID of the Gmail message to retrieve.",
                },
            },
            required: ["messageId"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "sendGmailMessage",
        description: "Sends an email through Gmail with the specified parameters.",
        parameters: {
            type: "object",
            properties: {
                to: {
                    type: "string",
                    description: "Email address of the recipient.",
                },
                subject: {
                    type: "string",
                    description: "Subject line of the email.",
                },
                body: {
                    type: "string",
                    description: "Content of the email message.",
                },
                cc: {
                    type: "string",
                    description: "Email addresses to CC (comma-separated). Send empty string if not needed.",
                },
                bcc: {
                    type: "string",
                    description: "Email addresses to BCC (comma-separated). Send empty string if not needed.",
                },
                isHtml: {
                    type: "boolean",
                    description: "Whether the email body contains HTML formatting. Send false if not needed.",
                },
            },
            required: ["to", "subject", "body"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "usePerplexity",
        description: "Search for information on the web using Perplexity AI. Whenever asked to search the web, use this tool.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to look up using Perplexity.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "checkKnowledgeBase",
        description: "Search through the company's knowledge base for relevant information.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to look up in the knowledge base.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "scrapeWeb",
        description: "Scrapes content from a specified webpage URL.",
        parameters: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "The URL of the webpage to scrape.",
                },
            },
            required: ["url"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "executeComputerCommand",
        description: "Executes a natural language computer control command through our computer control API using a sandboxed environment and a safe agent. You can execute any command. You can send any natural language command to control the computer not a bash command.",
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "The command to execute (any natural language command)"
                }
            },
            required: ["command"]
        }
    },
    {
        type: "function",
        name: "open_google",
        description: "Opens Google with a search query.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query to use on Google" }
            }
        }
    },
    {
        type: "function",
        name: "open_input_box",
        description: "Opens the text input box so users can type a specific message when you need an email address or a phone number, etc.",
        parameters: {
            type: "object",
            properties: {
                placeholder: { type: "string", description: "The placeholder text to display in the input box" }
            }
        }
    },
    {
        type: "function",
        name: "saveMemory",
        description: "Saves a memory with a unique key and associated tags.",
        parameters: {
            type: "object",
            properties: {
                memory: {
                    type: "string",
                    description: "A string containing all the information you want to save to this particular memory."
                },
                key: {
                    type: "string",
                    description: "A unique alphanumeric key with text and timestamp, providing context about the memory. this key should contain helpful context as to what is in the memory. example: catfeeding12039123"
                },
                tags: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Tags that help identify the contents of the memory. Use multiple tags. These should be useful for retrieval and context. Example: ['cat', 'feeding', 'reminders']"
                }
            },
            required: ["memory", "key", "tags"],
            additionalProperties: false
        }
    }
];

// Make tools available globally
window.toolsModule = {
    tools
};
