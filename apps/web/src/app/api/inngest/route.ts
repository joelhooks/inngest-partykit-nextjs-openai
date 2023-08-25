import { serve } from "inngest/next";
import { inngest } from "@/inngest/inngest.server.client";
import { aibot } from "@/inngest/ai-flow";

export const { GET, POST, PUT } = serve(inngest, [aibot]);
