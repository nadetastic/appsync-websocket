import { useEffect, useState } from "react";
import appsyncLogo from "./assets/appsync.png";
import "./App.css";
import { AppSyncWebSocket } from "./utils/realtime";
import { WithUrql } from "./WithUrql";

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
        <WithUrql />
        <ReusableComponent
          endpoint="wss://ce6zukrw4becpc6wyaxm3fjbyi.appsync-realtime-api.us-east-1.amazonaws.com/graphql"
          host="ce6zukrw4becpc6wyaxm3fjbyi.appsync-api.us-east-1.amazonaws.com"
          // apiKey={import.meta.env.VITE_APPSYNC_APIKEY}
          apiKey="da2-hjnurlehcncxzhcejk7loww2mq"
        />
        {/*}
        <ReusableComponent
          endpoint="wss://appsync_endpoint-2.appsync-realtime-api.us-west-2.amazonaws.com/graphql"
          host="appsync_endpoint-2.appsync-realtime-api.us-west-2.amazonaws.com"
          apiKey={import.meta.env.VITE_APPSYNC_2_APIKEY}
        /> */}
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
