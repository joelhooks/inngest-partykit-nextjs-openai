import type {
  Party,
  PartyConnection,
  PartyRequest,
  PartyServer,
  PartyWorker,
  PartyServerOptions,
  PartyConnectionContext,
} from "partykit/server";
import { Inngest } from "inngest";

// PartyKit servers now implement PartyServer interface
export default class Main implements PartyServer {
  // onBefore* handlers that run in the worker nearest the user are now
  // explicitly marked static, because they have no access to Party state
  static async onBeforeRequest(req: PartyRequest) {
    return req;
  }
  static async onBeforeConnect(req: PartyRequest) {
    return req;
  }
  // onFetch is now stable. No more unstable_onFetch
  static async onFetch(req: PartyRequest) {
    return new Response("Unrecognized request: " + req.url, { status: 404 });
  }

  // Opting into hibernation is now an explicit option
  readonly options: PartyServerOptions = {
    hibernate: true,
  };

  // Servers can now keep state in class instance variables
  messages: string[] = [];
  inngest: Inngest

  // PartyServer receives the Party (previous PartyKitRoom) as a constructor argument
  // instead of receiving the `room` argument in each method.
  readonly party: Party;
  constructor(party: Party) {
    this.party = party;
    this.inngest = new Inngest({
      name: "Inngest + PartyKit: OpenAI Function invocation app",
    })
  }

  // There's now a new lifecycle method `onStart` which fires before first connection
  // or request to the room. You can use this to load data from storage and perform other
  // asynchronous initialization. The Party will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }

  // onConnect, onRequest, onAlarm no longer receive the room argument.
  async onRequest(_req: PartyRequest) {
    const messageBody: {requestId: string, body: string} = await _req.json();

    this.party.broadcast(messageBody.body);

    return new Response(
        `Party ${this.party.id} has received ${this.messages.length} messages`
    );
  }
  async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {}

  // Previously onMessage, onError, onClose were only called for hibernating parties.
  // They're now available for all parties, so you no longer need to manually
  // manage event handlers in onConnect!
  async onMessage(message: string, connection: PartyConnection) {
    this.party.broadcast(message, [connection.id]);
  }
  async onError(connection: PartyConnection, err: Error) {
    console.log("Error from " + connection.id, err.message);
  }
  async onClose(connection: PartyConnection) {
    console.log("Closed " + connection.id);
    this.inngest.send({
      name: "api/chat.cancelled",
      data: {
        requestId: connection.id,
      },
    });
  }
}

// Optional: Typecheck the static methods with a `satisfies` statement.
Main satisfies PartyWorker;