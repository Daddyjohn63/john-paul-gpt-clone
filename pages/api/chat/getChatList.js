import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("JohnPaulChatGPT");
    const chats = await db
      .collection("chats")
      .find(
        //pass in search query.
        {
          userId: user.sub,
        },
        {
          projection: {
            //telling db what to omit.
            userId: 0,
            message: 0,
          },
        }
      )
      .sort({
        _id: -1, //in mongo id's are time stamped allowing us to sort by latest to oldest.
      })
      .toArray();
    res.status(200).json({ chats });
  } catch (e) {
    res
      .status(500)
      .json({ message: "An error occured when getting the chat list" });
  }
}
