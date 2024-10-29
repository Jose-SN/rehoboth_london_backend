// const uploadFile = require("../middleware/upload");
const express = require("express");
const fileRouter = express.Router();
const path = require("path");
const fs = require("fs");
const admin = require('firebase-admin');
// const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const baseUrl = 'http://localhost:3000/public/'

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const filepath = path.resolve(__dirname, "../public/");
    if (fs.existsSync(filepath)) {
      cb(null, filepath);
    }
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory for easier Firebase upload
});
// Get a reference to the bucket
const bucket = admin.storage().bucket();

// fileRouter.post("/upload",uploadFile, async (req, res) => {
//   try {

//     if (req.file == undefined) {
//       return res.status(400).send({ message: "Please upload a file!" });
//     }

//     res.status(200).send({
//       message: "Uploaded the file successfully: " + req.file.originalname,
//     });
//   } catch (err) {
//     res.status(500).send({
//       message: `Could not upload the file: ${req.file.originalname}. ${err}`,
//     });
//   }
// });
fileRouter.get("/files", (req, res) => {
  const filepath = path.resolve(__dirname, "../public/");
  fs.readdir(filepath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
});

fileRouter.get("/files/:name", (req, res) => {
  const fileName = req.params.name;
  const filepath = path.resolve(__dirname, "../public/", fileName);

  res.download(filepath, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
});

// File upload endpoint
fileRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Ensure a file is uploaded
    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    // Define file destination path in Firebase Storage
    const destination = `members/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(destination);

    // Create a stream for file upload
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000', // Optional cache control settings
      },
    });

    // Handle stream events
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).send({
        message: `Could not upload the file: ${req.file.originalname}. ${error}`,
      });
    });

    stream.on('finish', async () => {
      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      console.log('File uploaded:', publicUrl);

      // Send the public URL as the response
      res.status(200).json({ url: publicUrl, message: "Uploaded the file successfully: " + req.file.originalname });
      
    });

    // Pipe the buffer to the stream to upload the file
    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Internal server error');
  }
});


module.exports = { fileRouter };