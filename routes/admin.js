const express = require("express");
const adminRouter = express.Router();
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
var db = admin.database();
var adminRef = db.ref("admin");

adminRouter.get("/get", async (req, res) => {
  getAdminData()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

adminRouter.post("/save", async (req, res) => {
  const bodyData = req.body;
  adminRef.push(bodyData, (err) => {
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

adminRouter.put("/update", (req, res) => {
  const bodyData = req.body;
  adminRef
    .orderByChild("adminid")
    .equalTo(bodyData.adminid)
    .once("value")
    .then(function (snapshot) {
      snapshot.forEach((childSnapshot) => {
        //remove each child
        let val = childSnapshot.val();
        if (val.adminid == bodyData.adminid) {
          adminRef.child(childSnapshot.key).remove();
          adminRef.push(bodyData, (err) => {
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

adminRouter.delete("/delete", (req, res) => {
  let adminId = req.query.id;
  adminId = typeof adminId === "string" ? +adminId : adminId;
  adminRef
    .orderByChild("adminid")
    .equalTo(adminId)
    .once("value")
    .then(function (snapshot) {
      snapshot.forEach((childSnapshot) => {
        //remove each child
        let val = childSnapshot.val();
        if (val.adminid == adminId) {
          adminRef.child(childSnapshot.key).remove();
          res.status(200).json({
            success: true,
            message: "successfully deleted",
          });
        }
      });
    });
});

const getAdminData = function () {
  return new Promise((resolve, reject) => {
    try {
      adminRef.once("value", function (snap) {
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

module.exports = { adminRouter, getAdminData };
