import { getSession } from "@auth0/nextjs-auth0";

import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res); //get the user
    const { message } = req.body; //whatever the uses types, we want to pass this to our endpoint. we destructure it from req.body which extracts the value of the message property from the req.body object and assigns it to a variable called message.

    //create data to persist by creating a new object...
    const newUserMessage = {
      role: "user",
      content: message, //needed for our sidebar and is the very first message that the user sends.
    };
    //save to database
    const client = await clientPromise;
    const db = client.db("JohnPaulChatGPT");
    const chat = await db.collection("chats").insertOne({
      userId: user.sub, //user.sub comes from auth0, so we can use it as a unique id.
      messages: [newUserMessage],
      title: message,
    });
    //what we will return to the client.
    res.status(200).json({
      _id: chat.insertedId.toString(), //insertedId is a Mongo Object which we need to convert to a string.
      messages: [newUserMessage],
      title: message,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "An error occurred when creating a new chat" });
    console.log("ERROR OCCURRED IN CREATE NEW CHAT: ", e);
  }
}
