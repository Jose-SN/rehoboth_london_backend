const express = require("express");
const memberRouter = express.Router();
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("members");

memberRouter.get("/get", async (req, res) => {
  getMemberData()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

memberRouter.post("/save", async (req, res) => {
  const bodyData = req.body;
  userRef.push(bodyData, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).json({
        success: true,
        message: "successfully added",
        data: bodyData,
      });
    }
  });
});

memberRouter.put("/update", (req, res) => {
  const bodyData = req.body;
  userRef
    .orderByChild("memberid")
    .equalTo(bodyData.memberid)
    .once("value")
    .then(function (snapshot) {
      snapshot.forEach((childSnapshot) => {
        //remove each child
        let val = childSnapshot.val();
        if (val.memberid == bodyData.memberid) {
          userRef.child(childSnapshot.key).remove();
          userRef.push(bodyData, (err) => {
            if (err) {
              res.status(400).send(err);
            } else {
              res.status(200).json({
                success: true,
                message: "successfully updated",
                data: bodyData,
              });
            }
          });
        }
      });
    });
});

memberRouter.delete("/delete", (req, res) => {
  let memberId = req.query.id;
  memberId = typeof memberId === "string" ? +memberId : memberId;
  userRef
    .orderByChild("memberid")
    .equalTo(memberId)
    .once("value")
    .then(function (snapshot) {
      snapshot.forEach((childSnapshot) => {
        //remove each child
        let val = childSnapshot.val();
        if (val.memberid == memberId) {
          userRef.child(childSnapshot.key).remove();
          res.status(200).json({
            success: true,
            message: "successfully deleted",
          });
        }
      });
    });
});

const getMemberData = function () {
  return new Promise((resolve, reject) => {
    try {
      userRef.once("value", function (snap) {
        let data = [];
        if (Array.isArray(snap.val())) {
          data = snap.val();
        } else if (
          typeof snap.val() == "object" &&
          Object.values(snap.val()).length
        ) {
          data = Object.values(snap.val());
        }
        resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { memberRouter, getMemberData };
