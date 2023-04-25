const Twit = require("twit");
const fs = require("fs");
const cron = require('node-cron');

require('dotenv').config();





const T = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000,
});


const hashtag = '#Web3';
const followLimit = 10;
const unfollowLimit = 10;





const tweets = fs.readFileSync("tweets.txt").toString().split("\n");

function tweet() {
    const tweet = tweets[Math.floor(Math.random() * tweets.length)];
    T.post("statuses/update", {status: tweet}, (err, data, response) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Tweeted:", tweet)
        }
    })
}

// Run tweet function every 3 hours
cron.schedule('0 */3 * * *', () => {
  tweet();
});

//setInterval(tweet, 17280 * 60 * 1000);

// Unfollow users who don't follow you every day, twice a day

  // Function to unfollow users who are not following you back
function unfollowNonFollowers(maxUnfollows) {
    // Get the list of users you are following
    T.get('friends/list', { count: 200 }, function(err, data, response) {
      if (!err) {
        const friends = data.users;
        let unfollowedCount = 0;
        // Loop through each friend and check if they are following you back
        for (let i = 0; i < friends.length; i++) {
          const friend = friends[i];
          T.get('friendships/lookup', { screen_name: friend.screen_name }, function(err, data, response) {
            if (!err) {
              const relationship = data[0];
              // If the friend isn't following you back, unfollow them
              if (!relationship.connections.includes('followed_by')) {
                T.post('friendships/destroy', { user_id: friend.id_str }, function(err, data, response) {
                  if (!err) {
                    console.log('Unfollowed user:', friend.screen_name);
                    unfollowedCount++;
                    // Stop unfollowing if we have reached the limit
                    if (unfollowedCount >= maxUnfollows) {
                      return;
                    }
                  } else {
                    console.log('Error unfollowing user:', friend.screen_name, err);
                  }
                });
              }
            } else {
              console.log('Error checking relationship with user:', friend.screen_name, err);
            }
          });
          // Stop looping if we have reached the limit
          if (unfollowedCount >= maxUnfollows) {
            break;
          }
        }
      } else {
        console.log('Error getting list of friends:', err);
      }
    });
  }

  // Run unfollowNonFollowers function every day, twice a day
cron.schedule('0 */12 * * *', () => {
  unfollowNonFollowers(5);
});

  
  // Call the unfollowNonFollowers function every day, twice a day
 // setInterval(function() {
 //   unfollowNonFollowers(5);
 // }, 12.5 * 60 * 60 * 1000);
 // setInterval(function() {
 //   unfollowNonFollowers(10);
 // }, 24 * 60 * 60 * 1000);
  


//Like tweets with given hashtag
function likeTweetIfHashtag(tweetId, hashtag) {
    T.get('statuses/show/:id', { id: tweetId }, function(err, data, response) {
        if (!err && data && data.text && data.text.includes(hashtag)) {
            console.log('Tweet contains hashtag:', tweetId);
        T.post('favorites/create', { id: tweetId }, function(err, data, response) {
            if(err){
                console.log('Error liking tweet:', tweetId, err);
            } else {
          console.log('Liked tweet:', tweetId);
            }
        });
  
       
      }
    });
  }

  cron.schedule('*/5 * * * *', function() {
    T.get('search/tweets', { q: hashtag, count: 5 }, function(err, data, response) {
        const tweets = data.statuses;

        tweets.forEach(function(tweet) {
            const tweetId = tweet.id_str;
            likeTweetIfHashtag(tweetId, hashtag);
        });
    });
});

  /*setInterval(function() {
    T.get('search/tweets', { q: hashtag, count: 5 }, function(err, data, response) {
      const tweets = data.statuses;
      
  
      tweets.forEach(function(tweet) {
        const tweetId = tweet.id_str;
        likeTweetIfHashtag(tweetId, hashtag);
      });
    });
  }, 5 * 60 * 1000);*/
  
 

// Follow up to 10 users every hour who tweet about a certain hashtag

    function follow() {
    T.get('search/tweets', { q: hashtag }, function(err, data, response) {
      const tweets = data.statuses;

     
      const usersToFollow = tweets.slice(0, followLimit);
  
      usersToFollow.forEach(user => {
        const userId = user.user.id_str;
        T.post('friendships/create', { user_id: userId }, function(err, data, response) {
          console.log('Followed user:', userId);
        });
      });
    });
  };


// Run the follow function every hour
cron.schedule('0 * * * *', follow);

  //setInterval(follow, 60 * 60 * 1000);

