// 1) Pega aquí los datos de tu proyecto Supabase (Project Settings > API).
const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_PUBLISHABLE_O_ANON_KEY";

const $ = id => document.getElementById(id);
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PEGA_AQUI") && !SUPABASE_ANON_KEY.includes("PEGA_AQUI");
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let roomCode="", role="", inviteSecret="", myToken="", roomState=null, poller=null, ink=false, drawing=false;
const canvas=$("signature"), ctx=canvas.getContext("2d");

function randomToken(bytes=24){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("");}
function randomRoom(){return randomToken(4).toUpperCase();}
function msg(text){$("setupMsg").textContent=text;}
function signMsg(text){$("signMsg").textContent=text;}
function switchTab(join){$("createPanel").hidden=join;$("joinPanel").hidden=!join;$("tabCreate").classList.toggle("active",!join);$("tabJoin").classList.toggle("active",join);}
$("tabCreate").onclick=()=>switchTab(false);$("tabJoin").onclick=()=>switchTab(true);

function requireConfig(){if(!db){msg("Primero configura SUPABASE_URL y SUPABASE_ANON_KEY en app.js y vuelve a publicar el sitio.");return false;}return true;}
async function rpc(name,args){const {data,error}=await db.rpc(name,args);if(error)throw error;return data;}
function openWorkspace(){ $("setup").hidden=true;$("workspace").hidden=false;$("roomLabel").textContent=roomCode;$("roleLabel").textContent=role==="owner"?"Participante 1":"Participante 2";$("signTitle").textContent=role==="owner"?"Firma de Participante 1":"Firma de Participante 2"; }
$("createBtn").onclick=async()=>{
 if(!requireConfig())return;const name=$("ownerName").value.trim();if(!name){msg("Escribe tu nombre.");return;}
 const code=randomRoom(), token=randomToken(), invite=randomToken(16);
 try{await rpc("create_private_room",{p_room_code:code,p_owner_token:token,p_invite_token:invite,p_owner_name:name});
 roomCode=code;role="owner";myToken=token;inviteSecret=invite;$("signName").value=name;openWorkspace();await refresh();startPolling();
 $("copyInvite").onclick=()=>copyInvite();
 }catch(e){msg("No se pudo crear la sala: "+e.message);}
};
$("joinBtn").onclick=async()=>{
 if(!requireConfig())return;const code=$("roomInput").value.trim().toUpperCase(),invite=$("inviteInput").value.trim(),name=$("guestName").value.trim();
 if(!code||!invite||!name){msg("Completa código, clave de invitación y nombre.");return;}
 const token=randomToken();
 try{await rpc("join_private_room",{p_room_code:code,p_invite_token:invite,p_guest_token:token,p_guest_name:name});
 roomCode=code;role="guest";myToken=token;inviteSecret=invite;$("signName").value=name;openWorkspace();await refresh();startPolling();
 $("copyInvite").hidden=true;
 }catch(e){msg("No se pudo entrar: "+e.message);}
};
async function copyInvite(){const text=`Sala: ${roomCode}\nClave de invitación: ${inviteSecret}\nAbre la página y selecciona “Unirme a una sala”.`;try{await navigator.clipboard.writeText(text);alert("Invitación copiada. Envíala en privado.");}catch{alert(text);}}
async function refresh(){
 try{
  roomState=await rpc("get_private_room",{p_room_code:roomCode,p_participant_token:myToken});
  render();
 }catch(e){$("turnMessage").textContent="No se pudo actualizar la sala. Comprueba tu conexión.";}
}
function render(){
 const s=roomState;if(!s)return;
 $("p1name").textContent=s.owner_name||"Pendiente";$("p2name").textContent=s.guest_name||"Pendiente";
 $("p1status").textContent=s.owner_signature?"Firma registrada":"Esperando firma";
 $("p2status").textContent=s.guest_signature?"Firma registrada":(s.owner_signature?"Es tu turno / esperando firma":"Esperando turno");
 $("person1").classList.toggle("done",!!s.owner_signature);$("person2").classList.toggle("done",!!s.guest_signature);
 const myTurn=(role==="owner"&&!s.owner_signature)||(role==="guest"&&!!s.owner_signature&&!s.guest_signature);
 $("signPanel").hidden=!myTurn||!!s.completed_at;
 $("turnMessage").textContent=s.completed_at?"Acuerdo finalizado: ambas firmas están registradas.":s.owner_signature?"Participante 1 terminó. Participante 2 tiene el turno.": "Esperando que Participante 1 firme y finalice.";
 if(s.owner_signature&&!s.guest_signature&&role==="owner")$("turnMessage").textContent="Ya entregaste el turno. Tu firma quedó guardada; espera a que Participante 2 termine.";
 if(s.completed_at){
  $("finalPanel").hidden=false;$("finalName1").textContent=s.owner_name;$("finalName2").textContent=s.guest_name;
  $("finalSig1").src=s.owner_signature;$("finalSig2").src=s.guest_signature;
  $("finalDate").textContent=new Date(s.completed_at).toLocaleString("es-CO");$("finalRoom").textContent=roomCode;
 }
}
function startPolling(){if(poller)clearInterval(poller);poller=setInterval(refresh,2000);}
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
canvas.addEventListener("pointerdown",e=>{if($("signPanel").hidden)return;drawing=true;canvas.setPointerCapture(e.pointerId);const p=pointer(e);ctx.beginPath();ctx.moveTo(p.x,p.y);});
canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=pointer(e);ctx.lineWidth=4;ctx.lineCap="round";ctx.strokeStyle="#18324b";ctx.lineTo(p.x,p.y);ctx.stroke();ink=true;});
["pointerup","pointercancel","pointerleave"].forEach(ev=>canvas.addEventListener(ev,()=>drawing=false));
$("clearSig").onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ink=false;};
$("submitSig").onclick=async()=>{
 const name=$("signName").value.trim();if(!name||!ink){signMsg("Escribe tu nombre y dibuja tu firma antes de finalizar.");return;}
 $("submitSig").disabled=true;signMsg("Guardando firma...");
 try{
  const signature=canvas.toDataURL("image/png");
  await rpc("submit_private_signature",{p_room_code:roomCode,p_participant_token:myToken,p_full_name:name,p_signature_data:signature});
  signMsg("Firma registrada. El turno se ha entregado a la otra persona.");await refresh();
 }catch(e){signMsg("No se pudo registrar: "+e.message);}
 finally{$("submitSig").disabled=false;}
};
$("printBtn").onclick=()=>window.print();
if(!configured){msg("Configuración pendiente: sigue el archivo README para conectar Supabase.");}
