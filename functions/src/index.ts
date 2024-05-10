import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";

// Import Routes
import {chapter} from "./chapter";

admin.initializeApp();
export const firestore = admin.firestore();

// route app here
const app = express();
// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Expose Express API as a single Cloud Function:
exports.app = functions.https.onRequest(app);
exports.chapter = functions.https.onRequest(chapter);
