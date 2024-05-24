document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('get-started-btn').addEventListener('click', function() {
        var chatBox = document.getElementById('chat-box');
        chatBox.innerHTML += '<div class="message bot-response">Which cuisine do you prefer?</div>';
        displayButtons(["Filipino", "Chinese", "Korean", "Japanese", "Thai", "Indian", "French", "Brazilian", "Mexican"]);
        chatBox.scrollTop = chatBox.scrollHeight;
        this.style.display = 'none';  // Hide the Get Started button
        document.getElementById('message-box').style.display = 'block';  // Show the message box
    });

    document.getElementById('user-input').addEventListener('keypress', function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('send-btn').addEventListener('click', function() {
        sendMessage();
    });

    document.getElementById('button-options').addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON') {
            const message = event.target.textContent;
            sendButtonMessage(message);
            if (message !== 'Recommend another set of dishes') {
                document.getElementById('message-box').style.display = 'block';  // Show the message box after selecting a cuisine
            }
        }
    });
});

function displayButtons(buttons) {
    var buttonOptions = document.getElementById('button-options');
    buttonOptions.innerHTML = '';
    buttons.forEach(function(buttonText) {
        var button = document.createElement('button');
        button.textContent = buttonText;
        button.classList.add('button-option'); // Add class for styling
        buttonOptions.appendChild(button);
    });
    buttonOptions.style.display = 'grid'; // Use grid layout
    buttonOptions.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 columns
    buttonOptions.style.gap = '10px'; // Gap between buttons
}

function sendMessage() {
    var input = document.getElementById('user-input');
    var message = input.value.trim();
    if (message) {
        sendMessageToServer(message);
    }
}

function sendButtonMessage(message) {
    sendMessageToServer(message);
}

function sendMessageToServer(message) {
    var chatBox = document.getElementById('chat-box');
    var buttonOptions = document.getElementById('button-options');

    if (message) {
        $.ajax({
            url: '/send_message',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: message, session_id: 'default' }), // Ensure session_id is included
            success: function(data) {
                console.log("Server Response: ", data);
                chatBox.innerHTML += '<div class="message user-message">' + message + '</div>';
                if (data.message) {
                    chatBox.innerHTML += '<div class="message bot-response">' + data.message + '</div>';
                } else {
                    chatBox.innerHTML += '<div class="message bot-response">Error: Missing message in response</div>';
                }
                chatBox.scrollTop = chatBox.scrollHeight;
                document.getElementById('user-input').value = '';

                if (data.show_buttons && Array.isArray(data.buttons)) {
                    displayButtons(data.buttons);
                } else {
                    buttonOptions.style.display = 'none';
                }

                const recipeName = extractRecipeName(data.message);
                chatBox.setAttribute('data-recipe-name', recipeName || '');
                console.log("Recipe Name: ", recipeName);
            },
            error: function(xhr, status, error) {
                console.error("Error when sending/receiving message: ", error);
                chatBox.innerHTML += '<div class="message error-message">Error: Unable to send message. Please try again later.</div>';
            }
        });
    }
}

function extractRecipeName(text) {
    const match = text.match(/\*\*(.*?)\*\*/);
    return match ? match[1] : "Unknown Recipe";
}

if (!!window.EventSource) {
    var source = new EventSource('/events');
    source.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data.event === "ingredient_detected") {
            var input = document.getElementById('user-input');
            input.value = data.data; // Simplified and categorized ingredients
        }
    };
}
