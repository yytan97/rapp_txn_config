import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";

export function TestGraphPage2() {
  const TIME_RANGES = [
    { label: "1 min", ms: 60_000 },
    { label: "5 min", ms: 5 * 60_000 },
    { label: "30 min", ms: 30 * 60_000 },
    { label: "1 hr", ms: 60 * 60_000 },
  ];

  const INTERVALS = [
    { label: "3 Sec", sec: 3 },
    { label: "5 Sec", sec: 5 },
    { label: "10 Sec", sec: 10 },
    { label: "30 Sec", sec: 30 },
    { label: "1 Min", sec: 60 },
  ];

  const [timeRangeMs, setTimeRangeMs] = useState(TIME_RANGES[0].ms);
  const [intervalSec, setIntervalSec] = useState(INTERVALS[0].sec);

  // Graph 1: single series
  const [connData, setConnData] = useState([]); // [{ ts, value }]

  // Graph 2: multi series (same buckets)
  const [threadData, setThreadData] = useState({
    sent: [],
    received: [],
    failed: [],
    timeout: [],
    totalProcessed: [],
    totalRequests: [],
    totalResponses: [],
  });

  // ---- helper: generate x buckets by timeRange + interval ----
  const buildBuckets = () => {
    const intervalMs = intervalSec * 1000;
    const now = Date.now();
    const endTs = Math.floor(now / intervalMs) * intervalMs;
    const startTs = endTs - timeRangeMs;

    const buckets = [];
    for (let ts = startTs; ts <= endTs; ts += intervalMs) buckets.push(ts);
    return { buckets, intervalMs, startTs, endTs };
  };

  // ---- MOCK generator: Graph 1 (Connection Count) ----
  const loadConnectionData = () => {
    const { buckets } = buildBuckets();

    let v = 20;
    const points = buckets.map((ts) => {
      v = Math.max(0, Math.round(v + (Math.random() * 30 - 10)));
      return { ts, value: v };
    });

    setConnData(points);
  };

  // ---- MOCK generator: Graph 2 (Thread multi-series) ----
  // We generate "sent/received/failed/timeout" and then derived totals
  const loadThreadData = () => {
    const { buckets } = buildBuckets();

    let sent = 2;
    let received = 1;
    let failed = 0;
    let timeout = 0;

    const s = [];
    const r = [];
    const f = [];
    const t = [];
    const tp = [];
    const trq = [];
    const trp = [];

    for (const ts of buckets) {
      // tweak these numbers however you like (just mock behavior)
      sent = Math.max(0, Math.round(sent + (Math.random() * 6 - 1)));
      received = Math.max(0, Math.round(received + (Math.random() * 6 - 1)));

      // failed/timeout usually small
      failed = Math.max(0, Math.round(failed + (Math.random() * 2 - 0.7)));
      timeout = Math.max(0, Math.round(timeout + (Math.random() * 2 - 0.8)));

      // derived totals (example logic)
      const totalProcessed = sent + received + failed + timeout;
      const totalRequests = Math.max(0, Math.round(totalProcessed * 0.55));
      const totalResponses = Math.max(0, Math.round(totalProcessed * 0.25));

      s.push({ ts, value: sent });
      r.push({ ts, value: received });
      f.push({ ts, value: failed });
      t.push({ ts, value: timeout });
      tp.push({ ts, value: totalProcessed });
      trq.push({ ts, value: totalRequests });
      trp.push({ ts, value: totalResponses });
    }

    setThreadData({
      sent: s,
      received: r,
      failed: f,
      timeout: t,
      totalProcessed: tp,
      totalRequests: trq,
      totalResponses: trp,
    });
  };

  // Rebuild BOTH graphs when user changes time range / interval
  useEffect(() => {
    loadConnectionData();
    loadThreadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRangeMs, intervalSec]);

  // ---------- Graph 1 option ----------
//   const connOption = useMemo(() => {
//     return {
//       grid: { left: 56, right: 40, top: 20, bottom: 44 },
//       tooltip: {
//         trigger: "axis",
//         axisPointer: { type: "line" },
//         formatter: (params) => {
//           const p = params?.[0];
//           if (!p) return "";
//           const ts = p.data[0];
//           const val = p.data[1];
//           const time = new Date(ts).toLocaleTimeString([], { hour12: false });
//           return `
//             <div style="min-width:160px">
//               <div style="font-size:12px;opacity:.8">Time: ${time}</div>
//               <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
//                 <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#167FFC"></span>
//                 <span>Connection Count</span>
//                 <span style="margin-left:auto;font-weight:700">${val}</span>
//               </div>
//             </div>
//           `;
//         },
//       },
//       xAxis: {
//         type: "time",
//         boundaryGap: false,
//         splitLine: { show: true },
//         axisLabel: { hideOverlap: true },
//       },
//       yAxis: {
//         type: "value",
//         position: "right",
//         min: 0,
//         splitLine: { show: true },
//       },
//       series: [
//         {
//           name: "Connection Count",
//           type: "line",
//           showSymbol: false,
//           data: connData.map((p) => [p.ts, p.value]),
//           lineStyle: { color: "#167FFC", width: 2 },
//           itemStyle: { color: "#167FFC" },
//           areaStyle: { color: "rgba(22, 127, 252, 0.2)" },
//         },
//       ],
//     };
//   }, [connData]);

  // ---------- Graph 2 option (multi-series) ----------
  const threadOption = useMemo(() => {
    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour12: false });

    return {
      grid: { left: 56, right: 40, top: 20, bottom: 60 },
      legend: {
        bottom: 10,
        left: 56,
        icon: "circle",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter: (params) => {
          // params: array of series at same x
          if (!params?.length) return "";
          const ts = params[0].data[0];
          const time = formatTime(ts);

          const rows = params
            .map((p) => {
              const name = p.seriesName;
              const val = p.data[1];
              const color = p.color;
              return `
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
                  <span>${name}</span>
                  <span style="margin-left:auto;font-weight:700">${val}</span>
                </div>
              `;
            })
            .join("");

          return `
            <div style="min-width:220px">
              <div style="font-size:12px;opacity:.8">Time: ${time}</div>
              <div style="margin-top:8px">${rows}</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: "time",
        boundaryGap: false,
        splitLine: { show: true },
        axisLabel: { hideOverlap: true },
      },
      yAxis: {
        type: "value",
        position: "right",
        min: 0,
        splitLine: { show: true },
      },
      series: [
        // Total Processed (dashed + area)
        {
          name: "Total Processed",
          type: "line",
          showSymbol: false,
          data: threadData.totalProcessed.map((p) => [p.ts, p.value]),
          lineStyle: { type: "dashed", width: 2, color: "#167FFC" },
          itemStyle: { color: "#167FFC" },
          areaStyle: { color: "rgba(22, 127, 252, 0.16)" },
        },

        // Sent
        {
          name: "Sent",
          type: "line",
          showSymbol: false,
          data: threadData.sent.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#1BAA1B" },
          itemStyle: { color: "#1BAA1B" },
        },

        // Received
        {
          name: "Received",
          type: "line",
          showSymbol: false,
          data: threadData.received.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#0B6B2B" },
          itemStyle: { color: "#0B6B2B" },
        },

        // Failed
        {
          name: "Failed",
          type: "line",
          showSymbol: false,
          data: threadData.failed.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#F97316" },
          itemStyle: { color: "#F97316" },
        },

        // Timeout
        {
          name: "Timeout",
          type: "line",
          showSymbol: false,
          data: threadData.timeout.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#D97706" },
          itemStyle: { color: "#D97706" },
        },

        // Total Requests
        {
          name: "Total Requests",
          type: "line",
          showSymbol: false,
          data: threadData.totalRequests.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#2563EB" },
          itemStyle: { color: "#2563EB" },
        },

        // Total Responses
        {
          name: "Total Responses",
          type: "line",
          showSymbol: false,
          data: threadData.totalResponses.map((p) => [p.ts, p.value]),
          lineStyle: { width: 2, color: "#1E3A8A" },
          itemStyle: { color: "#1E3A8A" },
        },
      ],
    };
  }, [threadData]);

  return (
    <div className="p-3">
      {/* Shared Header + Filters (same concept) */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div>
          <div className="text-muted small">Kernel - Input/Output</div>
          <div className="fs-4 fw-bold">Detail Graph</div>
        </div>

        <div className="ms-auto d-flex flex-wrap align-items-center gap-3">
          {/* Time Range */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Time Range</span>
            <div className="btn-group btn-group-sm" role="group">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.ms}
                  type="button"
                  className={`btn ${timeRangeMs === tr.ms ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setTimeRangeMs(tr.ms)}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Interval</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 110 }}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
            >
              {INTERVALS.map((it) => (
                <option key={it.sec} value={it.sec}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Graph 1 */}
      {/* <div className="mt-3">
        <div className="fw-bold mb-2">Connection Count</div>
        <ReactECharts option={connOption} style={{ height: 420, width: "100%" }} />
      </div> */}

      {/* Graph 2 */}
      <div className="mt-4">
        <div className="fw-bold mb-2">Thread</div>
        <ReactECharts option={threadOption} style={{ height: 520, width: "100%" }} />
      </div>
    </div>
  );
}
