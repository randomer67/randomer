'use client';
import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // 1. 初始化 Socket 连接
  useEffect(() => {
    socketRef.current = io('https://randomer-backend.onrender.com');

    socketRef.current.on('connect', () => console.log('Socket Connected'));
    socketRef.current.on('onlineCount', (count) => setOnlineCount(count));

    // 监听匹配成功
    socketRef.current.on('matchFound', async (data) => {
      setIsMatching(false);
      setIsConnected(true);
      setMessages([]);
      
      // 确保本地摄像头已经打开，再建立连接
      if (!localStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } catch (err) {
          alert('无法获取摄像头/麦克风权限');
          return;
        }
      }
      createPeerConnection(data.peerId);
    });

    // 监听信令（Offer, Answer, ICE）
        socketRef.current.on('signal', async (data) => {
      if (!peerConnectionRef.current) return;

      try {
        if (data.type === 'offer') {
          // 确保 remoteDescription 没有被设置过
          if (peerConnectionRef.current.signalingState !== 'stable') {
            await peerConnectionRef.current.setLocalDescription({ type: 'rollback' });
          }
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit('signal', { targetId: data.senderId, type: 'answer', sdp: answer.sdp });
        } else if (data.type === 'answer') {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        } else if (data.type === 'ice-candidate' && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    });

    socketRef.current.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // 2. 创建 WebRTC 连接
  const createPeerConnection = (peerId) => {
    // 使用多个公共 STUN 服务器，提高网络穿透成功率
    const pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "e2ff818dc262cb7d3527f05d",
      credential: "KncpdA0bUtPQfpML",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "e2ff818dc262cb7d3527f05d",
      credential: "KncpdA0bUtPQfpML",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "e2ff818dc262cb7d3527f05d",
      credential: "KncpdA0bUtPQfpML",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "e2ff818dc262cb7d3527f05d",
      credential: "KncpdA0bUtPQfpML",
    },
  ],
});
    peerConnectionRef.current = pc;

    // 把本地音视频流加进去
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    // 接收对方的视频流
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    // 收集网络候选者（ICE）并发送给对方
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { targetId: peerId, type: 'ice-candidate', candidate: event.candidate });
      }
    };
  };

  // 3. 开始匹配
  const startMatch = async () => {
    if (isMatching || isConnected) return;
    setIsMatching(true);

    // 提前打开摄像头
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socketRef.current.emit('findMatch', {});
    } catch (err) {
      alert('无法获取摄像头/麦克风权限');
      setIsMatching(false);
    }
  };

  // 4. 停止/下一个
  const handleStop = () => {
    setIsConnected(false);
    setIsMatching(false);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMessages([]);
  };

  const handleNext = () => {
    handleStop();
    startMatch();
  };

  // 5. 发送消息
  const sendMessage = () => {
    if (!inputMsg.trim() || !isConnected) return;
    const msg = { sender: 'You', text: inputMsg };
    socketRef.current.emit('chatMessage', msg);
    setMessages(prev => [...prev, msg]);
    setInputMsg('');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#000', color: '#fff' }}>
      {/* 侧边栏 */}
      <div style={{ width: '250px', background: '#121212', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1>Randomer</h1>
        <div style={{ color: '#22c55e' }}>● {onlineCount} 人在线</div>
        <button onClick={startMatch} disabled={isMatching || isConnected} style={{ padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
          {isMatching ? '寻找中...' : '开始匹配'}
        </button>
        <button onClick={handleNext} disabled={!isConnected} style={{ padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>下一个</button>
        <button onClick={handleStop} disabled={!isMatching && !isConnected} style={{ padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>停止</button>
      </div>

      {/* 视频和聊天区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          {/* 对方视频 */}
          <div style={{ flex: 1, background: '#111', position: 'relative' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {!isConnected && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>{isMatching ? '正在寻找...' : '等待匹配'}</div>}
          </div>
          {/* 我的视频 */}
          <div style={{ flex: 1, background: '#222' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* 聊天框 */}
        <div style={{ height: '150px', background: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}><strong>{msg.sender}:</strong> {msg.text}</div>
            ))}
          </div>
          <div style={{ display: 'flex', padding: '8px', gap: '8px' }}>
            <input value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={isConnected ? '输入消息...' : '匹配后可聊天'} disabled={!isConnected} style={{ flex: 1, padding: '8px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff' }} />
            <button onClick={sendMessage} disabled={!isConnected} style={{ padding: '8px 16px', background: isConnected ? '#3b82f6' : '#555', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}