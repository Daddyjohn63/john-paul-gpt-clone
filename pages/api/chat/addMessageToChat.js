import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
//need to find the chat id and add the chat to the relevant document in mongodb.
export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("JohnPaulChatGPT");
    console.log("addmessagetochat :", req.body);
    const { chatId, role, content } = req.body;
    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: new ObjectId(chatId), //find the object
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
