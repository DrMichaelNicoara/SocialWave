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
                id: null,
                username: null,
                avatar: null
            }
        }
    },
    mounted: function() {
        const userData = this.getPostData(this.post.Id_user);
        userData.then(data => {
            this.user.id = data.Id;
            this.user.username = data.username;
            this.user.avatar = data.profilePic;
        });

        fetch(`http://localhost:3000/following/${app.userId}`)
            .then(response => response.json())
            .then(followings => {
                if (followings.users.some(user => user.username === this.user.username)) {
                    this.isFollowed = true;
                    this.followButtonText = 'Followed';
                }
            })
            .catch(error => {
                console.error('Error fetching following data:', error);
            });
    },
    methods: {
        toggleFollow(Id_post_user) {
            if (this.followButtonText === 'Follow') {
                // Send the follow request to the server
                axios.post('http://localhost:3000/follow', {
                   data: {
                        userId: Id_post_user,
                        followerId: app.userId
                    }
                })
                    .then(response => {
                        if (this.user.username && !app.following.some(user => user.username === this.user.username)) {
                            app.following.push({ username: this.user.username });
                        }
                        else {
                            throw new Error('Post user username is null');
                        }
                    })
                    .catch(error => {
                        console.log(error); // handle the error
                    });
            }
            else {
                axios.delete('http://localhost:3000/follow', {
                    data: {
                        userId: Id_post_user,
                        followerId: app.userId
                    }
                })
                    .then(() => {
                        axios.get(`http://localhost:3000/users/${Id_post_user}`)
                            .then(response => {
                                const index = app.following.findIndex(user => user.username === response.data.username);

                                // Remove the dictionary from the list using the splice() method
                                if (index !== -1) {
                                    app.following.splice(index, 1);
                                }
                            })
                    })
                    .catch(error => {
                        console.log(error); // handle the error
                    });
            }
            this.isFollowed = !this.isFollowed;
            this.followButtonText = this.isFollowed ? 'Followed' : 'Follow';
        },
        formatDate(datetime) {
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: 'numeric',
                minute: 'numeric'
            };
            return new Date(datetime).toLocaleString('en-US', options);
        },
        async getPostData(Id_post_user) {
            try {
                const response = await axios.get(`http://localhost:3000/users/${Id_post_user}`);
                return response.data;
            } catch (error) {
                console.log(error);
                throw error;
            }
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
                <h4>{{ user.username }}</h4>
                <button class="follow-btn" :class="{ active: isFollowed }" @click="toggleFollow(post.Id_user)">{{ followButtonText }}</button>
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
          <img class="post-image" :src="post.image" alt="Post Image">
        </div>
      </div>
    </div>
  `
});
