import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
//need to find the chat id and add the chat to the relevant document in mongodb.
export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("JohnPaulChatGPT");
    // console.log("addmessagetochat :", req.body);
    const { chatId, role, content } = req.body;

    let objectId;
    //validate we have a mongo object id
    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      res.status(422).json({
        message: "Invalid chat ID",
      });
      return;
    }

    //validate content data
    if (
      !content ||
      typeof content !== "string" ||
      (role === "user" && content.length > 200) ||
      (role === "assistant" && content.length > 100000)
    ) {
      res.status(422).json({
        message: "content is required and must be less than 200 characters",
      });
      return;
    }

    //validate role
    if (role !== "user" && role !== "assistant") {
      res.status(422).json({
        message: "role must be either 'assistant' or 'user'",
      });
      return;
    }

    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: objectId, //find the object
        userId: user.sub, //make sure the user is the same.
      },
      {
        $push: {
          //push to the messages array in mongodb
          messages: {
            role,
            content,
          },
        },
      },
      {
        returnDocument: "after",
      }
    );
    res.status(200).json({
      chat: {
        ...chat.value,
        _id: chat.value._id.toString(),
      },
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "An error occured when adding a message to a chat" });
  }
}
