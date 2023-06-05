import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useState } from "react";
import { v4 as uuid } from "uuid";

export default function ChatPage() {
  const [incomingMessage, setIncomingMessage] = useState(""); // stores the most recent incoming message from chat gpt
  const [messageText, setMessageText] = useState(""); //stores the current text that the user has typed into the chat input.
  const [newChatMessages, setNewChatMessages] = useState([]); //stores the list of chat messages that have been sent so far by the user? in an array.
  const [generatingResponse, setGeneratingResponse] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setNewChatMessages((prev) => {
      //prev represents the current state value.
      const newChatMessages = [
        ...prev, //take the previous array with the spread operator and add on another message with the properties shown.
        {
          _id: uuid(),
          role: "user",
          content: messageText,
        },
      ];
      return newChatMessages;
    });
    setMessageText("");
    const response = await fetch(`/api/chat/sendMessage`, {
      //this is the endpoint we created in our API folder.
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageText }), //what we pass here needs to match exactly with what we specified in our destructuring in sendMessage.js which was const { message } = await req.json(); This is the data we will send to our endpoint and the value is our state value.
    });
    //get the reader
    const data = response.body;
    if (!data) {
      return;
    }
    const reader = data.getReader();
    await streamReader(reader, async (message) => {
      console.log("MESSAGE: ", message);
      setIncomingMessage((s) => `${s}${message.content}`); //add the new content to the previous state.
    });
    setGeneratingResponse(false);
  };

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 overflow-scroll text-white">
            {newChatMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}
            {!!incomingMessage && (
              <Message role="assistant" content={incomingMessage} />
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}
