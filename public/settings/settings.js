document.addEventListener('DOMContentLoaded', function() {
    const raspberryPiInput = document.getElementById('raspberry-pi');

    // Load the stored Raspberry Pi URL from local storage
    const storedPiUrl = localStorage.getItem('piUrl');
    if (storedPiUrl) {
        raspberryPiInput.value = storedPiUrl;
    }

    // Save the Raspberry Pi URL to local storage when Enter is pressed
    raspberryPiInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const piUrl = raspberryPiInput.value;
            localStorage.setItem('piUrl', piUrl);
            alert('Raspberry Pi URL saved!');
        }
    });

    // Add logout functionality
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', function() {
        localStorage.clear();
        window.location.href = '/login';
    });
});


// save and load system prompt
const systemPromptInput = document.getElementById('systemPromptInput');
const savePrompt = document.getElementById('savePrompt');

// load system prompt if it exists
if (localStorage.getItem('system-prompt')) {
    systemPromptInput.value = localStorage.getItem('system-prompt');
}

savePrompt.addEventListener('click', function() {
    const systemPrompt = systemPromptInput.value;
    localStorage.setItem('system-prompt', systemPrompt);

    alert('System prompt saved!');
});
