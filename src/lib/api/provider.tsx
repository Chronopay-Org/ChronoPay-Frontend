"use client";

import { createContext, useContext, type ReactNode } from "react";
import { mockSources, type ApiSources } from "./sources";

const ApiSourcesContext = createContext<ApiSources>(mockSources);

export function ApiSourcesProvider({
  children,
  sources = mockSources,
}: {
  children: ReactNode;
  sources?: ApiSources;
}) {
  return (
    <ApiSourcesContext.Provider value={sources}>
      {children}
    </ApiSourcesContext.Provider>
  );
}

export function useApiSources(): ApiSources {
  return useContext(ApiSourcesContext);
}
