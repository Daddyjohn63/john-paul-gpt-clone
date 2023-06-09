//api's associated with chats
import { OpenAIEdgeStream } from "openai-edge-stream"; //calling openai

export const config = {
  runtime: "edge",
};
//as it is an edge function, it only has access to the request object (req).
export default async function handler(req) {
  //the req object represents any data that we send to our API endpoint.In this case it is the message/ question from the user.
  try {
    //this is the message that the user types in the text box.
    //console.log("HERE IS THE REQ TO THE API ENPOINT", req.body);
    const { chatId: chatIdFromParam, message } = await req.json();
    //validate message data
    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        {
          message: "message is required and must be less than 200 characters",
        },
        {
          status: 422,
        }
      );
    }

    let chatId = chatIdFromParam;

    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Charlie. An incredibly intelligent and quick-thinking AI. You always reply with an enthusiastic and positive energy. You were created by John Paul.Your response must be formatted with markdown",
    };

    let newChatId;
    let chatMessages = [];

    if (chatId) {
      //add message to existing chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
      const json = await response.json();
      chatMessages = json.chat.messages || [];
    } else {
      //create new chat
      const response = await fetch(
        //domain name required before api endpoint as we are targetting from a server component.
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message, //this is what is passed in above with 'const { message } = await req.json();'
          }),
        }
      );
      const json = await response.json();
      //console.log("JSON CNC:", json);
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }
    messagesToInclude.reverse();
    //send message to openai
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions", //the url we want to hit.
      //add configuration.
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },

        method: "POST",
        //the body is all the data we will be posting to the openai api.
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          //message must be the message we pass to the sendmessage endpoint.
          //the role is 'user' as it is the user message we are sending.
          messages: [initialChatMessage, ...messagesToInclude],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          if (newChatId) {
            emit(newChatId, "newChatId"); //this is a new event name we have created to be sent before the content stream, this way we can target the start of the stream.
          }
        },
        //call endpoint to add the new chat to exisitng chats.
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie"),
              },
              //what we are passing to the addMessageToChat endpoint
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );
    return new Response(stream); //returns the response from openai
  } catch (e) {
    return new Response(
      { message: "An error occured in sendMessage" },
      { status: 500 }
    );
  }
}
