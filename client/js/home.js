var app = new Vue({
    el: '#app', // Mount the Vue instance to the element with id 'app'
    data: {
        following: [], // Array to store the list of users being followed
        followers: [], // Array to store the list of users who are followers
        userId: null, // Initialize userId to null
        showFollowing: false, // Initialize showFollowing to false
        showFollowers: false, // Initialize showFollowers to false
        isFollowed: false,
        FollowButtonText: "Follow"
    },
    mounted: function () {
        // Get the URL search parameters
        const urlSearchParams = new URLSearchParams(window.location.search);
        // Extract the value of the 'userId' parameter from the search parameters
        this.userId = urlSearchParams.get('userId');

        // Fetch the list of following and followers data from the API endpoints
        fetch(`http://localhost:3000/following/${this.userId}`) // Use this.userId to access the extracted user id
            .then(response => response.json())
            .then(data => {
                this.following = data.users; // Update the 'following' data property with the fetched data
            })
            .catch(error => {
                console.error('Error fetching following data:', error);
            });

        fetch(`http://localhost:3000/followers/${this.userId}`) // Use this.userId to access the extracted user id
            .then(response => response.json())
            .then(data => {
                this.followers = data.users; // Update the 'followers' data property with the fetched data
            })
            .catch(error => {
                console.error('Error fetching followers data:', error);
            });

        // Update the list of posts
        updatePosts();
    },
    methods: {
        toggleFollowing: function () {
            this.showFollowing = !this.showFollowing; // Toggle the value of showFollowing
            console.log(this.showFollowing);
        },
        toggleFollowers: function () {
            this.showFollowers = !this.showFollowers; // Toggle the value of showFollowers
        },
        toggleFollow() {
            this.isFollowed = !this.isFollowed; // Toggle the state of the follow button
            this.FollowButtonText = this.isFollowed ? 'Followed' : 'Follow';
        },
        updatePosts() {
            const userId = this.userId; // Assuming this.userId is already defined in your Vue component's data
            const apiUrl = `/posts/notfrom/${userId}`; // API endpoint URL
            axios.get(apiUrl)
                .then(response => {
                    // Handle successful API response
                    const results = response.data;
                    
                })
                .catch(error => {
                    // Handle API error
                    console.error(error);
                    // Do something with the error, e.g., show an error message to the user
                });
        }
    }
});
