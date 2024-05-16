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
axios.defaults.timeout = 60000;
chapter.get("/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const doc = await firestore.collection(StoreChapter).doc(code).get();
    const data = doc.data();
    res.send(data != undefined ? data : {});
  } catch (error) {
    console.log(error);
    res.status(ErrorCode.COMMON).send(error);
  }
});

chapter.post("/", async (req, res) => {
  const body = req.body;
  const source = body.source;
  const nameBook = body.nameBook;
  const nameChapter = body.nameChapter;
  const content = body.content;
  const gender = body.gender;
  const fileName = `${nameChapter}-${gender}.wav`;
  const destination = `${source}/${nameBook}/${fileName}`;
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
    try {
      axios
        .post(AICloudUrl, bodyReq, {
          responseType: "stream",
          httpAgent: agent,
        })
        .then((resp) => {
          const stream = resp.data;
          const arr: Buffer[] = [];
          stream
            .on("data", (chunk: Buffer) => arr.push(chunk))
            .on("stream error", (err: Error) => {
              console.log("axios error: " + err);
              res.status(ErrorCode.COMMON).send(err);
            })
            .on("end", () => {
              const buffer = Buffer.concat(arr);
              filee.save(buffer);
              res.send(buffer);
            });
        })
        .catch((error) => {
          const err = error.toJSON();
          console.log("axios error: " + error.code);
          if (err.code == "ECONNABORTED") {
            res.status(ErrorCode.COMMON).send(
              JSON.stringify({
                code: ErrorCode.TIME_OUT,
                message: err.message,
              })
            );
          }
        });
    } catch (error: any) {
      console.log("chapter.post error: " + error.code);
      res.status(ErrorCode.COMMON).send(error);
    }
  }
});
