//api's associated with chats
import { OpenAIEdgeStream } from "openai-edge-stream"; //calling openai

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  //the req object represents any data that we send to our API endpoint.
  try {
    //this is the message that the user types in the text box.
    const { message } = await req.json();
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is DaddyDude. An incredibly intelligent and quick-thinking AI. You always reply with an enthusiastic and positive energy. You were created by Web and Prosper. Your response must be formatted with markdown",
    };
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions", //the url we want to hit.
      //add configuration.
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },

        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialChatMessage, { content: message, role: "user" }],
          stream: true,
        }),
      }
    );
    return new Response(stream);
  } catch (e) {
    console.log("AN ERROR OCURRED IN SENDMESSAGE:", e);
  }
}
