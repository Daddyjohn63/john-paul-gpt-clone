import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";
import Head from "next/head";
import { useRouter } from "next/router";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export default function ChatPage({ chatId }) {
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(""); // stores the most recent incoming message from chat gpt
  const [messageText, setMessageText] = useState(""); //stores the current text that the user has typed into the chat input.
  const [newChatMessages, setNewChatMessages] = useState([]); //stores the list of chat messages that have been sent so far by the user? in an array.
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setNewChatMessages((prev) => {
      //prev represents the current state value.
      const newChatMessages = [
        ...prev, //take the previous array with the spread operator and add on another message with the properties shown.
        {
          _id: uuid(), //rendering an array in React requires an id
          role: "user",
          content: messageText,
        },
      ];
      //console.log("NEW CHAT MESSAGES: ", newChatMessages);
      return newChatMessages;
    });
    setMessageText("");

    //console.log("NEW CHAT: ", json);
    const response = await fetch(`/api/chat/sendMessage`, {
      //hit the end point we defined in sendMessage.js
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
    //read the data coming back from chatGPT and pass it into state.
    const reader = data.getReader();
    //below function comes from openai package.
    await streamReader(reader, async (message) => {
      console.log("MESSAGE: ", message);
      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage((s) => `${s}${message.content}`); //add the new content to the previous state and return new state.
      }
    });

    setGeneratingResponse(false);
  };

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 overflow-auto text-white">
            {newChatMessages.map((message) => (
              <Message
                key={message._id} //need the id as we are rendering from an array.we dont need to pass this component.
                role={message.role}
                content={message.content}
              />
            ))}
            {/* response back from openai */}
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

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null; //the prop chatId needs to eb the same name we gave to the file [[...chatId]].js. Have to use null as we cannot pass undefined.
  return {
    props: {
      chatId,
    },
  };
};
