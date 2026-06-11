import { useEffect, useState } from "react";
import {
  debugLog,
  getDebugLogs,
  isDebugEnabled,
  setDebugEnabled,
  subscribeDebug,
} from "../utils/debugLog";
import "./DebugPanel.css";

export default function DebugPanel() {
  const [open, setOpen] = useState(isDebugEnabled());
  const [entries, setEntries] = useState(getDebugLogs());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isDebugEnabled()) setOpen(true);
    return subscribeDebug(() => setEntries(getDebugLogs()));
  }, []);

  if (!open) return null;

  const copyLogs = async () => {
    const text = entries
      .map((e) => `${e.time} [${e.level}] ${e.message}${e.data ? ` ${JSON.stringify(e.data)}` : ""}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      debugLog("error", "Clipboard copy failed");
    }
  };

  const runStreamTest = async () => {
    const testUrl = import.meta.env.DEV ? "/stream?id=jNQXAC9IVRw" : "/api/stream?id=jNQXAC9IVRw";
    debugLog("info", `Running stream test: ${testUrl}`);
    try {
      const response = await fetch(testUrl);
      const body = await response.text();
      debugLog(response.ok ? "info" : "error", "Stream test result", {
        status: response.status,
        contentType: response.headers.get("content-type"),
        body: body.slice(0, 400),
      });
    } catch (error) {
      debugLog("error", "Stream test failed", { message: error.message });
    }
  };

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <strong>iPhone Debug</strong>
        <div className="debug-panel-actions">
          <button type="button" onClick={runStreamTest}>Test API</button>
          <button type="button" onClick={copyLogs}>{copied ? "Copied!" : "Copy"}</button>
          <button
            type="button"
            onClick={() => {
              setDebugEnabled(false);
              setOpen(false);
            }}
          >
            Close
          </button>
        </div>
      </div>
      <div className="debug-panel-body">
        {entries.length === 0 ? (
          <p className="debug-empty">No logs yet. Try playing a track.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={`debug-line debug-line--${entry.level}`}>
              <span className="debug-time">{entry.time.slice(11, 19)}</span>
              <span className="debug-msg">{entry.message}</span>
              {entry.data ? (
                <pre className="debug-data">{JSON.stringify(entry.data, null, 0)}</pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
