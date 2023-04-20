var app = new Vue({
    el: '.signup-box',
    data: {
        // Initialize data properties for form fields
        profilePic: null,
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        phoneNumber: '',
        username: '',
        password: '',
        confirmPassword: '',
        errors: {} // Added property to store form field error messages
    },
    methods: {
        onFileChange(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                this.profilePic = reader.result;
            };
        },
        submitForm: function () {
            // Reset password match status and form field error messages
            this.errors = {
                'profilePic': false,
                'firstName': false,
                'lastName': false,
                'email': false,
                'address': false,
                'phoneNumber': false,
                'username': false,
                'password': false
            };

            // Check if passwords match
            if (this.password !== this.confirmPassword) {
                document.getElementById('errorMessage').textContent = "Passwords do not match";
                this.errors['password'] = true;
                setTimeout(() => {
                    this.errors['password'] = false;
                }, 2000);
                return; // Abort form submission
            }

            // Create a dict to store form data
            var formData = {
                profilePic: this.profilePic,
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                address: this.address,
                phoneNumber: this.phoneNumber,
                username: this.username,
                password: this.password
            };

            // Send a POST request to the server using Axios
            axios.post('http://localhost:3000/signup', formData)
            .then(response => {
                if (response.data.error === '') {
                    // If error is empty, change page to home.html
                    window.location.href = `home.html?userId=${response.data.userId}`;
                } else {
                    const errorMessages = response.data.error.split(', ');
                    document.getElementById('errorMessage').textContent = errorMessages.join("\n");
                    // If error is not empty, handle form field error messages
                    errorMessages.forEach(errorMessage => {
                        if (errorMessage.includes('is required')) {
                            // Handle required field error
                            const field = errorMessage.split(' ')[0];
                            this.errors[field] = true;
                            setTimeout(() => {
                                this.errors[field] = false;
                            }, 2000);
                        } else if (errorMessage === 'Profile picture must have a jpg, jpeg, or png extension.') {
                            // Handle profile picture extension error
                            this.errors['profilePic'] = true;
                            setTimeout(() => {
                                this.errors['profilePic'] = false;
                            }, 2000);
                        } else if (errorMessage.includes('must only contain letters or spaces.')) {
                            // Handle firstName and lastName format error
                            const field = errorMessage.split(' ')[0];
                            this.errors[field] = true;
                            setTimeout(() => {
                                this.errors[field] = false;
                            }, 2000);
                        } else if (errorMessage === 'Username already exists.') {
                            // Handle username duplicate error
                            this.errors['username'] = true;
                            setTimeout(() => {
                                this.errors['username'] = false;
                            }, 2000);
                        } else if (errorMessage === 'Email is not valid.') {
                            this.errors['email'] = true;
                            setTimeout(() => {
                                this.errors['email'] = false;
                            }, 2000);
                        } else if (errorMessage === "Phone number must be 10 digits long and contain only digits.") {
                            this.errors['phoneNumber'] = true;
                            setTimeout(() => {
                                this.errors['phoneNumber'] = false;
                            }, 2000);
                        }
                        else {
                            // Throw new Error for any other error messages
                            throw new Error(errorMessage);
                        }
                    });
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