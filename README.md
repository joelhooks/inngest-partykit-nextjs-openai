# Collaborative AI Assisted Workflows with Inngest and Partykit

This is an example using [Inngest](https://inngest.com) and 
[Partykit](https://github.com/partykit/partykit) to build a collaborative
AI assisted workflow.

[quick loom video](https://www.loom.com/share/255222fa0ff24cb99765693eb6e6af91?sid=ad8b34a7-d30f-4d52-bc7e-59f2ce32c503) showing where it's at right now.

Inngest is used to initiate and orchestrate the workflow, and Partykit is used
as a proxy to the OpenAI API. We need a proxy because the OpenAI API **streams**
responses and we want to orchestrate actions based on suggestions and function
calls that the OpenAI API returns.

This is important because we aren't building a simple chat box. We want a UI that allows
us to do actual work and we **cannot trust the LLM to make appropriate business decisions**.

We **can** trust the LLM to make suggestions and we can use those suggestions to
make human level decisions.

## How it works

The user has a text box that they can type into and ask for a particular task to accomplish. This
initiates a workflow with Inngest. As OpenAI streams back it's responses, we can use Partykit
as a proxy for the streams and broadcast those responses to **every subscribed user**.

**This means that we are able to create multiplayer workflows that are assisted by AI.**

## How to use

Get everything installed:

```shell
pnpm install
```

Start everything like this:

```shell
pnpm dev
```

`pnpm dev` starts the web application server, the PartyKit dev server, and the Inngest dev server.

Inngest is running at http://localhost:8288 and the wb app server is running at http://localhost:3000. Open both of these in your browser!

Partykit doesn't have a UI, but is running at http://127.0.0.1:1999/

`OPENAI_API_KEY` and `LINEAR_API_KEY` need to be set in `/apps/web/.env.local` for the web app to work.

👋 Note that the linear function `delete` does NOT actually delete issues. You can create a Linear account for free as a way to test it out.

## What's inside?

This example includes the following packages/apps:

### Apps and Packages

- `web`: simple [Next.js](https://nextjs.org/) app
- `openai-party`: a [PartyKit](https://github.com/partykit/partykit) server
- `ui`: a stub React component library shared by both `web` applications
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Build

To build all apps and packages, run the following command:

```
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
pnpm dev
```