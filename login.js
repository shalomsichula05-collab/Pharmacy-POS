const form = document.getElementById( "loginForm" );
form.addEventListener( "submit", async event => {
        event.preventDefault();
        const username = document.getElementById("Username").value;
        const password = document.getElementById( "Password").value;
        const message = document.getElementById("loginMessage");
        message.textContent = "Signing in...";
        try {
            console.log(username, password);
            const response = await fetch("/api/auth/login",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        credentials:
                            "include",
                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            const data = await response.json();
            if (!response.ok) {
                message.textContent =
                    data.message || "Login failed";
                return;
            }
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            message.textContent = "Unable to connect to server.";
        }
    }
);