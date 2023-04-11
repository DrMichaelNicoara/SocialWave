// Import Vue-Sweetalert2 plugin
import VueSweetalert2 from '../node_modules/vue-sweetalert2';

// Register Vue-Sweetalert2 plugin
Vue.use(VueSweetalert2);

new Vue({
    el: '#app',
    data: {
        username: '',
        password: ''
    },
    methods: {
        login() {
            // Make an HTTP POST request to the server
            axios.post('http://localhost:3000/login', {
                username: this.username,
                password: this.password
            })
                .then(response => {
                    this.$swal({
                        title: 'Error',
                        text: 'Failed to login. Internal Server Error.',
                        type: 'error',
                        confirmButtonText: 'OK'
                    });
                    // Handle the response from the server
                    if (response.data.success === true) {
                        // Redirect to home page if login is successful
                        window.location.href = 'home.html';
                    } else {
                        console.log("USER DOESN'T EXIST");
                    }
                })
                .catch(error => {
                    // Handle error by showing in a MessageBox
                    this.$swal({
                        title: 'Error',
                        text: 'Failed to login. Internal Server Error.',
                        type: 'error',
                        confirmButtonText: 'OK'
                    });
                });
        }
    }
});
