"use client";

import {
  createRealtimeClient,
  type SealedLiveQuery,
} from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ScanResult } from "@/types";

type CloudScan = ScanResult & { durationMs: number };
type Subscription = { url: string; query: SealedLiveQuery<CloudScan> };

export default function CloudScanHistory() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notice, setNotice] = useState("Loading synced history…");

  const loadSubscription = useCallback(async () => {
    const response = await fetch("/api/scans/live", {
      method: "POST",
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Could not connect to Neon Realtime.");
    setNotice("");
    return data as Subscription;
  }, []);

  useEffect(() => {
    let active = true;
    loadSubscription()
      .then((value) => {
        if (active) setSubscription(value);
      })
      .catch((error: unknown) => {
        if (active)
          setNotice(
            error instanceof Error
              ? error.message
              : "Could not connect to synced history.",
          );
      });
    return () => {
      active = false;
    };
  }, [loadSubscription]);

  if (!subscription) {
    return (
      <section className="rounded-xl border border-violet-400/15 bg-slate-900/50 p-4 text-sm text-slate-400">
        Cloud history:{" "}
        {notice.includes("Sign in") ? (
          <Link className="text-violet-200 underline" href="/auth">
            sign in
          </Link>
        ) : (
          notice
        )}
      </section>
    );
  }

  return <LiveHistory subscription={subscription} refresh={loadSubscription} />;
}

function LiveHistory({
  subscription,
  refresh,
}: {
  subscription: Subscription;
  refresh: () => Promise<Subscription>;
}) {
  const [client] = useState(() =>
    createRealtimeClient({ url: toWebSocketUrl(subscription.url) }),
  );
  const refreshQuery = useCallback(
    async () => (await refresh()).query,
    [refresh],
  );
  return (
    <RealtimeProvider client={client}>
      <SyncedRows query={subscription.query} refreshQuery={refreshQuery} />
    </RealtimeProvider>
  );
}

function toWebSocketUrl(value: string) {
  const url = new URL(value);
  if (url.protocol === "https:") url.protocol = "wss:";
  else if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol !== "wss:" && url.protocol !== "ws:") {
    throw new Error("Neon Realtime URL must use HTTPS or WSS.");
  }
  return url.toString();
}

function SyncedRows({
  query,
  refreshQuery,
}: {
  query: SealedLiveQuery<CloudScan>;
  refreshQuery: () => Promise<SealedLiveQuery<CloudScan>>;
}) {
  const { data, status, error } = useLiveQuery<CloudScan>(query, {
    refreshQuery,
  });

  useEffect(() => {
    if (status === "connecting") {
      const timer = setTimeout(() => {
        refreshQuery().catch(() => {});
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [status, refreshQuery]);

  return (
    <section
      aria-label="Synced scan history"
      className="rounded-xl border border-violet-400/15 bg-slate-900/50 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-white">Synced scan history</h2>
        <span className="text-xs text-slate-400">
          {status === "live"
            ? "Live"
            : status === "error"
              ? "Disconnected"
              : "Connecting…"}
        </span>
        {(status === "connecting" || status === "error") && (
          <button
            type="button"
            onClick={() => refreshQuery().catch(() => {})}
            className="text-xs cursor-pointer text-violet-200 underline hover:text-violet-100"
          >
            Retry connection
          </button>
        )}
      </div>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-rose-300">
          {error.message}
        </p>
      )}
      {data?.length === 0 && (
        <p className="mt-3 text-sm text-slate-400">
          Signed-in scans will appear here.
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {data.map((scan) => (
            <li
              key={scan.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/70 px-3 py-2 text-sm"
            >
              <span className="break-all text-slate-200">{scan.url}</span>
              <span className="text-violet-200">
                {scan.score}/100 · {scan.grade}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
