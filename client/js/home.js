var app = new Vue({
    el: '#app', // Mount the Vue instance to the element with id 'app'
    data: {
        following: [], // Array to store the list of users being followed
        followers: [], // Array to store the list of users who are followers
        userId: null, // Initialize userId to null
        showFollowing: false, // Initialize showFollowing to false
        showFollowers: false, // Initialize showFollowers to false
        isFollowed: false,
        FollowButtonText: "Follow",
        posts: null
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
        this.updatePosts();
    },
    methods: {
        toggleFollowing: function () {
            this.showFollowing = !this.showFollowing; // Toggle the value of showFollowing
        },
        toggleFollowers: function () {
            this.showFollowers = !this.showFollowers; // Toggle the value of showFollowers
        },
        toggleFollow() {
            this.isFollowed = !this.isFollowed; // Toggle the state of the follow button
            this.FollowButtonText = this.isFollowed ? 'Followed' : 'Follow';
            this.$emit('follow-toggled', this.isFollowed);
        },
        updatePosts() {
            const userId = this.userId;
            axios.get(`http://localhost:3000/posts/notfrom/${userId}`)
                .then(response => {
                    // Handle successful API response
                    const posts = response.data;
                    // Update the 'posts' data property with the fetched data
                    this.posts = posts;
                })
                .catch(error => {
                    // Handle API error
                    console.error(error);
                    // Do something with the error, e.g., show an error message to the user
                });
        },
        onFollowToggled(isFollowed) {
            console.log('Follow button toggled:', isFollowed);
        }
    }
});


Vue.component('post-block', {
    props: ['post'],
    data() {
        return {
            isFollowed: false,
            followButtonText: 'Follow',
            user: {
                name: null,
                avatar: null
            }
        }
    },
    created() {
        axios.get(`http://localhost:3000/users/${app.userId}`)
            .then(response => {
                this.user = {
                    name: response.data ? response.data.username : null,
                    avatar: response.data ? response.data.profilePic : null
                }
            })
            .catch(error => {
                console.log(error);
            })
    },
    methods: {
        toggleFollow() {
            this.isFollowed = !this.isFollowed;
            this.followButtonText = this.isFollowed ? 'Followed' : 'Follow';
        },
        formatDate: function (datetime) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
                minute: 'numeric'
            };
            return new Date(datetime).toLocaleString('en-US', options);
        },
        getPostImage(post) {
            return post.image;
        }
    },
    template: `
    <div class="post-block">
      <div class="post-arrow-section">
        <img src="resources/upvote.png" alt="Upvote" class="post-arrow up-arrow">
        <img src="resources/upvote.png" alt="Downvote" class="post-arrow down-arrow rotate-180">
      </div>
      <div class="post-content-section">
        <div class="post-user-section">
          <div class="post-user-avatar">
            <img class="avatar-img" :src="user.avatar ? user.avatar : 'resources/default.jpg'" alt="User Avatar">
          </div>
          <div class="post-details">
            <div class="post-user-details">
                <h4>{{ user.name }}</h4>
                <button class="follow-btn" :class="{ active: isFollowed }" @click="toggleFollow">{{ followButtonText }}</button>
            </div>
            <div class="post-date-section">
              <p>Published on {{ formatDate(post.datetime) }}</p>
            </div>
          </div>
        </div>
        <div class="post-title-section">
          <h2>{{ post.title }}</h2>
        </div>
        <div class="post-content">
          <p class="post-text">{{ post.content }}</p>
        </div>
        <div class="post-image-section" v-if="post.image !== null">
          <img class="post-image" :src="getPostImage(post)" alt="Post Image">
        </div>
      </div>
    </div>
  `
});
