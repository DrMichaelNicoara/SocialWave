var app = new Vue({
    el: '#app', // Mount the Vue instance to the element with id 'app'
    data: {
        following: [], // Array to store the list of users being followed
        followers: [], // Array to store the list of users who are followers
        userId: null, // Initialize userId to null
        showFollowing: false, // Initialize showFollowing to false
        showFollowers: false, // Initialize showFollowers to false
        posts: null,

        // New post data
        user: {},
        currentDate: '',
        title: '',
        content: '',
        imageSrc: '',
        imageData: null
    },
    mounted: function () {
        // Get the URL search parameters
        const urlSearchParams = new URLSearchParams(window.location.search);
        // Extract the value of the 'userId' parameter from the search parameters
        this.userId = urlSearchParams.get('userId');

        axios.get(`http://localhost:3000/users/${this.userId}`)
            .then(response => {
                this.user = response.data;
            })
            .catch(error => {
                console.error(error);
            });
        this.currentDate = new Date();
        this.imageSrc = "resources/upload-image-icon.png";

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
                .then(async response => {
                    // Update the 'posts' data property with the fetched data
                    this.posts = response.data;
                    for (const post of this.posts) {
                        const status = await this.checkFollowStatus(post.Id_user);
                        this.$set(post, 'parentIsFollowed', status.isFollowed);
                        this.$set(post, 'parentFollowButtonText', status.followButtonText);
                    }
                })
                .catch(error => {
                    // Handle API error
                    console.error(error);
                    // Do something with the error, e.g., show an error message to the user
                });
        },
        updateFollowStatus(payload) {
            // filter the posts that match the username of the payload
            const postsToUpdate = this.posts.filter(post => post.Id_user === payload.userId);

            // update the isFollowed and followButtonText properties of the payload object itself
            payload.isFollowed = !payload.isFollowed;
            payload.followButtonText = payload.isFollowed ? 'Followed' : 'Follow';

            // update the isFollowed and followButtonText properties of each post
            postsToUpdate.forEach(post => {
                this.$set(post, 'parentIsFollowed', payload.isFollowed);
                this.$set(post, 'parentFollowButtonText', payload.followButtonText);
            });
        },
        async checkFollowStatus(Id_user) {
            try {
                const response = await axios.get(`http://localhost:3000/following/${app.userId}`);
                const followings = response.data;

                return new Promise((resolve, reject) => {
                    axios.get(`http://localhost:3000/users/${Id_user}`)
                        .then(response => {
                            if (followings.users.some(user => user.username === response.data.username)) {
                                resolve({ isFollowed: true, followButtonText: 'Followed' });
                            } else {
                                resolve({ isFollowed: false, followButtonText: 'Follow' });
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching user data:', error);
                            reject(error);
                        });
                });
            } catch (error) {
                console.error('Error fetching following data:', error);
            }
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
        onImageSelected(event) {
            const file = event.target.files[0];
            this.imageSrc = URL.createObjectURL(file);
            const imageIcon = document.querySelector('.upload-image-icon');
            imageIcon.style.maxHeight = '150px';

            if (this.imageSrc) {
                fetch(this.imageSrc)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onload = () => {
                            this.imageData = reader.result;
                        };
                    });
            }
        },
        autoResize(event) {
            const textarea = event.target;
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight > 200 ? 200 : textarea.scrollHeight) + "px";
        },
        uploadPost() {
            if (!this.userId || !this.title || !this.content) return;

            axios.post("http://localhost:3000/posts", {
                'Id_user': this.userId,
                'title': this.title,
                'content': this.content,
                'image': this.imageData
            })
            .catch(error => {
                console.log(error);
            })

            // Empty the post
            this.title = '';
            this.content = '';
            this.currentDate = new Date();
            this.imageSrc = "resources/upload-image-icon.png";
            const imageIcon = document.querySelector('.upload-image-icon');
            imageIcon.style.maxHeight = '30px';
        }
    }
});


Vue.component('post-block', {
    props: {
        post: Object,
        parentIsFollowed: Boolean,
        parentFollowButtonText: String
    },
    data() {
        return {
            postVotes: 0,
            myVote: 0,
            user: null,
            currentDate: null,
            postUser: {
                id: null,
                username: null,
                avatar: null
            },
            comments: [],
            newCommentContent: null
        }
    },
    created: function () {
        this.user = app.user;
        this.currentDate = new Date();
        const userData = this.getUserData(this.post.Id_user);
        userData.then(data => {
            this.postUser.id = data.Id;
            this.postUser.username = data.username;
            this.postUser.avatar = data.profilePic;
        });
        this.postVotes = this.post.votes;
        this.getComments();
    },
    methods: {
        toggleFollow(Id_post_user) {
            if (!this.parentIsFollowed) {
                // Send the follow request to the server
                axios.post('http://localhost:3000/follow', {
                    userId: Id_post_user,
                    followerId: app.userId
                })
                    .then(() => {
                        if (this.postUser.username && !app.following.some(user => user.username === this.postUser.username)) {
                            app.following.push({ username: this.postUser.username });
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

            // Emit an event to update the follow status in the parent component
            this.$emit('follow-status-changed', { userId: this.postUser.id, isFollowed: this.parentIsFollowed, followButtonText: this.parentFollowButtonText });
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
        async getUserData(Id_post_user) {
            try {
                const response = await axios.get(`http://localhost:3000/users/${Id_post_user}`);
                return response.data;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        upvote() {
            if (this.myVote === 1) {
                this.postVotes--;
                this.myVote = 0;
            } else if (this.myVote === 0) {
                this.postVotes++;
                this.myVote = 1;
            } else {
                this.postVotes += 2;
                this.myVote = 1;
            }
            axios.put(`http://localhost:3000/postVotes/${this.post.Id}`, { votes: this.postVotes })
                .catch(error => {
                    console.error(error);
                });
        },
        downvote() {
            if (this.myVote === -1) {
                this.postVotes++;
                this.myVote = 0;
            } else if (this.myVote === 0) {
                this.postVotes--;
                this.myVote = -1;
            } else {
                this.postVotes -= 2;
                this.myVote = -1;
            }
            axios.put(`http://localhost:3000/postVotes/${this.post.Id}`, { votes: this.postVotes })
                .catch(error => {
                    console.error(error);
                });
        },
        async getComments() {
            try {
                const response = await axios.get(`http://localhost:3000/posts/${this.post.Id}/comments`);
                response.data.forEach(comment => {

                    // Get the user's data
                    const userData = this.getUserData(comment.Id_user);

                    userData.then(user => {
                        this.comments.push({
                            username: user.username,
                            profilePic: user.profilePic,
                            content: comment.content,
                            datetime: comment.datetime
                        });
                    });
                })
            } catch (error) {
                console.error('Error getting comments:', error);
            }
        },
        addComment() {
            // Create a new comment object with the current user's ID, post ID, and content
            const newComment = {
                userId: this.user.Id,
                content: this.newCommentContent
            };

            // Send a POST request to the API with the new comment data
            axios.post(`http://localhost:3000/posts/${this.post.Id}/comments`, newComment)
                .then(response => {
                    // Add the comment in the post's comments
                    this.comments.push({
                        username: this.user.username,
                        profilePic: this.user.profilePic,
                        content: this.newCommentContent,
                        datetime: new Date().toISOString().slice(0, 19).replace('T', ' ') // Current datetime
                    })
                })
                .catch(error => {
                    // Handle error
                    console.error('Error adding comment:', error);
                });
        },
        autoResize(event) {
            const textarea = event.target;
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight > 200 ? 200 : textarea.scrollHeight) + "px";
        }
    },
    template: `
    <div class="post-comment-block">
	    <div class="post-block">
          <div class="post-arrow-section">
            <img src="resources/upvote.png" alt="Upvote" class="post-arrow up-arrow" :class="{ 'upvoted': myVote === 1 }" @click="upvote">
            <span class="vote-count" :class="{ 'blue': myVote !== 0 }">{{ postVotes }}</span>
            <img src="resources/upvote.png" alt="Downvote" class="post-arrow down-arrow rotate-180" :class="{ 'upvoted': myVote === -1 }" @click="downvote">
          </div>
          <div class="post-content-section">
            <div class="post-user-section">
              <div class="post-user-avatar">
                <img class="avatar-img" :src="postUser.avatar ? postUser.avatar : 'resources/default.jpg'" alt="User Avatar">
              </div>
              <div class="post-details">
                <div class="post-user-details">
                    <h4>{{ postUser.username }}</h4>
                    <button class="follow-btn" :class="{ active: parentIsFollowed }" @click="toggleFollow(post.Id_user)">{{ parentFollowButtonText }}</button>
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
	    <div class="comments-section">
	      <!-- Add new comment section -->
	      <div class="post-content-section new-comment-block">
		    <div class="post-user-section">
		      <div class="post-user-avatar">
                <img class="avatar-img" :src="user.profilePic ? user.profilePic : 'resources/default.jpg'" alt="User Avatar">
              </div>
            <div class="post-details">
		      <div class="post-user-details">
			    <h4>{{ user.username }}</h4>
		      </div>
             <div class="post-date-section">
                 <p>Published on {{ formatDate(currentDate) }}</p>
             </div>
            </div>
		    </div>
		    <div class="comment-input-section">
		      <textarea class="post-inputs" v-model="newCommentContent" placeholder="Add a comment" @input="autoResize"></textarea>
		      <button class="upload-post-button" @click="addComment">Post</button>
		    </div>
	      </div>

	      <!-- Existing comments section -->
          <div class="post-content-section comment-block" v-for="comment in comments" :key="comment.Id">
		    <div class="post-user-section">
		      <div class="post-user-avatar">
                <img class="avatar-img" :src="comment.profilePic ? comment.profilePic : 'resources/default.jpg'" alt="User Avatar">
              </div>
            <div class="post-details">
		      <div class="post-user-details">
			    <h4>{{ comment.username }}</h4>
		      </div>
             <div class="post-date-section">
                 <p>Published on {{ formatDate(comment.datetime) }}</p>
             </div>
            </div>
		    </div>
		    <div class="comment-input-section">
              <textarea readonly class="post-inputs comment-text">{{ comment.content }}</textarea>
            </div>
	      </div>
	    </div>
    </div>
  `
});
