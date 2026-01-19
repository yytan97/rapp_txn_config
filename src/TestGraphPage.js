import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";

export function TestGraphPage() {
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

  // [{ ts: epoch_ms, value: number }]
  const [data, setData] = useState([]);

  const timerRef = useRef(null);

  // --------- MOCK: replace with real API fetch ----------
  const loadData = async () => {
    const intervalMs = intervalSec * 1000;
    const now = Date.now();

    // ⬅️ 对齐 bucket（关键）
    const endTs = Math.floor(now / intervalMs) * intervalMs;
    const startTs = endTs - timeRangeMs;

    const points = [];
    let value = 20;

    for (let ts = startTs; ts <= endTs; ts += intervalMs) {
        // mock value（以后接后端就不需要）
        value = Math.max(0, Math.round(value + (Math.random() * 30 - 10)));

        points.push({
            ts,
            value
        });
    }

    setData(points);
    };


  // reset when timeRange changes
  useEffect(() => {
    setData([]);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRangeMs]);

  

  const option = useMemo(() => {
    return {
      grid: { left: 56, right: 40, top: 20, bottom: 44 },

      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line", // vertical line like your screenshot
        },
        formatter: (params) => {
          const p = params?.[0];
          if (!p) return "";
          const ts = p.data[0];
          const val = p.data[1];
          const time = new Date(ts).toLocaleTimeString([], { hour12: false });
          return `
            <div style="min-width:160px">
              <div style="font-size:12px;opacity:.8">Time: ${time}</div>
              <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#167FFC"></span>
                <span>Connection Count</span>
                <span style="margin-left:auto;font-weight:700">${val}</span>
              </div>
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
        position: "right", // matches your screenshot (ticks on right)
        min: 0,
        splitLine: { show: true },
      },

      series: [
        {
            name: "Connection Count",
            type: "line",
            showSymbol: false,
            data: data.map((p) => [p.ts, p.value]),
            // 🔹 线的颜色
            lineStyle: {
                color: "#167FFC", // indigo / blue / any hex
                width: 2,
            },
            // 🔹 点的颜色（如果你之后 showSymbol=true）
            itemStyle: {
                color: "#167FFC",
            },
            // 🔹 area 填色
            areaStyle: {
                color: "rgba(22, 127, 252, 0.2)", // 同色系 + 透明
                // opacity: 0.18,
            },
        },
      ],
    };
  }, [data]);

  return (
    <div className="p-3">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div>
          <div className="text-muted small">Kernel - Input/Output</div>
          <div className="fs-4 fw-bold">Connection Count</div>
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
                  className={`btn ${
                    timeRangeMs === tr.ms ? "btn-primary" : "btn-outline-primary"
                  }`}
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

      {/* Chart */}
      <div className="mt-3">
        <ReactECharts option={option} style={{ height: 540, width: "100%" }} />
      </div>
    </div>
  );
}
