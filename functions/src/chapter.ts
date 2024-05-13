import axios from "axios";
import * as express from "express";
import {getStorage, getDownloadURL} from "firebase-admin/storage";
import * as cors from "cors";
import {ErrorCode} from "./enums";
import {AICloudUrl, StoreChapter} from "./const";
import {firestore} from "./index";
import * as http from "http";
export const chapter = express();

// Automatically allow cross-origin requests
chapter.use(cors({origin: true}));

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
    // const fileNameLocal = `${uuid()}.wav`;
    const fileName = `${nameChapter}-${gender}.wav`;
    const destination = `${nameBook}/${fileName}`;
    const filee = getStorage().bucket().file(destination);
    try {
      await getDownloadURL(filee);
      filee.download().then((data) => {
        const buffer = Buffer.from(data[0].buffer);
        res.send(buffer);
      });
    } catch (error) {
      const bodyReq = {input: content, gender: gender};
      const agent = new http.Agent({
        keepAlive: true,
        maxSockets: 1,
      });
      const resp = await axios.post(AICloudUrl, bodyReq, {
        responseType: "stream",
        httpAgent: agent,
      });
      const stream = resp.data;
      const arr: Buffer[] = [];

      stream
        .on("data", (chunk: any) => arr.push(chunk))
        .on("error", (err: any) => console.log(err))
        .on("end", () => {
          const buffer = Buffer.concat(arr);
          filee.save(buffer);
          res.send(buffer);
        });
    }
  } catch (error) {
    console.log(error);
    res.status(ErrorCode.common).send(error);
  }
});
