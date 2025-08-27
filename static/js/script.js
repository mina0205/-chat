$(document).ready(function() {
    let conversationHistory = [];
    const userId = localStorage.getItem('user_id') || crypto.randomUUID();
    localStorage.setItem('user_id', userId);

    // Initial Greeting
    if ($('#chat-box').children().length === 0) {
        $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어 ?</div>');
    }

    // --- Event Handlers ---

    // Send message handler
    $('#send-btn').on('click', sendMessage);
    $('#user-input').on('keypress', function(e) {
        if (e.which === 13) sendMessage();
    });

    // New Chat handler
    $('#new-chat-btn').on('click', function() {
        $.ajax({
            url: '/new-chat',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ user_id: userId }),
            success: function(response) {
                console.log(response.message);
                $('#chat-box').empty();
                conversationHistory = [];
                $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어 ?</div>');
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            },
            error: function() {
                console.error("Failed to delete conversations on the server.");
                alert("서버에서 대화 기록을 삭제하는 데 실패했습니다. UI만 초기화합니다.");
                $('#chat-box').empty();
                conversationHistory = [];
                $('#chat-box').append('<div class="message bot-message">안녕! 심심할 땐 나 심심이랑 놀자☺️ 뭐하고 놀고싶어 ?</div>');
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            }
        });
    });

    // Save Chat handler
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

    // Memory button handler
    $('#memory-btn').on('click', function() {
        $.ajax({
            url: `/get-conversations?user_id=${userId}`,
            type: 'GET',
            success: function(response) {
                const memoryList = $('#memory-list');
                memoryList.empty();
                if (response.conversations && response.conversations.length > 0) {
                    response.conversations.forEach(conv => {
                        const convDiv = $('<div class="conversation"></div>');
                        // Add a timestamp
                        convDiv.append(`<p class="timestamp">Saved at: ${new Date(conv.saved_at).toLocaleString()}</p>`);
                        conv.messages.forEach(msg => {
                            convDiv.append(`<div class="message ${msg.role}-message">${msg.content}</div>`);
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
        if (userInput.trim() === '') {
            return;
        }

        conversationHistory.push({ "role": "user", "content": userInput });
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
                history: conversationHistory,
                user_id: userId
            }),
            success: function(response) {
                $('.typing-indicator').remove();
                const botMessage = response.reply;
                conversationHistory.push({ "role": "assistant", "content": botMessage });
                $('#chat-box').append(`<div class="message bot-message">${botMessage}</div>`);
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            },
            error: function() {
                $('.typing-indicator').remove();
                $('#chat-box').append('<div class="message bot-message">죄송해요, 오류가 발생했어요.</div>');
                $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
            }
        });
    }
});