// const uploadFile = require("../middleware/upload");
const express = require("express");
const fileRouter = express.Router();
const path = require("path");
const fs = require("fs");
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


fileRouter.post("/upload",uploadFile, async (req, res) => {
  try {

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
});
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

module.exports = { fileRouter };