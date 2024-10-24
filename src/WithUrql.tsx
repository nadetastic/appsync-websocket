import { useState } from "react";
import {
  Client,
  Provider,
  cacheExchange,
  fetchExchange,
  gql,
  subscriptionExchange,
  useMutation,
  useQuery,
  useSubscription,
} from "urql";
import { createClient as createWSClient, SubscribePayload } from "graphql-ws";

type Todo = { __typename: string; id: string; content: string };

const apiKey = "da2-hjnurlehcncxzhcejk7loww2mq";
const host = "ce6zukrw4becpc6wyaxm3fjbyi.appsync-api.us-east-1.amazonaws.com";
const headers = {
  host: host,
  "x-api-key": apiKey,
};
const headerString = JSON.stringify(headers);
const headerBase64 = btoa(headerString);
const payloadBase64 = btoa("{}");

const wsClient = createWSClient({
  url: `wss://ce6zukrw4becpc6wyaxm3fjbyi.appsync-realtime-api.us-east-1.amazonaws.com/graphql?header=${headerBase64}&payload=${payloadBase64}`,
});

const urqlClient = new Client({
  url: "https://ce6zukrw4becpc6wyaxm3fjbyi.appsync-api.us-east-1.amazonaws.com/graphql",
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(operation) {
        return {
          subscribe: (sink) => {
            const dispose = wsClient.subscribe(
              operation as SubscribePayload,
              sink
            );
            return {
              unsubscribe: dispose,
            };
          },
        };
      },
    }),
  ],
  fetchOptions: () => {
    return {
      headers: {
        "x-api-key": apiKey,
      },
    };
  },
});

export const WithUrql = () => {
  return (
    <Provider value={urqlClient}>
      <h1>With URQL</h1>

      <ListTodos />

      <RealTime />
    </Provider>
  );
};

const ListTodos = () => {
  const todoQuery = gql`
    query MyQuery {
      listTodos {
        items {
          content
          id
        }
      }
    }
  `;

  const [result] = useQuery({
    query: todoQuery,
  });

  const { data, fetching, error } = result;

  if (fetching) return "LOADING...";
  if (error) return "Something is wrong";

  return data.listTodos.items.map((todo: Todo) => {
    return <div key={todo.id}>{todo.content}</div>;
  });
};

const RealTime = () => {
  const newTodoSub = `
    subscription MySubscription {
        onCreateTodo {
            id
            content
        }
    }
    `;

  const handleSubscription = (todos = [], response) => {
    return [response.newMessages, ...todos];
  };

  const [res] = useSubscription({ query: newTodoSub }, handleSubscription);

  if (!res.data) {
    return <p> No new messages</p>;
  }

  return <ul>{res.data.map((todo) => JSON.stringify(todo))}</ul>;
};
