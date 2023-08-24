import type { APIDocs, Functions } from "../types";

export const formatFunctions = (f: Functions): APIDocs[] => {
    return Object.values(f).map((g) => g.docs);
};