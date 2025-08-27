$(document).ready(function() {
    let conversationHistory = [];
    let currentChatId = null;
    const userId = localStorage.getItem('user_id') || crypto.randomUUID();
    localStorage.setItem('user_id', userId);

    // --- Helper Functions ---
    function startNewChat() {
        currentChatId = crypto.randomUUID();
        conversationHistory = [];
        $('#chat-box').empty();
        $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어 ?</div>');
        console.log(`Started new chat with ID: ${currentChatId}`);
    }

    function loadChat(chatData) {
        if (!chatData || !chatData.messages || !chatData.chat_id) {
            console.error("Invalid chat data provided to loadChat");
            return;
        }
        currentChatId = chatData.chat_id;
        conversationHistory = chatData.messages;
        $('#chat-box').empty();
        conversationHistory.forEach(msg => {
            $('#chat-box').append(`<div class="message ${msg.role}-message">${msg.content}</div>`);
        });
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
        $('#memory-modal').hide();
        console.log(`Loaded chat with ID: ${currentChatId}`);
    }

    // --- Event Handlers ---
    $('#send-btn').on('click', sendMessage);
    $('#user-input').on('keypress', function(e) {
        if (e.which === 13) sendMessage();
    });

    $('#new-chat-btn').on('click', startNewChat);

    $('#save-btn').on('click', function() {
        if (conversationHistory.length === 0) {
            alert("저장할 대화 내용이 없습니다.");
            return;
        }
        $.ajax({
            url: '/save-chat',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: userId,
                chat_id: currentChatId,
                history: conversationHistory
            }),
            success: function(response) {
                alert("대화가 저장되었습니다!");
                console.log(response.message);
            },
            error: function() {
                alert("대화 저장에 실패했습니다.");
            }
        });
    });

    $('#memory-btn').on('click', function() {
        $.ajax({
            url: `/get-conversations?user_id=${userId}`,
            type: 'GET',
            success: function(response) {
                const memoryList = $('#memory-list');
                memoryList.empty();
                if (response.conversations && response.conversations.length > 0) {
                    response.conversations.forEach(conv => {
                        const firstUserMessage = conv.messages.find(m => m.role === 'user')?.content || '(No user message)';
                        const convDiv = $(`<div class="conversation-item" data-chat-id="${conv.chat_id}"></div>`);
                        convDiv.append(`<p class="conversation-title">${firstUserMessage.substring(0, 30)}...</p>`);
                        convDiv.append(`<p class="conversation-date">Saved: ${new Date(conv.saved_at).toLocaleString()}</p>`);
                        
                        // Store full conversation data with the element
                        convDiv.data('conversation', conv);

                        convDiv.on('click', function() {
                            const chatData = $(this).data('conversation');
                            loadChat(chatData);
                        });
                        memoryList.append(convDiv);
                    });
                } else {
                    memoryList.append('<p>저장된 대화가 없습니다.</p>');
                }
                $('#memory-modal').show();
            },
            error: function() {
                alert("저장된 대화를 불러오는 데 실패했습니다.");
            }
        });
    });

    // Modal close handlers
    $('.close-btn').on('click', function() {
        $('#memory-modal').hide();
    });
    $(window).on('click', function(event) {
        if ($(event.target).is('#memory-modal')) {
            $('#memory-modal').hide();
        }
    });

    // --- Core Functions ---
    function sendMessage() {
        const userInput = $('#user-input').val();
        if (userInput.trim() === '') return;

        const userMessage = { "role": "user", "content": userInput };
        conversationHistory.push(userMessage);
        $('#chat-box').append(`<div class="message user-message">${userInput}</div>`);
        $('#user-input').val('');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        $('#chat-box').append('<div class="message bot-message typing-indicator">...</div>');
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);

        $.ajax({
            url: '/chat',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                message: userInput,
                history: conversationHistory.slice(0, -1), // Send history *before* the new message
                user_id: userId
            }),
            success: function(response) {
                $('.typing-indicator').remove();
                const botMessage = { "role": "assistant", "content": response.reply };
                conversationHistory.push(botMessage);
                $('#chat-box').append(`<div class="message bot-message">${response.reply}</div>`);
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            },
            error: function() {
                $('.typing-indicator').remove();
                $('#chat-box').append('<div class="message bot-message">죄송해요, 오류가 발생했어요.</div>');
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            }
        });
    }

    // Initial load
    startNewChat();
});
