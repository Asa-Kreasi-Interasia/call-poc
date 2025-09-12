import { useState, useEffect, useRef } from 'react';
import JsSIP from 'jssip';

const user = "1002";
const pass = "8ashgvgwi3onth2387AS";
const sipServer = 'wss://sip-webrtc.asakreasi.com:8089/ws';

export const useSipClient = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const ua = useRef(null);
  const session = useRef(null);

  useEffect(() => {
    const socket = new JsSIP.WebSocketInterface(sipServer);
    socket.via_transport = "tcp";

    const userAgent = JsSIP.version;
    const configuration = {
      'uri': `sip:${user}@sip-webrtc.asakreasi.com:8089`,
      'password': pass,
      'sockets': [socket],
      'register_expires': 180,
      'session_timers': false,
      'user_agent': `JsSip-${userAgent}`
    };

    ua.current = new JsSIP.UA(configuration);
    JsSIP.debug.enable('JsSIP:*');

    ua.current.on('registered', () => {
      setIsRegistered(true);
      console.log('Successfully registered to SIP server');
    });

    ua.current.on('unregistered', () => {
      setIsRegistered(false);
      console.log('Unregistered from SIP server');
    });

    ua.current.on('registrationFailed', (ev) => {
      setIsRegistered(false);
      console.error('Registration failed:', ev.cause);
      alert('Registering on SIP server failed with error: ' + ev.cause);
    });

    ua.current.on('newRTCSession', (ev) => {
      if (session.current) {
        session.current.terminate();
      }
      session.current = ev.session;

      session.current.on('getusermediafailed', (ev) => {
        console.error('getusermediafailed', ev);
        alert('Could not get access to your camera and microphone. Please check your browser permissions.');
      });

      session.current.on('peerconnection', () => {
        console.log('PeerConnection established');
      });

      session.current.on('ended', () => {
        session.current = null;
      });

      session.current.on('failed', () => {
        session.current = null;
      });

      if (session.current.direction === 'incoming') {
        const options = {
          mediaConstraints: { audio: true, video: true },
          pcConfig: {
            rtcpMuxPolicy: 'require',
            iceServers: []
          },
        };
        session.current.answer(options);
      }
    });

    ua.current.start();

    // Cleanup function to stop the client when the component unmounts
    return () => {
      ua.current.stop();
    };
  }, []);

  const call = (numTel) => {
    if (!ua.current || !isRegistered) {
      alert('SIP client is not ready. Please wait.');
      return;
    }

    const options = {
      mediaConstraints: { audio: true, video: true },
      pcConfig: {
        rtcpMuxPolicy: 'require',
        iceServers: []
      },
    };

    ua.current.call(numTel.toString(), options);
  };

  return { call, ua, session };
};