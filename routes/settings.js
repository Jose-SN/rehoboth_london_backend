const express = require("express");
const adminRouter = express.Router();
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("admin");

adminRouter.get("/get", (req, res) => {
  getadminData()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

adminRouter.put("/update", (req, res) => {
  const bodyData = req.body;
  userRef.update(bodyData).then(() => {
    // Data saved successfully!
    res.status(200).json({
      success: true,
      message: "successfully updated"
    });
  })
  .catch((error) => {
    // The write failed...
    res.status(400).send(err);
  });
});


const getadminData = function () {
  return new Promise((resolve, reject) => {
    try {
      userRef.once("value", function (snap) {
        let data = {};
        data = snap.val();
        resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { adminRouter, getadminData };
