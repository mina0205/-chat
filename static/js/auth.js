$(document).ready(function() {
    
    // Handle Registration Form Submission
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();

        $.ajax({
            url: '/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email, password: password }),
            success: function(response) {
                alert(response.message);
                window.location.href = '/login-page'; // Redirect to login on success
            },
            error: function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Registration failed.';
                $('#error-message').text(error).show();
            }
        });
    });

    // Handle Login Form Submission
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();

        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email, password: password }),
            success: function(response) {
                // Store the token and redirect to the main chat page
                localStorage.setItem('auth_token', response.token);
                window.location.href = '/'; // Redirect to the main chat page
            },
            error: function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Login failed.';
                $('#error-message').text(error).show();
            }
        });
    });
});