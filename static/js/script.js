let conversationHistory = []; // New: Array to store history

$(document).ready(function() {
    // Add initial greeting from bot if chatbox is empty
    if ($('#chat-box').children().length === 0) {
        $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어?</div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    }

    // New Chat Button click handler
    $('#new-chat-btn').on('click', function() {
        $('#chat-box').empty(); // Clear all messages
        conversationHistory = []; // New: Clear history on new chat
        $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어?</div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    });

    function sendMessage() {
        const userInput = $('#user-input').val();
        if (userInput.trim() === '') {
            return;
        }

        // Add user message to history and display
        conversationHistory.push({ "role": "user", "content": userInput }); // New
        $('#chat-box').append(`<div class="message user-message">${userInput}</div>`);
        $('#user-input').val('');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        // Add typing indicator
        $('#chat-box').append('<div class="message bot-message typing-indicator">...</div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        // Send message to backend
        $.ajax({
            url: '/chat',
            type: 'POST',
            contentType: 'application/json',
            // New: Send the entire conversation history
            data: JSON.stringify({ message: userInput, history: conversationHistory }),
            success: function(response) {
                $('.typing-indicator').remove();
                const botMessage = response.reply;
                conversationHistory.push({ "role": "assistant", "content": botMessage }); // New: Add bot message to history
                $('#chat-box').append(`<div class="message bot-message">${botMessage}</div>`);
                // Scroll to bottom
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            },
            error: function() {
                $('.typing-indicator').remove();
                $('#chat-box').append('<div class="message bot-message">죄송해요, 오류가 발생했어요.</div>');
                // Scroll to bottom
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            }
        });
    }

    $('#send-btn').on('click', sendMessage);

    $('#user-input').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            sendMessage();
        }
    });
});
