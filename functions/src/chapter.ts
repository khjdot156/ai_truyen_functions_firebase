import axios from "axios";
import * as express from "express";
// import { FieldValue } from "firebase-admin/firestore";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import * as cors from "cors";
import { ErrorCode } from "./enums";
// import { Stream } from "stream";
import { AICloudUrl, StoreChapter } from "./const";
import { firestore } from "./index";
export const chapter = express();
// Automatically allow cross-origin requests
chapter.use(cors({ origin: true }));

chapter.get("/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const doc = await firestore.collection(StoreChapter).doc(code).get();
    const data = doc.data();
    res.send(data != undefined ? data : {});
  } catch (error) {
    console.log(error);
    res.status(ErrorCode.common).send(error);
  }
});

chapter.post("/", async (req, res) => {
  try {
    const body = req.body;
    const nameBook = body.nameBook;
    const nameChapter = body.nameChapter;
    const content = body.content;
    const gender = body.gender;
    const fileName = `${nameChapter}-${gender}.wav`;
    const destination = `${nameBook}/${fileName}`;
    const filee = getStorage().bucket().file(destination);
    try {
      const url = await getDownloadURL(filee);
      res.send(url);
    } catch (error) {
      const bodyReq = { input: content, gender: gender };
      const resp = await axios.post(AICloudUrl, bodyReq, {
        responseType: "stream",
      });
      let buffer: any;
      resp.data.on("data", (chuck: any) => {
        buffer += chuck;
      });
      resp.data.on("close", () => {

        console.log('ssssss' + resp.data)
        getStorage()
          .bucket()
          .file(destination)
          .save(buffer)
          .then(async () => {
            const url = await getDownloadURL(filee);
            res.send(url);
          });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(ErrorCode.common).send(error);
  }
});
