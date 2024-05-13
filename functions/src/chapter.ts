import axios from "axios";
import * as express from "express";
// import { FieldValue } from "firebase-admin/firestore";
import {getStorage, getDownloadURL} from "firebase-admin/storage";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as cors from "cors";
import {v4 as uuid} from "uuid";
import {ErrorCode} from "./enums";
import {AICloudUrl, StoreChapter} from "./const";
import {firestore} from "./index";
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
    const fileNameLocal = `${uuid()}.wav`;
    const fileName = `${nameChapter}-${gender}.wav`;
    const destination = `${nameBook}/${fileName}`;
    const filee = getStorage().bucket().file(destination);
    try {
      await getDownloadURL(filee);
      filee.download().then(async (data) => {
        const buffer = Buffer.from(data[0].buffer);
        const tempFilePath = path.join(os.tmpdir(), fileNameLocal);
        console.log(tempFilePath);
        fs.writeFile(tempFilePath, buffer, "utf-8", (err) => {
          if (err) {
            if (err) {
              console.log(err);
              throw err;
            }
          }

          res.sendFile(tempFilePath, (err) => {
            if (err) {
              console.log(err);
              throw err;
            }
            fs.unlinkSync(tempFilePath);
          });
        });
      });
      // res.send(url);
    } catch (error) {
      const bodyReq = {input: content, gender: gender};
      const resp = await axios.post(AICloudUrl, bodyReq, {
        responseType: "stream",
      });
      // send client
      // resp.data.pipe(res);

      const tempFilePath = path.join(os.tmpdir(), fileNameLocal);
      console.log("tempFilePath: " + tempFilePath);
      const writeStream = fs.createWriteStream(tempFilePath);
      resp.data.on("data", () => {
        console.log("data");
      });
      resp.data.on("close", () => {
        res.sendFile(tempFilePath);
        console.log("close-tempFilePath: " + tempFilePath);
        getStorage()
          .bucket().upload(tempFilePath, {
            destination: destination,
            contentType: "audio/wav",
          }).then(async () => {
            fs.unlinkSync(tempFilePath);
          });
      });
      resp.data.pipe(writeStream);
      // getStorage().bucket().file(destination).save(resp.data, {
      //   contentType: "audio/wav",
      // }).then(() => {
      //   console.log("success");
      // });
    }
  } catch (error) {
    console.log(error);
    res.status(ErrorCode.common).send(error);
  }
});
