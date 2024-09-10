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
  return (
    <>
      <div>
        <a href="#" target="_blank">
          <img src={appsyncLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>AppSync Realtime</h1>
      <div className="card">
        <p>Open network tools to view the subscription in process.</p>
        <ReusableComponent
          endpoint="wss://appsync_endpoint-1.appsync-realtime-api.us-west-2.amazonaws.com/graphql"
          host="appsync_endpoint-1.appsync-realtime-api.us-west-2.amazonaws.com"
          apiKey={import.meta.env.VITE_APPSYNC_1_APIKEY}
        />
        <ReusableComponent
          endpoint="wss://appsync_endpoint-2.appsync-realtime-api.us-west-2.amazonaws.com/graphql"
          host="appsync_endpoint-2.appsync-realtime-api.us-west-2.amazonaws.com"
          apiKey={import.meta.env.VITE_APPSYNC_2_APIKEY}
        />
      </div>
    </>
  );
}

export default App;

const ReusableComponent = ({
  endpoint,
  host,
  apiKey,
}: {
  endpoint: string;
  host: string;
  apiKey: string;
}) => {
  const [messages, setMessages] = useState<Array<Message>>([]);
  useEffect(() => {
    const connection = new AppSyncWebSocket(endpoint, {
      host: host,
      "x-api-key": apiKey,
    });

    const setupConnection = async () => {
      await connection.connect();
      await connection.subscribe(
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
    setupConnection();

    return () => {
      connection.disconnect();
    };
  }, []);
  return (
    <div>
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
  );
};
