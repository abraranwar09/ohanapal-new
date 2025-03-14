//test tool to open google search in a new tab
async function openGoogle(query) {
    console.log(query);
    // Open new tab with Google search
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
    console.log(`Google search opened with query: ${query}`);

    return {
        "status": "success",
        "message": `Google search completed for ${query}`
    };
}

// Function to get calendar events
async function getCalendarEvents(timePeriod, query) {
    const authToken = localStorage.getItem('authToken');
    const calendarId = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');

    const response = await fetch("/google/calendar/events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            accessToken: authToken,
            calendarId: calendarId,
            timePeriod: timePeriod,
            userId: userId
        })
    });

    if (!response.ok) {
        return {
            "status": "error",
            "message": `There was an error getting your calendar events. Please try again later or check your config.`
        };
    }

    const data = await response.json();
    return data;
}

//function to save calendar events
async function saveEvent(summary, location, description, start, end) {
    const accessToken = localStorage.getItem('authToken');
    const calendarId = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');

    const response = await fetch("/google/calendar/save-event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            accessToken: accessToken,
            calendarId: calendarId,
            summary: summary,
            location: location,
            description: description,
            start: start,
            end: end,
            userId: userId
        })
    });

    if (!response.ok) {
        return {
            "status": "error",
            "message": `There was an error saving your calendar event. Please try again later or check your config.`
        };
    }

    const data = await response.json();
    return data;
}

// Function to list Gmail messages
async function listGmailMessages(maxResults, query) {
    const accessToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://img.icons8.com/color/512/gmail-new.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Retrieving your emails</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `

    try {
        const response = await fetch("/google/gmail/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken,
                maxResults,
                query,
                userId
            })
        });

        if (!response.ok) {
            return {
                "status": "error",
                "message": `There was an error listing your emails. Please try again later or check your config.`
            };
        }

        const data = await response.json();
        console.log('Gmail data:', data);
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `
        <div class="perplexity-alert">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <!-- Email List Header -->
        <div style="background-color: #f8f9fa; padding: 12px 16px; border-bottom: 1px solid #e0e0e0;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">Inbox</h3>
            <button class="close-button" onclick="closePerplexityAlert()">×</button>
        </div>
  
    <!-- Email List Items -->
    <div style="max-height: 400px; overflow-y: auto;" id="emailList">


    </div>
    </div>
        `
        const emailList = document.getElementById('emailList');
        data.forEach(email => {
            emailList.innerHTML += `
            <!-- Email Item 2 -->
        <div style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background-color 0.2s; display: flex; flex-direction: column; gap: 4px;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${email.from}</span>
            <span style="font-size: 12px; color: #666;">${email.date}</span>
        </div>
        <div style="font-weight: 600; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email.subject}</div>
        <div style="font-size: 13px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email.snippet}</div>
        </div>
        
        </div>
            `
        });
        
        return {
            "emails": data
        };
    } catch (error) {
        console.error('Error fetching emails:', error);
        return {
            "status": "error",
            "message": `There was an error listing your emails. Please try again later or check your config.`
        };
    }
}

// Function to get specific Gmail message details
async function getGmailMessage(messageId) {
    const accessToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://img.icons8.com/color/512/gmail-new.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Retrieving your desired email</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `


    try {
        const response = await fetch(`/google/gmail/message/${messageId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Gmail message:', data);

        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `
        <div class="perplexity-alert">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); background-color: white;">
  <!-- Email Header -->
  <div style="padding: 16px; border-bottom: 1px solid #e0e0e0; background-color: #f8f9fa;">
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #333;">${data.headers.subject}</h2>
        <button class="close-button" onclick="closePerplexityAlert()">×</button>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #5865F2; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">${data.headers.from.charAt(0).toUpperCase()}${data.headers.from.charAt(5).toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 14px; color: #333;">${data.headers.from}</div>
          </div>
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${data.headers.date}</div>
      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px;">
      <div style="min-width: 200px;">
        <span style="color: #666; margin-right: 4px;">To:</span>
        <span style="color: #333;">${data.headers.to}</span>
      </div>
    </div>
  </div>
  
  <!-- Email Body -->
  <div style="padding: 20px; color: #333; font-size: 14px; line-height: 1.6;">
    <p style="margin-bottom: 16px;">${data.snippet}</p>
    <p style="margin-bottom: 16px;">${data.body}</p>
    
    
  </div>
</div>
            
        </div>`
        return data;

    } catch (error) {
        console.error('Error fetching email details:', error);
        return {
            "status": "error",
            "message": `There was an error getting your email details. Please try again later or check your config.`
        };
    }
}

// Function to send Gmail message
async function sendGmailMessage(to, subject, body, cc, bcc, isHtml) {
    const accessToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://img.icons8.com/color/512/gmail-new.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Sending your email to ${to}</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `

    try {
        const response = await fetch("/google/gmail/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken: accessToken,
                to: to,
                subject: subject,
                body: body,
                isHtml: isHtml,
                userId: userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://img.icons8.com/color/512/gmail-new.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Email sent successfully</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `

        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 3000);
        
        return data;

        

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            "status": "error",
            "message": `There was an error sending your email. Please try again later or check your config.`
        };
    }
}

// Function to perform Google Custom Search
async function performGoogleSearch(query) {
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/google/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error performing Google search:', error);
        return {
            "status": "error",
            "message": `There was an error performing the Google search. Please try again later.`
        };
    }
}

async function deepResearch(query) {
    const userId = localStorage.getItem('userId');
    const perplexityAlert = document.getElementById('alertContainer');

    perplexityAlert.innerHTML = '';
    perplexityAlert.innerHTML = `                
                        <div class="perplexity-alert">
                        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://brandlogo.org/wp-content/uploads/2024/09/Perplexity-AI-App-Icon-2023.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Performing deep research</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
`

    try {
        const response = await fetch("/perplexity/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Perplexity data:', data);

        perplexityAlert.innerHTML = '';
        perplexityAlert.innerHTML = `
                    <div class="perplexity-alert">
            <div class="perplexity-header">
                <div class="perplexity-icon">
                    <img src="https://brandlogo.org/wp-content/uploads/2024/09/Perplexity-AI-App-Icon-2023.png" alt="Perplexity AI">
                </div>
                <div class="perplexity-title">Your deep research results</div>
                <button class="close-button" onclick="closePerplexityAlert()">×</button>
            </div>
            <div class="perplexity-content">
                ${data.response}
            </div>
        </div>  
        `;
        return data;


    } catch (error) {
        console.error('Error using Perplexity:', error);
        return {
            "status": "error",
            "message": `There was an error performing the Perplexity search. Please try again later.`
        };
    }
}

async function checkKnowledgeBase(query) {
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("https://coreapi.inovasolutions.ai/v1/workflows/run", {
            method: "POST",
            headers: {
                "Authorization": "Bearer app-X8irMeOKWmXoKymsp1sJqXku",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {
                    query: query
                },
                response_mode: "blocking",
                user: userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error checking knowledge base:', error);
        return {
            "status": "error",
            "message": `There was an error checking the knowledge base. Please try again later.`
        };
    }
}

async function scrapeWeb(url) {
    const userId = localStorage.getItem('userId');

    try {
        const response = await fetch("/ai/scrape", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error scraping web:', error);
        return {
            "status": "error",
            "message": `There was an error scraping the webpage. Please try again later.`
        };
    }
}

async function open_google(query) {

    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank');
    return {
        "status": "success",
        "message": `Google opened for: ${query}`
    };
}

//computer control function

// async function executeComputerCommand(command) {

//     console.log(`computer control executing with the following command: ${command}`);

//     // Create a modal container
//     const modal = document.createElement('div');
//     modal.classList.add('animate__animated', 'animate__slideInDown');
//     modal.style.position = 'fixed';
//     modal.style.top = '0';
//     modal.style.left = '0';
//     modal.style.width = '100vw';
//     modal.style.height = '50vh';
//     modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
//     modal.style.display = 'flex';
//     modal.style.justifyContent = 'center';
//     modal.style.alignItems = 'center';
//     modal.style.zIndex = '1000';

//     // Create a popup content
//     const popupContent = document.createElement('div');
//     popupContent.style.width = '90%';
//     popupContent.style.height = '90%';
//     popupContent.style.backgroundColor = 'white';
//     popupContent.style.borderRadius = '10px';
//     popupContent.style.overflow = 'hidden';
//     popupContent.style.position = 'relative';

//     // Create an iframe
//     const iframe = document.createElement('iframe');
//     iframe.src = 'https://ctool.ohanapal.bot/vnc.html?view_only=1&autoconnect=1&resize=scale';
//     iframe.style.width = '100%';
//     iframe.style.height = '100%';
//     iframe.style.border = 'none';

//     // Append iframe to popup content
//     popupContent.appendChild(iframe);

//     // Append popup content to modal
//     modal.appendChild(popupContent);

//     // Append modal to body
//     document.body.appendChild(modal);

//     // Close modal when clicking outside of the popup content
//     modal.addEventListener('click', (event) => {
//         if (event.target === modal) {
//             document.body.removeChild(modal);
//         }
//     });

//     try {
//         const response = await fetch("https://vm.ohanapal.bot/run-command", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ command })
//         });

//         if (!response.ok) {
//             throw new Error('Network response was invalid');
//         }

//         const data = await response.text();
//         console.log(data);


//         const structuredData = {
//             "status": "success",
//             "message": data
//         }

//         // Close the modal before returning data
//         document.body.removeChild(modal);

//         return structuredData;

//     } catch (error) {
//         console.error('Error executing computer command:', error);

//         // Close the modal in case of error
//         document.body.removeChild(modal);

//         return {
//             "status": "error",
//             "message": `There was an error executing the computer command. Please try again later.`
//         };
//     }
// }


async function open_input_box(placeholder) {
    const messageInputContainer = document.getElementById('messageInputContainer');
    const messageInput = document.getElementById('messageInput');
    messageInput.placeholder = placeholder;

    document.getElementById('showInput').click();

    return {
        "status": "success",
        "message": `Input box opened with placeholder: ${placeholder}`
    };
}

async function close_input_box() {
    const messageInputContainer = document.getElementById('messageInputContainer');
    const messageInput = document.getElementById('messageInput');
    messageInput.placeholder = 'Type your message...';

    document.getElementById('showInput').click();

    return {
        "status": "success",
        "message": `Input box closed and placeholder returned to default`
    };
}

async function saveMemory(memory, key, tags) {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email is required to save a memory.');
    }

    const body = {
        memory,
        key,
        tags,
        email
    };

    try {
        const response = await fetch('/memories/create-memory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to save memory');
        }

        const data = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memory updated</div>
        </div>`

        return data;
    } catch (error) {
        console.error('Error saving memory:', error);
        throw error;
    }
}

async function getAllKeys() {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email is required to get all keys.');
    }

    try {
        const response = await fetch(`/memories/all-keys?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch keys');
        }

        const keys = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memory keys retrieved</div>
        </div>`

        return {
            "status": "success",
            "keys": keys
        };
    } catch (error) {
        console.error('Error fetching keys:', error);
        return {
            "status": "error",
            "message": `There was an error fetching the keys. Please try again later.`
        };
    }
}

async function getAllTags() {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email is required to get all keys.');
    }

    try {
        const response = await fetch(`/memories/all-tags?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch keys');
        }

        const keys = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memories loaded...</div>
        </div>`

        return {
            "status": "success",
            "keys": keys
        };
    } catch (error) {
        console.error('Error fetching keys:', error);
        return {
            "status": "error",
            "message": `There was an error fetching the keys. Please try again later.`
        };
    }
}

async function rememberByKey(key) {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email is required to retrieve a memory.');
    }

    try {
        const response = await fetch(`/memories/remember-by-key?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to retrieve memory');
        }

        const data = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memory retrieved for key: ${key}</div>
        </div>`


        return data;
    } catch (error) {
        console.error('Error retrieving memory:', error);
        return {
            "status": "error",
            "message": `There was an error retrieving the memory. Please try again later.`
        };
    }
}

async function rememberByTag(tag) {
    const email = localStorage.getItem('email');
    if (!email) {
        throw new Error('Email is required to retrieve a memory.');
    }

    try {
        const response = await fetch(`/memories/remember-by-tag?email=${encodeURIComponent(email)}&tag=${encodeURIComponent(tag)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to retrieve memory');
        }

        const data = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memories retrieved for tag: ${tag}</div>
        </div>`

        return data;
    } catch (error) {
        console.error('Error retrieving memory:', error);
        return {
            "status": "error",
            "message": `There was an error retrieving the memory. Please try again later.`
        };
    }
}

async function updateMemory(key, updates) {

    const email = localStorage.getItem('email');

    if (!email) {
        throw new Error('Email is required to update a memory.');
    }
    if (!key) {
        throw new Error('Key is required to update a memory.');
    }

    try {
        const response = await fetch('/memories/update-memory', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                key,
                ...updates
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update memory');
        }

        const data = await response.json();

        const alertContainer = document.getElementById('alertContainer');
        alertContainer.innerHTML = '';
        alertContainer.innerHTML = `<div class="memory-alert">
            <div class="memory-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14h16V5H4zm14 2v10H6V7h12zM9 9H7v6h2V9zm4 0h-2v6h2V9zm4 0h-2v6h2V9z"/>
                </svg>
            </div>
            <div class="memory-alert-text">Memory updated for key: ${key}</div>
        </div>`

        return {
            "status": "success",
            "data": data
        };
    } catch (error) {
        console.error('Error updating memory:', error);
        return {
            "status": "error",
            "message": `There was an error updating the memory. Please try again later.`
        };
    }
}

// Add this JavaScript function to handle the close button click
function closePerplexityAlert() {
    const alertElement = document.querySelector('.perplexity-alert');
    if (alertElement) {
        alertElement.remove();
    }
}


