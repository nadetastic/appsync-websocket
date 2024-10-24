interface WebSocketMessage {
  type: string;
  id: string;
  payload: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageHandler = (data: any) => void;

export class AppSyncWebSocket {
  private _headers;
  private _endpoint: string;
  private _socket: WebSocket | null;
  private _messageHandlers: Map<string, MessageHandler>;
  private connectionPromise: Promise<void> | null;
  private resolveConnection: (() => void) | null;
  constructor(
    endpoint: string,
    headers: { host: string; "x-api-key": string }
  ) {
    this._headers = headers;
    this._endpoint = endpoint;
    this._socket = null;
    this._messageHandlers = new Map();
    this.connectionPromise = null;
    this.resolveConnection = null;
  }

  public connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;

      const headerString = JSON.stringify(this._headers);
      const headerBase64 = btoa(headerString);
      const payloadBase64 = btoa("{}");

      const websocketUrl = `${this._endpoint}?header=${headerBase64}&payload=${payloadBase64}`;

      this._socket = new WebSocket(websocketUrl, "graphql-ws");

      this._socket.onopen = this.handleOpen.bind(this);
      this._socket.onmessage = this.handleMessage.bind(this);
      this._socket.onerror = this.handleError.bind(this);
      this._socket.onclose = this.handleClose.bind(this);
    });
    return this.connectionPromise;
  }

  private handleOpen(event: Event): void {
    console.log("WebSocket connection opened:", event);

    this.sendMessage("connection_init", {});
  }

  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    console.log("Received message:", data);

    if (data.type === "connection_ack") {
      if (this.resolveConnection) {
        this.resolveConnection();
        this.resolveConnection = null;
      }
    } else if (data.type === "data" && data.payload && data.payload.data) {
      for (const [key, handler] of this._messageHandlers) {
        if (data.payload.data[key]) {
          handler(data.payload.data[key]);
        }
      }
    }
  }

  private handleError(event: Event): void {
    console.error("WebSocket error:", event);
  }

  private handleClose(event: CloseEvent): void {
    console.log("WebSocket connection closed:", event);
  }

  public sendMessage(
    type: string,
    payload?:
      | {
          data: string;
          extensions: { authorization: { "x-api-key": string; host: string } };
        }
      | object
  ): void {
    if (this._socket && this._socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: type,
        id: Date.now().toString(),
        payload: payload,
      };
      this._socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  public async subscribe(
    subscriptionName: string,
    query: string,
    handler: MessageHandler
  ): Promise<void> {
    console.log({ query });
    console.log({ subscriptionName });

    await this.connectionPromise;
    this._messageHandlers.set(subscriptionName, handler);
    this.sendMessage("start", {
      data: JSON.stringify({
        query: query,
        variables: {},
      }),
      extensions: {
        authorization: {
          "x-api-key": this._headers["x-api-key"],
        },
      },
    });
  }

  public unsubscribe(subscriptionName: string): void {
    this._messageHandlers.delete(subscriptionName);
  }

  public disconnect(): void {
    if (this._socket) {
      this._socket.close();
      console.log("Socket closed");
    }
    console.log("Disconnected");
  }
}
