'use client';
import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const translations = {
  zh: { title: 'Randomer', online: '人在线', country: '国家/地区', gender: '性别', any: '不限', male: '男', female: '女', stranger: '陌生人', you: '我', startHint: '向右滑动或按 → 开始', searching: '正在寻找...', typeMsg: '输入消息...', noMatch: '匹配后可聊天', global: '🌍 全球', asia: '🌏 亚洲', europe: '🌍 欧洲', northAmerica: '🌎 北美洲', southAmerica: '🌎 南美洲', africa: '🌍 非洲', oceania: '🌏 大洋洲', CN: '🇨🇳 中国', JP: '🇯🇵 日本', KR: '🇰🇷 韩国', IN: '🇮🇳 印度', TH: '🇹🇭 泰国', VN: '🇻🇳 越南', ID: '🇮🇩 印尼', GB: '🇬🇧 英国', FR: '🇫🇷 法国', DE: '🇩🇪 德国', RU: '🇷🇺 俄罗斯', IT: '🇮🇹 意大利', ES: '🇪🇸 西班牙', US: '🇺🇸 美国', CA: '🇨🇦 加拿大', MX: '🇲🇽 墨西哥', BR: '🇧🇷 巴西', AR: '🇦🇷 阿根廷', CO: '🇨🇴 哥伦比亚', EG: '🇪🇬 埃及', ZA: '🇿🇦 南非', NG: '🇳🇬 尼日利亚', AU: '🇦🇺 澳大利亚', NZ: '🇳🇿 新西兰' },
  en: { title: 'Randomer', online: 'online', country: 'Country', gender: 'Gender', any: 'Any', male: 'Male', female: 'Female', stranger: 'Stranger', you: 'You', startHint: 'Swipe Right or Press →', searching: 'Searching...', typeMsg: 'Type a message...', noMatch: 'Chat when matched', global: '🌍 Global', asia: '🌏 Asia', europe: '🌍 Europe', northAmerica: '🌎 North America', southAmerica: '🌎 South America', africa: '🌍 Africa', oceania: '🌏 Oceania', CN: '🇨🇳 China', JP: '🇯🇵 Japan', KR: '🇰🇷 South Korea', IN: '🇮🇳 India', TH: '🇹🇭 Thailand', VN: '🇻🇳 Vietnam', ID: '🇮🇩 Indonesia', GB: '🇬🇧 UK', FR: '🇫🇷 France', DE: '🇩🇪 Germany', RU: '🇷🇺 Russia', IT: '🇮🇹 Italy', ES: '🇪🇸 Spain', US: '🇺🇸 USA', CA: '🇨🇦 Canada', MX: '🇲🇽 Mexico', BR: '🇧🇷 Brazil', AR: '🇦🇷 Argentina', CO: '🇨🇴 Colombia', EG: '🇪🇬 Egypt', ZA: '🇿🇦 South Africa', NG: '🇳🇬 Nigeria', AU: '🇦🇺 Australia', NZ: '🇳🇿 New Zealand' },
  ru: { title: 'Randomer', online: 'в сети', country: 'Страна', gender: 'Пол', any: 'Любой', male: 'Мужской', female: 'Женский', stranger: 'Незнакомец', you: 'Вы', startHint: 'Свайп вправо или →', searching: 'Поиск...', typeMsg: 'Введите сообщение...', noMatch: 'Чат доступен после матча', global: '🌍 Глобально', asia: '🌏 Азия', europe: '🌍 Европа', northAmerica: '🌎 Сев. Америка', southAmerica: '🌎 Юж. Америка', africa: '🌍 Африка', oceania: '🌏 Океания', CN: '🇨🇳 Китай', JP: '🇯🇵 Япония', KR: '🇰🇷 Южная Корея', IN: '🇮🇳 Индия', TH: '🇹🇭 Таиланд', VN: '🇻🇳 Вьетнам', ID: '🇮🇩 Индонезия', GB: '🇬🇧 Великобритания', FR: '🇫🇷 Франция', DE: '🇩🇪 Германия', RU: '🇷🇺 Россия', IT: '🇮🇹 Италия', ES: '🇪🇸 Испания', US: '🇺🇸 США', CA: '🇨🇦 Канада', MX: '🇲🇽 Мексика', BR: '🇧🇷 Бразилия', AR: '🇦🇷 Аргентина', CO: '🇨🇴 Колумбия', EG: '🇪🇬 Египет', ZA: '🇿🇦 ЮАР', NG: '🇳🇬 Нигерия', AU: '🇦🇺 Австралия', NZ: '🇳🇿 Новая Зеландия' }
};

const countryKeys = [
  { key: 'global', isGroup: false }, { key: 'asia', isGroup: true }, { key: 'CN', isGroup: false }, { key: 'JP', isGroup: false }, { key: 'KR', isGroup: false }, { key: 'IN', isGroup: false }, { key: 'TH', isGroup: false }, { key: 'VN', isGroup: false }, { key: 'ID', isGroup: false }, { key: 'europe', isGroup: true }, { key: 'GB', isGroup: false }, { key: 'FR', isGroup: false }, { key: 'DE', isGroup: false }, { key: 'RU', isGroup: false }, { key: 'IT', isGroup: false }, { key: 'ES', isGroup: false }, { key: 'northAmerica', isGroup: true }, { key: 'US', isGroup: false }, { key: 'CA', isGroup: false }, { key: 'MX', isGroup: false }, { key: 'southAmerica', isGroup: true }, { key: 'BR', isGroup: false }, { key: 'AR', isGroup: false }, { key: 'CO', isGroup: false }, { key: 'africa', isGroup: true }, { key: 'EG', isGroup: false }, { key: 'ZA', isGroup: false }, { key: 'NG', isGroup: false }, { key: 'oceania', isGroup: true }, { key: 'AU', isGroup: false }, { key: 'NZ', isGroup: false },
];

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('zh');
  const [selectedCountry, setSelectedCountry] = useState('global');
  const [selectedGender, setSelectedGender] = useState('any');
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const startXRef = useRef(0);

  const t = translations[selectedLanguage as keyof typeof translations] || translations.zh;

  useEffect(() => {
    const randomName = `User_${Math.random().toString(36).substring(2, 7)}`;
    socketRef.current = io('https://randomer-backend.onrender.com', { auth: { username: randomName } });

    socketRef.current.on('connect', () => console.log('Connected'));
    socketRef.current.on('onlineCount', (count: number) => setOnlineCount(count));
    
    socketRef.current.on('matchFound', async (data: any) => {
      setIsMatching(false);
      setIsConnected(true);
      setMatchStatus('');
      setMessages([]);
      await createPeerConnection(data.peerId);
    });

    // 【关键修复】：处理信令，正确识别 offer 和 answer 的发送者
    socketRef.current.on('signal', async (data: any) => {
      if (data.type === 'offer') {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer);
        socketRef.current?.emit('signal', { targetId: data.senderId, type: 'answer', sdp: answer });
      } else if (data.type === 'answer') {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === 'ice-candidate' && data.candidate) {
        await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socketRef.current.on('chatMessage', (msg: {sender: string, text: string}) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const createPeerConnection = async (peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current?.emit('signal', { targetId: peerId, type: 'ice-candidate', candidate: event.candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('signal', { targetId: peerId, type: 'offer', sdp: offer.sdp });
    };

  const startMatch = () => {
    if (isMatching || isConnected) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsMatching(true);
        setMatchStatus(t.searching);
        socketRef.current?.emit('findMatch', { country: selectedCountry, gender: selectedGender });
      })
      .catch(() => alert('Camera not available'));
  };

  const handleNext = () => {
    setIsConnected(false);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMessages([]);
    startMatch();
  };

  const handleStop = () => {
    setIsConnected(false);
    setIsMatching(false);
    setMatchStatus('');
    setMessages([]);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(tr => tr.stop()); localStreamRef.current = null; }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const sendMessage = () => {
    if (!inputMsg.trim() || !isConnected) return;
    const msg = { sender: t.you, text: inputMsg };
    socketRef.current?.emit('chatMessage', msg);
    setMessages(prev => [...prev, msg]);
    setInputMsg('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { if (!isConnected && !isMatching) startMatch(); else if (isConnected) handleNext(); } 
      else if (e.key === 'ArrowLeft') { if (isConnected || isMatching) handleStop(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, isMatching]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => { startXRef.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientX - startXRef.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) { if (!isConnected && !isMatching) startMatch(); else if (isConnected) handleNext(); } 
        else { if (isConnected || isMatching) handleStop(); }
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => { window.removeEventListener('touchstart', handleTouchStart); window.removeEventListener('touchend', handleTouchEnd); };
  }, [isConnected, isMatching]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#000', overflow: 'hidden', touchAction: 'none' }}>
      <div style={{ width: isSidebarOpen ? '16.66%' : '0', minWidth: isSidebarOpen ? '200px' : '0', maxWidth: '300px', height: '100vh', background: '#121212', borderRight: '1px solid #333', transition: 'all 0.3s ease-in-out', overflowY: 'auto', overflowX: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{t.title}</div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ padding: '6px 10px', background: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>✕</button>
          </div>
          <div style={{ fontSize: '12px', color: '#22c55e' }}>● {onlineCount} {t.online}</div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>Language</label>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none' }}>
              <option value="zh">🇨🇳 中文</option><option value="en">🇬🇧 English</option><option value="ru">🇷🇺 Русский</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>{t.country}</label>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none' }}>
              {countryKeys.map(c => c.isGroup ? (<optgroup key={c.key} label={t[c.key as keyof typeof t] as string} />) : (<option key={c.key} value={c.key}>{t[c.key as keyof typeof t] as string}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>{t.gender}</label>
            <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none' }}>
              <option value="any">{t.any}</option><option value="male">{t.male}</option><option value

---
代码都替换好了，接下来最关键的一步：
1. 在终端运行 `git add .`、`git commit -m "Fix WebRTC signaling"`、`git push origin main`
2. 等 Vercel 和 Render 都更新完成后，**彻底关闭电脑和手机上的所有网页标签，重新打开测试**

这次应该就能看到双方的画面了！