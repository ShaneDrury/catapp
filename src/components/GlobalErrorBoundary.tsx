import React from "react";
import { useQueryErrorResetBoundary } from "react-query";
import { ErrorBoundary } from "react-error-boundary";

const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary, error }) => (
        <div>
          There was an error: {error.message}
          <button onClick={() => resetErrorBoundary()}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorBoundary;
