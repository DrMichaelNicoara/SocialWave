new Vue({
    el: '#app',
    data: {
        username: '',
        password: '',
        showError: false
    },
    methods: {
        login() {
            // Make an HTTP POST request to the server
            axios.post('http://localhost:3000/login', {
                username: this.username,
                password: this.password
            })
                .then(response => {
                    console.log(response);
                    // Handle the response from the server
                    if (response.data.error === '') {
                        // Redirect to home page if login is successful
                        window.location.href = 'home.html';
                    } else if (response.data.error === "User doesn't exist") {
                        // Highlight inputs
                        this.showError = true;
                        setTimeout(() => {
                            this.showError = false;
                        }, 2000);
                    }
                    else {
                        // Server Error
                        throw new Error(response.data.error);
                    }
                })
                .catch(error => {
                    // Handle error by showing in a popup
                    Swal.fire({
                        title: 'Error',
                        text: error.message,
                        type: 'error',
                        confirmButtonText: 'OK'
                    });
                });
        }
    }
});
