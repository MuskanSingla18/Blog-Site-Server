require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
// Connect to MongoDB
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(
    cors({
         origin: "http://localhost:3000", // allow to server to accept request from different origin
         methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
         credentials: true, // allow session cookie from browser to pass through
   })
  );
  
  const postSchema = new mongoose.Schema ({
    title: String,
    tag: String,
    content: String,
    author: String,
    createdate: String,
  });

  const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
  });

//creating models for mongodb or say collections
const Post = mongoose.model("Post",postSchema);
const User = mongoose.model("User",userSchema);


// For todays date;
Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
  }
  
  // For the time now
  Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
  }



  app.get("/posts", (req, res) => {
    Post.find({}, (err, posts) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve posts" });
      } else {
        res.status(200).json(posts);
      }
    });
  });

  app.get("/users", (req, res) => {
    User.find({}, (err, posts) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve posts" });
      } else {
        res.status(200).json(posts);
      }
    });
  });

  app.post("/compose", (req, res) => {
    var datetime = new Date().today() + " @ " + new Date().timeNow();
    const { title, tag, content } = req.body;
  
    // Create a new Post instance
    const newPost = new Post({
      title,
      tag,
      content,
      author: "Muskan Singla",
      createdate: datetime
    });
  
    // Save the new post to the database
    newPost.save((err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save post" });
      } else {
        res.status(200).json({ message: "Post saved successfully" });
      }
    });
  });

  app.post("/users", (req, res) => {
    const { username,email, password } = req.body;
    const newUser = new User({ username, email, password });
  
    newUser.save((err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create user" });
      } else {
        res.status(201).json({ message: "User created successfully", user });
      }
    });
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      // Find the user in the MongoDB User collection
      const user = await User.findOne({ $or: [{ username }, { email: username }] });
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
  
      // Compare the input password with the hashed password stored in the user object
      const isMatch = (password === user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
  
      // Generate an authentication token
      const token = jwt.sign({ userId: user._id }, "your-secret-key", { expiresIn: "1h" });
  
      res.status(200).json({ token }); // Send the token back to the client
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/posts/:id', async (req, res) => {
    const postId = req.params.id;
  
    try {
      // Find the post by ID and remove it from the database
      const deletedPost = await Post.findByIdAndRemove(postId);
  
      if (!deletedPost) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put("/posts/:id", (req, res) => {
    const postId = req.params.id;
    const { title, tag, content } = req.body;
  
    // Find the post in the database and update its data
    Post.findByIdAndUpdate(
      postId,
      { title, tag, content },
      { new: true, runValidators: true },
      (err, updatedPost) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Failed to update post" });
        }
  
        res.json(updatedPost);
      }
    );
  });
  

  app.listen(9000, function() {
    console.log("Server started on port 9000");
  });