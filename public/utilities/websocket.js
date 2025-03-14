let websocket = null;

function connectWebSocket() {
    console.log('Attempting to connect to WebSocket...');
    
    websocket = new WebSocket('wss://vm.ohanapal.bot');

    websocket.onopen = () => {
        console.log('WebSocket connection established');
        // send command to websocket
        websocket.send(`{"type": "start-session"}`);
    };

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://cdn-icons-png.flaticon.com/512/668/668757.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Websocket Connection established</div>
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

    // websocket.onmessage = (event) => {
    //     console.log('Received message:', event.data);
    //     // Handle incoming messages here
    // };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        reconnectWebSocket();
    };
}

async function reconnectWebSocket() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://cdn-icons-png.flaticon.com/512/668/668757.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Websocket Connection lost. Attempting to reconnect</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `
    console.log('Reconnecting to WebSocket...');
    connectWebSocket();
}

// new computer command function
async function executeComputerCommand(command) {
    console.log(`computer control executing with the following command: ${command}`);

    // Check if modal is already open
    const modal = document.getElementById('computer-control-modal');
    if (!modal) {
        // Create a modal container
        const modal = document.createElement('div');
        modal.id = 'computer-control-modal';
        modal.classList.add('animate__animated', 'animate__slideInDown');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '50vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';

        // Create a popup content
        const popupContent = document.createElement('div');
        popupContent.style.width = '90%';
        popupContent.style.height = '90%';
        popupContent.style.backgroundColor = 'white';
        popupContent.style.borderRadius = '10px';
        popupContent.style.overflow = 'hidden';
        popupContent.style.position = 'relative';

        // Create an iframe
        const iframe = document.createElement('iframe');
        iframe.src = 'https://ctool.ohanapal.bot/?view_only=1&autoconnect=1&resize=scale';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Append iframe to popup content
        popupContent.appendChild(iframe);

        // Append popup content to modal
        modal.appendChild(popupContent);

        // Append modal to body
        document.body.appendChild(modal);

        // Close modal when clicking outside of the popup content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }


    // Return a promise that resolves when a result message is received
    return new Promise((resolve, reject) => {
        websocket.send(`{"type": "command", "command": "${command}"}`);

        websocket.onmessage = (event) => {
            console.log('Received message:', event.data);
            const parsedData = JSON.parse(event.data);
            if (parsedData.type === 'result') {
                console.log('Result:', parsedData.message);
                resolve({
                    status: 'success',
                    message: parsedData.message
                });
            }
        };

        websocket.onerror = (error) => {
            reject(error);
        };
    });
}


async function activateOhanaAct() {
    console.log('Activating Ohana Act...');

    const modal = document.getElementById('computer-control-modal');
    if (!modal) {
        // Create a modal container
        const modal = document.createElement('div');
        modal.id = 'computer-control-modal';
        modal.classList.add('animate__animated', 'animate__slideInDown');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '50vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';

        // Create a popup content
        const popupContent = document.createElement('div');
        popupContent.style.width = '90%';
        popupContent.style.height = '90%';
        popupContent.style.backgroundColor = 'white';
        popupContent.style.borderRadius = '10px';
        popupContent.style.overflow = 'hidden';
        popupContent.style.position = 'relative';

        // Create an iframe
        const iframe = document.createElement('iframe');
        iframe.src = 'https://ctool.ohanapal.bot/?view_only=1&autoconnect=1&resize=scale';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Append iframe to popup content
        popupContent.appendChild(iframe);

        // Append popup content to modal
        modal.appendChild(popupContent);

        // Append modal to body
        document.body.appendChild(modal);

        // Close modal when clicking outside of the popup content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    localStorage.setItem('mode', 'act');

    open_input_box('Enter a command to control the computer'); 
    
    return {
        "status": "success",
        "message": `Ohana Act activated`
    };
};

async function closeOhanaAct() {
    console.log('Closing Ohana Act...');

    //remove computer-control-modal
    const modal = document.getElementById('computer-control-modal');
    if (modal) {
        document.body.removeChild(modal);
    }

    localStorage.removeItem('mode');

    close_input_box();

    return {
        "status": "success",
        "message": `Ohana Act closed`
    };
}

async function sendWebsocketMessage(message) {
    console.log('Sending message to websocket: ' + message);
    const command = message.trim();
    const cleanCommand = command.replace(/\s+/g, ' ');

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = '';
    alertContainer.innerHTML = `
      <div class="perplexity-alert">
        <div class="perplexity-header">
            <div class="perplexity-icon">
                <img src="https://cdn-icons-png.flaticon.com/512/668/668757.png" alt="Perplexity AI">
            </div>
            <div class="perplexity-title">Executing command on your computer</div>
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                 <div class="dot"></div>
            </div>
         </div>
        </div>        
    `

    // Return a promise that resolves when a result message is received
    return new Promise((resolve, reject) => {
    websocket.send(`{"type": "command", "command": "${cleanCommand}"}`);

        websocket.onmessage = (event) => {
            console.log('Received message:', event.data);
            const parsedData = JSON.parse(event.data);
            if (parsedData.type === 'result') {
                console.log('Result:', parsedData.message);
                alertContainer.innerHTML = '';
                resolve({
                    status: 'success',
                    message: parsedData.message
                });
            }
        };

        websocket.onerror = (error) => {
            reject(error);
        };
    });
};




document.addEventListener('DOMContentLoaded', connectWebSocket);

