import { useEffect, useState } from "react";
import appsyncLogo from "./assets/appsync.png";
import "./App.css";
import { AppSyncWebSocket } from "./utils/realtime";

interface Message {
  id: string;
  title: string;
  description: string;
}
function App() {
  const [messages, setMessages] = useState<Array<Message>>([]);
  useEffect(() => {
    const connection1 = new AppSyncWebSocket(
      "wss://2tlhrit5arbozl3guzsgu6ywyq.appsync-realtime-api.us-west-2.amazonaws.com/graphql",
      {
        host: "2tlhrit5arbozl3guzsgu6ywyq.appsync-api.us-west-2.amazonaws.com",
        "x-api-key": import.meta.env.VITE_APPSYNC_APIKEY as string,
      }
    );

    const setupConnection1 = async () => {
      await connection1.connect();
      await connection1.subscribe(
        "onNewTodo",
        `
      subscription NewTodo {
        onNewTodo {
          id
          title
          description
        }
      }
    `,
        (data: Message) => {
          console.log(data);
          setMessages((prevMessages) => [...prevMessages, data]);
        }
      );
    };
    setupConnection1();

    return () => {
      connection1.disconnect();
    };
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={appsyncLogo} className="logo" alt="Vite logo" />
        </a>
        {/* <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
      </div>
      <h1>AppSync Realtime</h1>
      <div className="card">
        <p>Open network tools to view the subscription in process.</p>

        {messages.map((message) => {
          return (
            <div key={message.id}>
              <p>
                <strong>{message.title}</strong>
              </p>
              <p>{message.description}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
