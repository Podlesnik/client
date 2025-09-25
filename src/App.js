// src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'; // opcjonalnie – style poniżej

const socket = io(' https://client-m62z.onrender.com');


function App() {
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [joined, setJoined]=useState(false);
  const [room, setRoom]   = useState(null);
  const [msg, setMsg]     = useState('');

  useEffect(()=>{
    socket.on('room',r=>{ setRoom(r); });
    socket.on('connect',()=>setMsg(''));
    socket.on('disconnect',()=>setMsg('Brak połączenia z serwerem'));
  },[]);

  const join=()=>{ if(name.trim()&&code.trim()){ socket.emit('join',{code,name}); setJoined(true); }};
  const start=()=>socket.emit('start');
  const hit =()=>socket.emit('hit');
  const stand=()=>socket.emit('stand');

  if(!joined)return(
    <div className="box">
      <h1>Blackjack</h1>
      <input placeholder="Twój nick" value={name} onChange={e=>setName(e.target.value)}/>
      <input placeholder="Kod pokoju" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <button onClick={join}>Dołącz</button>
      <p className="hint">Podaj ten sam kod co znajomi – bez różnicy wielkości liter.</p>
    </div>
  );

  if(!room)return(<div className="box">Łączenie…</div>);

  const me=room.players.find(p=>p.id===socket.id);
  const myTurn=room.phase==='playing'&&room.players[room.turn]?.id===socket.id;

  return(
    <div className="table">
      <div className="top">
        <h2>Pokój <b>{code}</b></h2>
        <button className="tiny" onClick={()=>window.location.reload()}>Wyjdź</button>
      </div>

      {room.phase==='waiting'&&(
        <div className="center">
          <p>Czekamy… ({room.players.length} graczy)</p>
          {room.players.length>0&&room.players[0].id===socket.id&&
            <button onClick={start}>Start gry</button>}
        </div>
      )}

      {room.phase!=='waiting'&&(
        <>
          <div className="dealer">
            <h3>Dealer</h3>
            <Hand cards={room.dealer}/>
            <span className="val">{valueStr(room.dealer)}</span>
          </div>

          <div className="players">
            {room.players.map((p,i)=>(
              <div key={p.id} className={'player '+(room.turn===i?'active':'')}>
                <b>{p.name}</b>
                <Hand cards={p.hand}/>
                <span className="val">{valueStr(p.hand)} {p.bust&&'<bust>'} {p.result&&`(${p.result})`}</span>
              </div>
            ))}
          </div>

          {myTurn&&(
            <div className="controls">
              <button onClick={hit}>Hit</button>
              <button onClick={stand}>Stand</button>
            </div>
          )}
        </>
      )}

      {msg&&<div className="msg">{msg}</div>}
    </div>
  );
}

// pomocnicze
const valueStr=h=>{ const v=valueOf(h); return v>0?`(${v})`:''; };
const valueOf=h=>{
  let v=0,aces=0;
  h.forEach(c=>{
    if(c.value==='A'){ aces++; v+=11; }
    else if(['J','Q','K'].includes(c.value)) v+=10;
    else v+=Number(c.value);
  });
  while(v>21&&aces--) v-=10;
  return v;
};

const Hand=({cards})=>(
  <div className="hand">
    {cards.map((c,i)=>(
      <div key={i} className={'card '+c.suit}>
        {c.hidden?'🂠':<><span>{c.value}</span><span>{c.suit}</span></>}
      </div>
    ))}
  </div>
);

export default App;