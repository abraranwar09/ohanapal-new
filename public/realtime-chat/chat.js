const temperature = 0.5;

const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);

const formattedToday = today.toLocaleString('en-US', { timeZone: userTimeZone }).replace(',', '');  

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

let memKeys;
let memTags;
let systemPrompt;

const additionalPrompt = localStorage.getItem('system-prompt');

async function getMemKeysAndTags() {
    try {
        const keysResponse = await getAllKeys();
        const tagsResponse = await getAllTags();

        memKeys = keysResponse.keys;
        memTags = tagsResponse.keys; // Assuming getAllTags() returns an object with a 'keys' property

        systemPrompt = `
Your name is OhanaPal. You are a helpful assistant. You can help the user with their questions and tasks. You can also use tools to help the user with their tasks. Use the open_input_box tool to get information from the user when you need it (for example, when you need an email address or a phone number, etc.).
You have the ability to save and retrieve memories. You can retrieve single memories by their key or many memories by their tag.

Here are the keys for the current memories you have: 
${memKeys}.

Here are the tags for the current memories you have:
${memTags}.

You have the ability to run parallel tool calls. You also have the ability to run tool calls one after the other to complete a task.



${additionalPrompt}
`;
    } catch (error) {
        console.error('Error loading memory keys and tags:', error);
    }
}

getMemKeysAndTags();


let pc; // Declare the peer connection outside the function for broader scope
let dc; // Declare the data channel outside the function for broader scope


async function init() {
  const tokenResponse = await fetch("/ai/session");
  const data = await tokenResponse.json();
  const EPHEMERAL_KEY = data.client_secret.value;

  pc = new RTCPeerConnection(); // Initialize the peer connection
  const audioEl = document.getElementById("remoteAudio");
  pc.ontrack = e => audioEl.srcObject = e.streams[0]; // Set the audio element's source to the remote stream

  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  dc = pc.createDataChannel("oai-events");
  dc.addEventListener("open", () => {
    console.log("Data channel is open");
    // Update the system instructions once the data channel is open
    updateInstructions(systemPrompt + reprompt);
    configureTools();
  });
  dc.addEventListener("message", handleServerEvent);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-mini-realtime-preview-2024-12-17";
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp"
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);
}

function updateInstructions(newInstructions) {
  if (dc && dc.readyState === "open") {
    const event = {
      type: "session.update",
      session: {
        instructions: newInstructions,
        "turn_detection": {
          "type": "server_vad",
          "threshold": 0.8,
          "prefix_padding_ms": 300,
          "silence_duration_ms": 500,
          "create_response": true
      }
      }
    };
    dc.send(JSON.stringify(event));
    console.log("Instructions updated:", newInstructions);
  } else {
    console.error("Data channel is not open");
  }
}

async function handleServerEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === "response.done") {
    console.log("pre-response" + JSON.stringify(serverEvent.response));
    
    console.log("Response received:", serverEvent.response.output[0]);

    // if (serverEvent.response.output[0].content[0]) {
    //   const subtitleTextContainer = document.getElementById("subtitleTextContainer");
    //   subtitleTextContainer.innerHTML = "";
    //   subtitleTextContainer.innerHTML = `<p class="text-lg text-center mt-2 z-10 tlt" id="subtitleText">${serverEvent.response.output[0].content[0].transcript}</p>`
    //   $('.tlt').textillate();
    // }

    
    if (serverEvent.response.output[0].type === "function_call") {
      const { name, arguments, call_id } = serverEvent.response.output[0];
      console.log('its a tool call');
      let args = JSON.parse(arguments);
      let result;

      switch (name) {
        case 'open_google':
          console.log('its open google');
          result = await open_google(args.query);
          break;
        case 'generateProfile':
          result = await generateProfile(args.taskDescription, args.industry, args.additionalRequirements, args.model);
          break;
        case 'getCalendarEvents':
          result = await getCalendarEvents(args.timePeriod, args.query);
          break;
        case 'saveEvent':
          result = await saveEvent(args.summary, args.location, args.description, args.start, args.end);
          break;
        case 'listGmailMessages':
          result = await listGmailMessages(args.maxResults, args.query);
          break;
        case 'getGmailMessage':
          result = await getGmailMessage(args.messageId);
          break;
        case 'sendGmailMessage':
          result = await sendGmailMessage(args.to, args.subject, args.body, args.cc, args.bcc, args.isHtml);
          break;
        case 'performGoogleSearch':
          result = await performGoogleSearch(args.query);
          break;
        case 'deepResearch':
          result = await deepResearch(args.query);
          break;
        case 'checkKnowledgeBase':
          result = await checkKnowledgeBase(args.query);
          break;
        case 'scrapeWeb':
          result = await scrapeWeb(args.url);
          break;
        case 'executeComputerCommand':
          result = await executeComputerCommand(args.command);
          break;
        case 'open_input_box':
          result = await open_input_box(args.placeholder);
          break;
        case 'close_input_box':
          result = await close_input_box();
          break;
        case 'saveMemory':
          result = await saveMemory(args.memory, args.key, args.tags);
          break;
        case 'getAllKeys':
          result = await getAllKeys();
          break;
        case 'rememberByKey':
          result = await rememberByKey(args.key);
          break;
        case 'rememberByTag':
          result = await rememberByTag(args.tag);
          break;
        case 'updateMemory':
          result = await updateMemory(args.key, args.updates);
          break;
        case 'activateOhanaAct':
          result = await activateOhanaAct();
          break;
        case 'closeOhanaAct':
          result = await closeOhanaAct();
          break;
        default:
          console.warn(`Unhandled function name: ${name}`);
          return;
      }

      // Send the result back to the model
      const resultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify(result)
        }
      };
      dc.send(JSON.stringify(resultEvent));
      console.log("Function result sent:", result);

      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
          instructions: "Please describe the result of the function call in a way that is easy to understand for the user or move on to the next function call if you only required the result.",
        },
      };
      dc.send(JSON.stringify(responseCreate));
      console.log("Function reinforcement sent:", responseCreate);

      

    }

    // Handle the response, e.g., display text or process audio
    if (serverEvent.response.output[0].type === "text") {
      const textResponse = serverEvent.response.output[0].content;
      displayTextResponse(textResponse);
    } else if (serverEvent.response.output[0].type === "audio") {
      const audioStream = serverEvent.response.output[0].content;
      playAudioStream(audioStream);
    }
  }
}

function displayTextResponse(text) {
  // Implement logic to display text response to the user
  console.log("Text response:", text);
}

function playAudioStream(audioStream) {
  const audioEl = document.getElementById("remoteAudio");
  audioEl.srcObject = audioStream;
  audioEl.play();
  console.log("Playing audio stream");
}

function stopSession() {
  if (pc) {
    pc.close(); // Close the peer connection
    pc = null; // Reset the peer connection variable
    console.log("Session stopped");
  }
}

function configureTools() {
    if (dc && dc.readyState === "open") {
        const event = {
          type: "session.update",
          session: {
            tools: tools,
            tool_choice: "auto",
          }
        };
        dc.send(JSON.stringify(event));
        console.log("Tools configured:", event.session.tools);
        animation.play();
        document.getElementById("mainText").innerHTML = "OhanaPal is listening...";
        document.getElementById("subText").innerHTML = "Just speak and I will help you...";
      } else {
        console.error("Data channel is not open");
      }
}


document.getElementById("messageInput").addEventListener("keydown", (event) => {
  if (localStorage.getItem('mode') != 'act') {
    if (event.key === "Enter") {
      console.log("input event");
      const message = document.getElementById("messageInput").value;
      console.log(message);
      const event = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: message,
            }
          ]
        },
      };
      
      // WebRTC data channel and WebSocket both have .send()
      dc.send(JSON.stringify(event));
      
      close_input_box();
    }
  };

  if (localStorage.getItem('mode') === 'act') {
    if (event.key === "Enter") {
      console.log("input event");
      const message = document.getElementById("messageInput").value;
      console.log('sending command to computer: ' + message);

      manageSocketSend(message);

      document.getElementById("messageInput").value = '';
    }
  }

  
});

async function manageSocketSend(message) {
  const socketResponse = await sendWebsocketMessage(message);
  console.log('socket response: ' + socketResponse);

  const responseCreate = {
    type: "response.create",
    response: {
      modalities: ["text", "audio"],
      instructions: `The user is currently controlling their computer using natural language in Ohana Act mode. Please read out the result of the command verbatim. Results: ${JSON.stringify(socketResponse)} `,
    },
  };
  dc.send(JSON.stringify(responseCreate));
}


document.getElementById("talkButton").addEventListener("click", () => {
  if (pc && pc.connectionState === "connected") {
    stopSession();
    animation.stop();
    document.getElementById("mainText").innerHTML = "OhanaPal has stopped...";
    document.getElementById("subText").innerHTML = "click the talk button to start again...";
  } else {
    init();
    document.getElementById("mainText").innerHTML = "OhanaPal is loading...";
    document.getElementById("subText").innerHTML = "Please wait while your personalised assistant is loaded...";
  }
});


