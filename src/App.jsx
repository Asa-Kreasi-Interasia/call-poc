import React, { useEffect, useRef } from 'react';
import { useSipClient } from './useSipClient';
import './App.css'; // We'll create this file next

function App() {
  const { call, session } = useSipClient();
  const selfView = useRef(null);
  const remoteView = useRef(null);

  useEffect(() => {
    const currentSession = session.current;
    if (!currentSession || !selfView.current || !remoteView.current) {
      return;
    }

    const addStream = () => {
      if (currentSession.connection) {
        currentSession.connection.addEventListener('addstream', (e) => {
          if (remoteView.current) {
            remoteView.current.srcObject = e.stream;
          }
        });

        if (selfView.current) {
          selfView.current.srcObject = currentSession.connection.getLocalStreams()[0];
        }
      }
    };

    currentSession.on('peerconnection', addStream);

    return () => {
      currentSession.off('peerconnection', addStream);
    };
  }, [session.current]); // The effect will re-run when the session changes

  return (
    <div className="app-container">
      <h1>WebRTC SIP Demo</h1>
      <div className="video-container">
        <video ref={selfView} autoPlay muted></video>
        <video ref={remoteView} autoPlay></video>
      </div>
      <p>
        <button onClick={() => call('082128525299')}>Test</button>
        <button onClick={() => call('9082128525299')}>Test</button>
      </p>
    </div>
  );
}

export default App;