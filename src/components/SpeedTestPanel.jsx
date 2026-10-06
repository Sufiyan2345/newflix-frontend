import { useRef, useState } from 'react';
import { API_BASE } from '../api';

// The live panel behind the footer's "Speed Test" link.
//
// The real Speed Test reports a measured number, so this measures one too: it
// downloads a known number of bytes from GET /api/speed-test and divides by the
// elapsed time. The server sends incompressible random bytes and
// `Cache-Control: no-store`, so the reading reflects the connection rather than
// a cached response.

// Big enough to swamp connection latency (RTT dominates on short transfers),
// small enough that a slow line is not left hanging.
const SAMPLE_BYTES = 3 * 1024 * 1024;

const verdict = (mbps) => {
  if (mbps >= 15) return { label: 'Excellent — 4K streams comfortably', tone: 'good' };
  if (mbps >= 5) return { label: 'Good — 1080p streams smoothly', tone: 'good' };
  if (mbps >= 3) return { label: 'Fair — 720p is fine, HD may buffer', tone: 'warn' };
  return { label: 'Slow — playback is likely to stall', tone: 'bad' };
};

export function SpeedTestPanel() {
  const [state, setState] = useState('idle'); // idle | running | done | error
  const [mbps, setMbps] = useState(null);
  const [detail, setDetail] = useState('');
  // Guards against a second run landing on top of the first and writing a
  // stale result (the abort also stops the download).
  const runIdRef = useRef(0);

  const run = async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setState('running');
    setMbps(null);
    setDetail('Downloading a test file…');

    const started = performance.now();
    try {
      const res = await fetch(`${API_BASE}/speed-test?bytes=${SAMPLE_BYTES}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);

      // Count the bytes as they stream — waiting for the whole buffer would
      // measure the parse, not the transfer.
      let received = 0;
      const reader = res.body?.getReader();
      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          if (runId !== runIdRef.current) return;
        }
      } else {
        received = (await res.arrayBuffer()).byteLength;
      }

      const seconds = (performance.now() - started) / 1000;
      if (runId !== runIdRef.current) return;
      if (seconds <= 0) throw new Error('measurement too short');

      // megabits per second = bytes × 8 / seconds / 1e6
      const speed = (received * 8) / seconds / 1e6;
      setMbps(speed);
      setDetail(`${(received / 1024 / 1024).toFixed(1)} MB in ${seconds.toFixed(1)} s`);
      setState('done');
    } catch (err) {
      if (runId !== runIdRef.current) return;
      setState('error');
      setDetail(err.name === 'TimeoutError'
        ? 'The test timed out after 30 seconds — the connection is very slow.'
        : `Could not complete the test (${err.message}).`);
    }
  };

  const v = mbps === null ? null : verdict(mbps);

  return (
    <section className="sp-panel" aria-label="Speed test">
      <div className="sp-speed-readout">
        {state === 'running' && <div className="sp-speed-num">Testing…</div>}
        {state === 'done' && (
          <>
            <div className="sp-speed-num">
              {mbps.toFixed(1)}<span> Mbps</span>
            </div>
            <div className={`sp-speed-verdict ${v.tone}`}>{v.label}</div>
          </>
        )}
        {(state === 'idle' || state === 'error') && (
          <div className="sp-speed-num sp-speed-idle">—<span> Mbps</span></div>
        )}
        <div className="sp-speed-detail">{detail || 'Press start to measure your connection.'}</div>
      </div>

      <div className="sp-panel-actions">
        <button type="button" className="btn-red" onClick={run} disabled={state === 'running'}>
          {state === 'running' ? 'Testing…' : state === 'done' || state === 'error' ? 'Test Again' : 'Start Test'}
        </button>
      </div>
    </section>
  );
}
