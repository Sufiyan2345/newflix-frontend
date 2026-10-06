export default function SpeedTestPage() {
  return (
    <main>
      <iframe
        src="https://fast.com/"
        title="FAST.com speed test"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483000,
          display: 'block',
          width: '100vw',
          height: '100vh',
          border: 0,
          background: '#fff',
        }}
      />
    </main>
  );
}