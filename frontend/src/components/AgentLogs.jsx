import { useEffect, useState, useRef } from 'react';

const AgentLogs = ({ jobId }) => {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`http://localhost:8000/api/v1/logs/jobs/${jobId}/stream`);
    
    setConnected(true);
    
    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs(prev => [...prev, log]);
      } catch (e) {
        console.error('Failed to parse log:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [jobId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'score': return '#4caf50';
      case 'decision': return '#2196f3';
      case 'info': return '#64b5f6';
      default: return '#888888';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'score': return '📊';
      case 'decision': return '🎯';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      borderRadius: '8px',
      padding: '1rem',
      fontFamily: 'monospace',
      fontSize: '13px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #333'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #333',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <span style={{ fontWeight: 'bold' }}>Agent Workflow Logs</span>
          {connected ? (
            <span style={{
              backgroundColor: '#4caf50',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '12px',
              marginLeft: '0.5rem'
            }}>
              LIVE
            </span>
          ) : (
            <span style={{
              backgroundColor: '#f44336',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '12px',
              marginLeft: '0.5rem'
            }}>
              DISCONNECTED
            </span>
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #555',
            color: '#d4d4d4',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {logs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#888',
            padding: '2rem',
            fontStyle: 'italic'
          }}>
            {connected ? 'Waiting for agent activity...' : 'Connecting to agent...'}
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                borderLeft: `3px solid ${getLogColor(log.type)}`,
                paddingLeft: '0.75rem',
                marginLeft: '0.25rem',
                paddingBottom: '0.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#888', fontSize: '11px' }}>
                  {formatTimestamp(log.timestamp)}
                </span>
                <span style={{
                  backgroundColor: getLogColor(log.type) + '20',
                  color: getLogColor(log.type),
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {getLogIcon(log.type)} {log.type.toUpperCase()}
                </span>
                <span style={{ color: '#d4d4d4' }}>
                  {log.message}
                </span>
              </div>
              
              {log.data && (
                <div style={{
                  marginTop: '0.5rem',
                  marginLeft: '1rem',
                  padding: '0.5rem',
                  backgroundColor: '#2d2d2d',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #333',
        fontSize: '11px',
        color: '#888',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>📊 {logs.filter(l => l.type === 'score').length} scores processed</span>
        <span>🎯 {logs.filter(l => l.type === 'decision').length} decisions made</span>
        <span>⚠️ {logs.filter(l => l.type === 'warning').length} warnings</span>
        <span>❌ {logs.filter(l => l.type === 'error').length} errors</span>
      </div>
    </div>
  );
};

export default AgentLogs;