(()=>{var a={};a.id=698,a.ids=[698,943],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},6187:(a,b,c)=>{"use strict";c.d(b,{default:()=>B});var d=c(21124),e=c(38301),f=c(42378),g=c(84342),h=c(12622),i=c(85846),j=c(50324);function k({stats:a,users:b}){let c=b.filter(a=>a.lastSeen&&Date.now()-a.lastSeen<12e4),f=c.length,g=(0,e.useRef)(null),h=(0,e.useRef)(null);return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{className:"stats-grid",children:[(0,d.jsxs)("div",{className:"stat-card",children:[(0,d.jsx)("div",{className:"stat-icon users",children:(0,d.jsx)(i.I,{name:"user",size:20})}),(0,d.jsx)("div",{className:"stat-value",children:(a?.totalUsers||0).toLocaleString()}),(0,d.jsx)("div",{className:"stat-label",children:"Користувачі"})]}),(0,d.jsxs)("div",{className:"stat-card",children:[(0,d.jsx)("div",{className:"stat-icon online",children:(0,d.jsx)("span",{style:{display:"inline-block",width:"8px",height:"8px",borderRadius:"50%",background:"#2d7a4f"}})}),(0,d.jsx)("div",{className:"stat-value",children:f.toLocaleString()}),(0,d.jsx)("div",{className:"stat-label",children:"Онлайн зараз"})]}),(0,d.jsxs)("div",{className:"stat-card",children:[(0,d.jsx)("div",{className:"stat-icon invites",children:(0,d.jsx)(i.I,{name:"paper-plane-tilt",size:20})}),(0,d.jsx)("div",{className:"stat-value",children:(a?.totalInvites||0).toLocaleString()}),(0,d.jsx)("div",{className:"stat-label",children:"Запрошення"})]}),(0,d.jsxs)("div",{className:"stat-card",children:[(0,d.jsx)("div",{className:"stat-icon accepted",children:(0,d.jsx)(i.I,{name:"check-circle",size:20})}),(0,d.jsx)("div",{className:"stat-value",children:(a?.acceptedInvites||0).toLocaleString()}),(0,d.jsx)("div",{className:"stat-label",children:"Прийняті"})]}),(0,d.jsxs)("div",{className:"stat-card",children:[(0,d.jsx)("div",{className:"stat-icon active",children:(0,d.jsx)(i.I,{name:"chart-bar",size:20})}),(0,d.jsx)("div",{className:"stat-value",children:(a?.activeUsers||0).toLocaleString()}),(0,d.jsx)("div",{className:"stat-label",children:"Активні (7д)"})]})]}),(0,d.jsxs)("div",{className:"chart-grid",children:[(0,d.jsxs)("div",{className:"chart-card",children:[(0,d.jsx)("div",{className:"chart-card-title",children:(0,d.jsx)("h2",{children:"Активність"})}),(0,d.jsx)("canvas",{ref:g,width:400,height:220,className:"chart-canvas"})]}),(0,d.jsxs)("div",{className:"chart-card",children:[(0,d.jsx)("div",{className:"chart-card-title",children:(0,d.jsx)("h2",{children:"Ролі"})}),(0,d.jsx)("canvas",{ref:h,width:400,height:220,className:"chart-canvas"})]})]}),(0,d.jsxs)("div",{className:"grid2",style:{marginBottom:"28px"},children:[(0,d.jsxs)("div",{className:"table-card",children:[(0,d.jsx)("div",{className:"table-header",children:(0,d.jsx)("h2",{children:"Аудиторія та безпека"})}),(0,d.jsxs)("div",{style:{padding:"20px",display:"flex",flexDirection:"column",gap:"14px"},children:[(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"crown",size:20})," Засновники"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a?.roleCounts?.founder||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"wrench",size:14})," Тех-адміністратори"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a?.roleCounts?.techAdmin||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"shield-check",size:20})," Модератори"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a?.roleCounts?.moderator||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"users",size:20})," Звичайні користувачі"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a?.roleCounts?.user||0})]}),(0,d.jsxs)("div",{style:{borderTop:"1px solid var(--border)",paddingTop:"10px",display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--red)",fontWeight:500},children:[(0,d.jsx)(i.I,{name:"prohibit",size:20})," Заблоковані користувачі"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--red)"},children:a?.bannedCount||0})]})]})]}),(0,d.jsxs)("div",{className:"table-card",children:[(0,d.jsx)("div",{className:"table-header",children:(0,d.jsx)("h2",{children:"Статуси зустрічей та взаємодія"})}),(0,d.jsxs)("div",{style:{padding:"20px",display:"flex",flexDirection:"column",gap:"14px"},children:[(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"check-circle",size:20})," Прийняті запрошення"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--green)"},children:a?.acceptedInvites||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"x-circle",size:20})," Відхилені запрошення"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--red)"},children:a?.declinedInvites||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"calendar-blank",size:20})," Перенесені події"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--gold)"},children:a?.rescheduleInvites||0})]}),(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[(0,d.jsx)(i.I,{name:"clock",size:20})," В очікуванні відповіді"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:(a?.totalInvites||0)-(a?.acceptedInvites||0)-(a?.declinedInvites||0)-(a?.rescheduleInvites||0)})]}),(0,d.jsxs)("div",{style:{borderTop:"1px solid var(--border)",paddingTop:"10px",display:"flex",justifyContent:"space-between",fontSize:".9rem"},children:[(0,d.jsxs)("span",{style:{color:"var(--ink)",fontWeight:500},children:[(0,d.jsx)(i.I,{name:"users",size:14})," Всього зв'язків дружби"]}),(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a?.totalFriendsConnections||0})]})]})]}),(0,d.jsxs)("div",{className:"table-card",style:{gridColumn:"span 2"},children:[(0,d.jsx)("div",{className:"table-header",children:(0,d.jsx)("h2",{children:"Статистика модерації скарг"})}),(0,d.jsxs)("div",{style:{padding:"20px",display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"16px",textAlign:"center"},children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:"1.6rem",fontWeight:700,color:"var(--muted)"},children:a?.reportsCount?.total||0}),(0,d.jsx)("div",{style:{fontSize:".8rem",color:"var(--muted)"},children:"Всього скарг"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:"1.6rem",fontWeight:700,color:"var(--red)"},children:a?.reportsCount?.pending||0}),(0,d.jsx)("div",{style:{fontSize:".8rem",color:"var(--red)"},children:"Очікують розгляду"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:"1.6rem",fontWeight:700,color:"var(--green)"},children:a?.reportsCount?.resolved||0}),(0,d.jsx)("div",{style:{fontSize:".8rem",color:"var(--green)"},children:"Вирішено (Схвалено)"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:"1.6rem",fontWeight:700,color:"var(--gold)"},children:a?.reportsCount?.dismissed||0}),(0,d.jsx)("div",{style:{fontSize:".8rem",color:"var(--gold)"},children:"Відхилено"})]})]})]})]}),(0,d.jsxs)("div",{className:"table-card",style:{marginBottom:"28px"},children:[(0,d.jsx)("div",{className:"table-header",children:(0,d.jsxs)("h2",{children:["У мережі зараз (",f,")"]})}),0===f?(0,d.jsxs)("div",{style:{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontStyle:"italic",fontSize:"0.95rem"},children:[(0,d.jsx)("span",{style:{display:"inline-block",width:"8px",height:"8px",borderRadius:"50%",background:"#2d7a4f",marginRight:"6px"}}),"Наразі немає користувачів у мережі"]}):(0,d.jsx)("div",{className:"table-scroll-wrap",children:(0,d.jsxs)("table",{className:"data-table",children:[(0,d.jsx)("thead",{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("th",{children:"Користувач"}),(0,d.jsx)("th",{children:"Логін"}),(0,d.jsx)("th",{children:"Роль"}),(0,d.jsx)("th",{children:"Поточна дія"})]})}),(0,d.jsx)("tbody",{children:c.map(a=>(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{children:(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[(0,d.jsx)("div",{className:"avatar avatar-sm",children:a.avatar?(0,d.jsx)("img",{src:a.avatar,alt:""}):a.name?.charAt(0)}),(0,d.jsx)("span",{style:{fontWeight:500},children:a.name})]})}),(0,d.jsxs)("td",{style:{color:"var(--muted)"},children:["@",a.login]}),(0,d.jsx)("td",{children:a.role}),(0,d.jsxs)("td",{style:{fontWeight:500,color:"var(--gold)"},children:[(0,d.jsx)("span",{className:"fb-dot ok",style:{marginRight:"6px"}}),a.currentAction||"Переглядає сайт"]})]},a.uid))})]})})]})]})}c(23312);var l=c(44943),m=c(13802);let n={founder:"FOUNDER","tech-admin":"TECH-ADMIN",moderator:"MODERATOR",user:"USER"};function o({users:a,profile:b,reload:f}){let[g,k]=(0,e.useState)(""),[o,p]=(0,e.useState)(0),[q,r]=(0,e.useState)({show:!1,title:"",message:"",onConfirm:()=>{}}),[s,t]=(0,e.useState)(!1),[u,v]=(0,e.useState)(null),w=g?a.filter(a=>a.login.toLowerCase().includes(g.toLowerCase())||a.name.toLowerCase().includes(g.toLowerCase())):a,x=Math.ceil(w.length/15),y=w.slice(15*o,(o+1)*15),z=a=>"founder"===a?100:"tech-admin"===a?90:"moderator"===a?50:10,A=z(b?.role),B=b?.role==="moderator"&&b?.role!=="tech-admin"&&b?.role!=="founder";return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("div",{style:{background:"var(--warm)",borderRadius:"12px",padding:"16px",marginBottom:"24px",border:"1px solid var(--border)"},children:(0,d.jsx)("input",{type:"text",placeholder:"Пошук за логіном чи іменем…",value:g,onChange:a=>{k(a.target.value),p(0)},style:{width:"100%",padding:"10px 14px",border:"1px solid var(--border)",borderRadius:"8px",fontSize:".88rem",background:"var(--card)"}})}),(0,d.jsxs)("div",{style:{marginBottom:"8px",fontSize:".8rem",color:"var(--muted)"},children:[w.length," користувачів"]}),(0,d.jsx)("div",{className:"table-card",children:(0,d.jsx)("div",{className:"table-scroll-wrap",children:(0,d.jsxs)("table",{className:"data-table",children:[(0,d.jsx)("thead",{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("th",{children:"Користувач"}),(0,d.jsx)("th",{children:"Логін / ID"}),(0,d.jsx)("th",{children:"Роль"}),(0,d.jsx)("th",{children:"Зареєстрований"}),(0,d.jsx)("th",{children:"Активність"}),(0,d.jsx)("th",{children:"Дії"})]})}),(0,d.jsx)("tbody",{children:0===y.length?(0,d.jsx)("tr",{children:(0,d.jsx)("td",{colSpan:6,style:{textAlign:"center",padding:"24px",color:"var(--muted)"},children:"Нікого не знайдено"})}):y.map(e=>{let g=z(e.role),k=A>=90,m=A>g,o=[{v:"user",l:"USER"},{v:"moderator",l:"MODERATOR"},{v:"tech-admin",l:"TECH-ADMIN"}];return(k||"founder"===e.role)&&o.push({v:"founder",l:"FOUNDER"}),(0,d.jsxs)("tr",{style:e.banned?{opacity:.6,background:"rgba(255,0,0,0.02)"}:{},children:[(0,d.jsx)("td",{children:(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[(0,d.jsx)("div",{className:"avatar avatar-sm",children:e.avatar?(0,d.jsx)("img",{src:e.avatar,alt:""}):e.name?.charAt(0)}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontWeight:500},children:e.name}),e.banned&&(0,d.jsxs)("div",{style:{fontSize:".7rem",color:"var(--red)",fontWeight:600},children:[(0,d.jsx)(i.I,{name:"prohibit",size:10})," Заблокований (",(a=>{if(!a)return"назавжди";let b=a-Date.now();if(b<=0)return"скоро розблокується";let c=Math.ceil(b/6e4);if(c<60)return`залишилось ${c} хв.`;let d=Math.floor(c/60);if(d<24)return`залишилось ${d} год. ${c%60} хв.`;let e=Math.floor(d/24);return`залишилось ${e} дн. ${d%24} год.`})(e.bannedUntil),")"]})]})]})}),(0,d.jsxs)("td",{children:[(0,d.jsxs)("div",{style:{color:"var(--muted)"},children:["@",e.login]}),(0,d.jsx)("div",{style:{fontFamily:"monospace",fontSize:".75rem",color:"var(--muted)"},children:e.uniqueId||"—"})]}),(0,d.jsx)("td",{children:(A>g||k)&&!B?(0,d.jsx)("select",{defaultValue:e.role||"user",onChange:c=>((c,d)=>{let e=d.target.value,g=d.target.defaultValue,i=a.find(a=>a.uid===c);r({show:!0,title:"Зміна ролі",message:`Ви дійсно хочете змінити роль користувача на "${n[e]||e}"?`,onConfirm:async()=>{try{await (0,h.v_)(c,e),await (0,h.h1)(b.uid,b.name,`Змінив роль → ${e}`,c,i?.name),f(),(0,j.o)("Роль успішно змінено","success")}catch(a){(0,j.o)("Помилка збереження","error"),d.target.value=g}},onCancel:()=>{d.target.value=g}})})(e.uid,c),style:{padding:"4px 8px",borderRadius:"6px",border:"1px solid var(--border)",background:"var(--card)",fontSize:".8rem"},children:o.map(a=>(0,d.jsx)("option",{value:a.v,children:a.l},a.v))}):(0,d.jsx)("div",{style:{fontSize:".8rem",padding:"4px 8px",borderRadius:"6px",background:"var(--border)",display:"inline-block",fontWeight:600,letterSpacing:".04em"},children:n[e.role||"user"]||(e.role||"user").toUpperCase()})}),(0,d.jsx)("td",{style:{fontSize:".82rem",color:"var(--muted)"},children:(0,l.fF)(e.createdAt)}),(0,d.jsx)("td",{style:{fontSize:".82rem",color:"var(--muted)"},children:e.lastSeen?(0,l.fF)(e.lastSeen):"Ніколи"}),(0,d.jsx)("td",{children:(0,d.jsxs)("div",{style:{display:"flex",gap:"6px",alignItems:"center"},children:[m&&e.uid!==b.uid?(0,d.jsx)("button",{className:`btn btn-sm ${e.banned?"btn-outline":"btn-red"}`,style:{padding:"4px 10px"},onClick:()=>{e.banned?r({show:!0,title:"Розблокування користувача",message:`Дійсно розблокувати користувача ${e.name}?`,onConfirm:async()=>{try{await (0,h.banUser)(e.uid,!1,null),await (0,h.h1)(b.uid,b.name,"Розблокував користувача",e.uid,e.name),f(),(0,j.o)("Користувача розблоковано","success")}catch(a){(0,j.o)("Помилка: "+(a.message||a),"error")}}}):(v(e),t(!0))},children:e.banned?"Розблокувати":"Бан"}):null,k&&e.uid!==b.uid?(0,d.jsx)("button",{className:"btn btn-sm btn-red",style:{padding:"4px 8px",display:"inline-flex",alignItems:"center",justifyContent:"center"},onClick:()=>{r({show:!0,title:"Видалення акаунту",message:`Ви дійсно хочете повністю видалити акаунт користувача ${e.name} (@${e.login})? Всі його дані, запрошення та друзі будуть видалені назавжди. Цю дію неможливо скасувати.`,isDanger:!0,onConfirm:async()=>{try{let{adminDeleteAccount:a}=await Promise.resolve().then(c.bind(c,12622));await a(e.uid,e.login,e.uniqueId),await (0,h.h1)(b.uid,b.name,`Видалив акаунт @${e.login}`,e.uid,e.name),f(),(0,j.o)("Акаунт успішно видалено","success")}catch(a){(0,j.o)("Помилка: "+(a.message||a),"error")}}})},title:"Видалити акаунт",children:(0,d.jsx)(i.I,{name:"trash",size:14})}):null,!(m&&e.uid!==b.uid)&&!(k&&e.uid!==b.uid)&&(0,d.jsx)("span",{style:{color:"var(--muted)",fontSize:".8rem"},children:"—"})]})})]},e.uid)})})]})})}),x>1&&(0,d.jsx)("div",{style:{display:"flex",justifyContent:"center",gap:"8px",marginTop:"20px",flexWrap:"wrap"},children:Array.from({length:x}).map((a,b)=>(0,d.jsx)("button",{className:`btn btn-sm ${b===o?"btn-dark":"btn-outline"}`,onClick:()=>p(b),children:b+1},b))}),s&&u&&!1,(0,d.jsx)(m.u,{isOpen:q.show,title:q.title,message:q.message,isDanger:q.isDanger,onConfirm:()=>{q.onConfirm(),r(a=>({...a,show:!1}))},onCancel:()=>{q.onCancel&&q.onCancel(),r(a=>({...a,show:!1}))}})]})}var p=c(3991),q=c.n(p);function r({invites:a,users:b,profile:c,reload:f}){let[g,j]=(0,e.useState)(""),[k,n]=(0,e.useState)(0),[o,p]=(0,e.useState)({show:!1,title:"",message:"",onConfirm:()=>{}}),r=g?a.filter(a=>a.id&&a.id.toLowerCase().includes(g.toLowerCase())||a.creatorUid&&a.creatorUid.toLowerCase().includes(g.toLowerCase())||a.title&&a.title.toLowerCase().includes(g.toLowerCase())||a.to&&a.to.toLowerCase().includes(g.toLowerCase())):a,s=Math.ceil(r.length/30),t=r.slice(30*k,(k+1)*30);return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("div",{style:{background:"var(--warm)",borderRadius:"12px",padding:"16px",marginBottom:"24px",border:"1px solid var(--border)"},children:(0,d.jsx)("input",{type:"text",placeholder:"Пошук за ID запрошення, ID користувача, іменем…",value:g,onChange:a=>{j(a.target.value),n(0)},style:{width:"100%",padding:"10px 14px",border:"1px solid var(--border)",borderRadius:"8px",fontSize:".88rem",background:"var(--card)"}})}),(0,d.jsxs)("div",{style:{marginBottom:"8px",fontSize:".8rem",color:"var(--muted)"},children:[r.length," запрошень"]}),0===t.length?(0,d.jsx)("div",{style:{background:"var(--green-bg)",borderRadius:"12px",padding:"18px",textAlign:"center"},children:(0,d.jsxs)("p",{style:{color:"var(--green)",fontSize:".95rem"},children:[(0,d.jsx)(i.I,{name:"check-circle",size:16})," Нічого не знайдено"]})}):(0,d.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:t.map(a=>{let e,g=l.aG[a.type]||l.aG.other,j=(e=a.creatorUid,b.find(a=>a.uid===e)),k=j?`(${j.uniqueId}, @${j.login})`:`(ID: ${a.creatorUid})`,m=a.isGroup?`<span style="color:var(--gold)"><Icon name="users" size={14}/> Групове (${a.title||"Без назви"})</span>`:`<span style="color:var(--ink)"><Icon name="user" size={14}/> Для: <strong>${a.to}</strong></span>`;return(0,d.jsxs)("div",{style:{background:"var(--card)",borderRadius:"12px",padding:"16px",border:"1px solid var(--border)",display:"flex",flexDirection:"column",gap:"8px"},children:[(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{style:{fontSize:".8rem",color:"var(--muted)",fontFamily:"monospace",marginBottom:"4px"},children:["ID: ",a.id]}),(0,d.jsxs)("div",{style:{fontSize:".95rem",fontWeight:600},children:[g.e," ",g.l]}),(0,d.jsx)("div",{style:{fontSize:".85rem",marginTop:"4px"},dangerouslySetInnerHTML:{__html:m}})]}),(0,d.jsxs)("div",{style:{display:"flex",gap:"8px"},children:[(0,d.jsx)(q(),{href:`/${a.isGroup?"g":"i"}/${a.id}`,target:"_blank",className:"btn btn-outline btn-sm",children:(0,d.jsx)(i.I,{name:"link",size:14})}),(0,d.jsxs)("button",{className:"btn btn-outline btn-sm",style:{color:"var(--red)",borderColor:"var(--red)"},onClick:()=>{p({show:!0,title:"Видалити запрошення",message:`Ви дійсно хочете видалити це запрошення? Цю дію не можна буде скасувати.`,isDanger:!0,onConfirm:async()=>{await (0,h.d9)(a.id,a.creatorUid,a.isGroup),(0,h.h1)(c.uid,c.name,`Видалив запрошення (${a.isGroup?"групове":"особисте"}: ${a.title||a.to||a.id})`,a.creatorUid,a.from||a.creatorName).catch(()=>{}),f&&f()}})},children:[(0,d.jsx)(i.I,{name:"trash",size:14})," Видалити"]})]})]}),a.msg&&(0,d.jsxs)("div",{style:{background:"var(--warm)",padding:"10px",borderRadius:"8px",fontSize:".85rem",color:"var(--ink)",fontStyle:"italic"},children:['"',a.msg,'"']}),(0,d.jsxs)("div",{style:{fontSize:".8rem",color:"var(--muted)",display:"flex",gap:"16px",marginTop:"4px"},children:[(0,d.jsxs)("span",{children:["Від: ",(0,d.jsx)("strong",{children:a.from||a.creatorName||"Невідомий"})," ",k]}),(0,d.jsxs)("span",{children:[a.date," ",a.time]})]})]},a.id)})}),s>1&&(0,d.jsx)("div",{style:{display:"flex",justifyContent:"center",gap:"8px",marginTop:"20px",flexWrap:"wrap"},children:Array.from({length:s}).map((a,b)=>(0,d.jsx)("button",{className:`btn btn-sm ${b===k?"btn-dark":"btn-outline"}`,onClick:()=>n(b),children:b+1},b))}),(0,d.jsx)(m.u,{isOpen:o.show,title:o.title,message:o.message,isDanger:o.isDanger,onConfirm:()=>{o.onConfirm(),p(a=>({...a,show:!1}))},onCancel:()=>p(a=>({...a,show:!1}))})]})}function s({reports:a,profile:b,reload:c}){let[f,g]=(0,e.useState)({}),[k,n]=(0,e.useState)({show:!1,title:"",message:"",onConfirm:()=>{}}),o=a.filter(a=>"pending"===a.status),p=a.filter(a=>"pending"!==a.status),r=(d,e)=>{let f="resolved"===e;n({show:!0,title:f?"Схвалити скаргу":"Відхилити скаргу",message:`Ви дійсно хочете позначити цю скаргу як "${f?"схвалена":"відхилена"}"?`,isDanger:f,onConfirm:async()=>{try{await (0,h.t2)(d,e);let g=a.find(a=>a.id===d);(0,h.h1)(b.uid,b.name,`${f?"Схвалив":"Відхилив"} скаргу (${g?.reason||d})`,g?.reporterUid).catch(()=>{}),c(),(0,j.o)("Статус скарги змінено","success")}catch(a){(0,j.o)("Помилка: "+(a.message||a),"error")}}})},s=a=>{let b="pending"===a.status,c=!!f[a.id],e=a.comment&&a.comment.length>150,h=e&&!c?`${a.comment.slice(0,150)}...`:a.comment;return(0,d.jsxs)("div",{className:`report-card ${!b?"resolved":""}`,children:[(0,d.jsxs)("div",{className:"report-card-header",children:[(0,d.jsxs)("div",{style:{display:"flex",gap:"12px",alignItems:"flex-start"},children:[(0,d.jsx)("div",{className:"report-icon",children:(0,d.jsx)(i.I,{name:"warning",size:20})}),(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{className:"report-id",children:["ID: ",a.id]}),(0,d.jsx)("h3",{className:"report-title",children:a.reason})]})]}),(0,d.jsxs)("div",{className:"report-time",children:[(0,d.jsx)(i.I,{name:"clock",size:14})," ",(0,l.fF)(a.createdAt)]})]}),a.comment&&(0,d.jsxs)("div",{className:"report-comment",children:[(0,d.jsxs)("div",{children:['"',h,'"']}),e&&(0,d.jsxs)("button",{onClick:()=>g(b=>({...b,[a.id]:!b[a.id]})),className:"report-btn-expand",children:[(0,d.jsx)(i.I,{name:c?"caret-up":"caret-down",size:14}),c?"Згорнути":"Переглянути більше"]})]}),(0,d.jsxs)("div",{className:"report-details-grid",children:[(0,d.jsxs)("div",{className:"report-detail-item",children:[(0,d.jsx)("span",{className:"report-detail-label",children:"Скаржиться:"}),(0,d.jsx)("div",{className:"report-detail-value",children:a.reporterName}),(0,d.jsxs)("div",{className:"report-detail-sub",children:["UID: ",a.reporterUid]})]}),(0,d.jsxs)("div",{className:"report-detail-item",children:[(0,d.jsx)("span",{className:"report-detail-label",children:"Ціль:"}),(0,d.jsx)("div",{className:"report-detail-value",children:"invite"===a.targetType?"Персональне запрошення":"group-invite"===a.targetType?"Групове запрошення":a.targetType}),(0,d.jsxs)(q(),{href:`/${"group-invite"===a.targetType?"g":"i"}/${a.targetId}`,target:"_blank",className:"report-btn-link",children:["Переглянути ціль ",(0,d.jsx)(i.I,{name:"arrow-up-right",size:14})]})]})]}),a.targetContent&&(0,d.jsxs)("details",{className:"report-details-raw",children:[(0,d.jsx)("summary",{children:"Показати збережений контент на момент скарги"}),(0,d.jsx)("pre",{children:JSON.stringify(a.targetContent,null,2)})]}),(0,d.jsx)("div",{className:"report-actions",children:b?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("button",{className:"btn btn-red",onClick:()=>r(a.id,"resolved"),style:{padding:"8px 16px",borderRadius:"12px",fontSize:".9rem",fontWeight:600},children:[(0,d.jsx)(i.I,{name:"check-circle",size:16})," Схвалити скаргу"]}),(0,d.jsxs)("button",{className:"btn btn-outline",onClick:()=>r(a.id,"dismissed"),style:{padding:"8px 16px",borderRadius:"12px",fontSize:".9rem"},children:[(0,d.jsx)(i.I,{name:"x-circle",size:16})," Відхилити"]})]}):(0,d.jsxs)("div",{className:`report-status ${a.status}`,children:[(0,d.jsx)(i.I,{name:"resolved"===a.status?"check-circle":"x-circle",size:18}),"resolved"===a.status?"Схвалено (Вирішено)":"Відхилено (Хибна)"]})})]},a.id)};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{children:`
        .reports-dashboard {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .reports-section-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid rgba(192,57,43,.15);
          padding-bottom: 8px;
        }
        .reports-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .report-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          transition: all 0.3s var(--ease);
          position: relative;
          overflow: hidden;
        }
        .report-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px;
          background: var(--red);
        }
        .report-card.resolved {
          opacity: 0.8;
          box-shadow: none;
        }
        .report-card.resolved::before {
          background: var(--muted);
        }
        .report-card.resolved:hover {
          opacity: 1;
        }
        .report-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .report-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(192,57,43,.15), rgba(192,57,43,.05));
          color: var(--red);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .report-card.resolved .report-icon {
          background: rgba(0,0,0,0.05);
          color: var(--muted);
        }
        .report-id {
          font-size: 0.75rem;
          color: var(--muted);
          font-family: monospace;
          margin-bottom: 4px;
          background: var(--warm);
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .report-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--red);
          margin: 0;
        }
        .report-card.resolved .report-title {
          color: var(--ink);
        }
        .report-time {
          font-size: 0.85rem;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .report-comment {
          background: linear-gradient(135deg, var(--warm), rgba(240,232,216,0.5));
          padding: 16px;
          border-radius: 14px;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 20px;
          border-left: 3px solid var(--red);
          color: var(--ink);
        }
        .report-card.resolved .report-comment {
          border-left-color: var(--muted);
        }
        .report-btn-expand {
          margin-top: 10px;
          background: none;
          border: none;
          color: var(--gold);
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .report-btn-expand:hover {
          background: rgba(201,146,42,0.1);
        }
        .report-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: rgba(0,0,0,0.015);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .report-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .report-detail-label {
          font-size: 0.8rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .report-detail-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
        }
        .report-detail-sub {
          font-size: 0.8rem;
          font-family: monospace;
          color: var(--muted);
        }
        .report-btn-link {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--blue);
          text-decoration: none;
          font-weight: 500;
        }
        .report-btn-link:hover {
          text-decoration: underline;
        }
        .report-details-raw {
          font-size: 0.85rem;
          margin-bottom: 20px;
          background: var(--warm);
          border-radius: 12px;
          overflow: hidden;
        }
        .report-details-raw summary {
          padding: 12px 16px;
          cursor: pointer;
          color: var(--ink);
          font-weight: 600;
          outline: none;
        }
        .report-details-raw summary:hover {
          background: rgba(0,0,0,0.03);
        }
        .report-details-raw pre {
          padding: 16px;
          margin: 0;
          border-top: 1px solid var(--border);
          white-space: pre-wrap;
          word-break: break-all;
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .report-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .report-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 8px 16px;
          border-radius: 12px;
        }
        .report-status.resolved {
          background: rgba(45,122,79,.1);
          color: var(--green);
        }
        .report-status.dismissed {
          background: rgba(0,0,0,.05);
          color: var(--muted);
        }
        .reports-empty {
          background: linear-gradient(135deg, rgba(45,122,79,.08), rgba(45,122,79,.02));
          border: 1px dashed rgba(45,122,79,.3);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          color: var(--green);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
      `}),(0,d.jsxs)("div",{className:"reports-dashboard",children:[(0,d.jsxs)("section",{children:[(0,d.jsxs)("h2",{className:"reports-section-title",children:[(0,d.jsx)(i.I,{name:"clock",size:24,color:"var(--red)"})," Очікують рішення ",(0,d.jsxs)("span",{style:{color:"var(--muted)",fontSize:"1rem"},children:["(",o.length,")"]})]}),0===o.length?(0,d.jsxs)("div",{className:"reports-empty",children:[(0,d.jsx)("div",{style:{width:"64px",height:"64px",background:"rgba(45,122,79,.1)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"},children:(0,d.jsx)(i.I,{name:"check-circle",size:32})}),(0,d.jsx)("p",{style:{fontSize:"1.1rem",fontWeight:600},children:"Немає нових скарг, система працює ідеально!"})]}):(0,d.jsx)("div",{className:"reports-grid",children:o.map(s)})]}),(0,d.jsxs)("section",{children:[(0,d.jsxs)("h2",{className:"reports-section-title",children:[(0,d.jsx)(i.I,{name:"archive",size:24,color:"var(--muted)"})," Оброблені ",(0,d.jsxs)("span",{style:{color:"var(--muted)",fontSize:"1rem"},children:["(",p.length,")"]})]}),0===p.length?(0,d.jsx)("p",{style:{color:"var(--muted)",fontSize:".95rem",fontStyle:"italic"},children:"Історія скарг порожня"}):(0,d.jsx)("div",{className:"reports-grid",children:p.slice(0,20).map(s)})]})]}),(0,d.jsx)(m.u,{isOpen:k.show,title:k.title,message:k.message,isDanger:k.isDanger,onConfirm:()=>{k.onConfirm(),n(a=>({...a,show:!1}))},onCancel:()=>n(a=>({...a,show:!1}))})]})}function t({supportTickets:a,reload:b,openTicket:c,setOpenTicket:f,ticketMessages:g,ticketReply:h,setTicketReply:j,sendSupportReply:k,users:n,profile:o}){let[p,q]=(0,e.useState)({show:!1,title:"",message:"",onConfirm:()=>{}}),r=a.filter(a=>"pending"===a.status||"open"===a.status&&a.unreadBySupport),s=a.filter(a=>"open"===a.status&&!a.unreadBySupport),t=a.filter(a=>"resolved"===a.status||"dismissed"===a.status),u=a=>{let b="resolved"===a.status||"dismissed"===a.status;return(0,d.jsxs)("div",{className:`support-card ${b?"resolved":""} ${a.unreadBySupport?"unread":""}`,onClick:()=>f(a),children:[(0,d.jsx)("div",{className:"support-card-icon",children:(0,d.jsx)(i.I,{name:"chat-circle-dots",size:22})}),(0,d.jsxs)("div",{className:"support-card-body",children:[(0,d.jsxs)("div",{className:"support-card-header",children:[(0,d.jsx)("h3",{className:"support-card-title",children:a.subject}),(0,d.jsx)("span",{className:`support-card-badge ${a.status}`,children:"open"===a.status?"Відкрито":"resolved"===a.status?"Вирішено":a.status})]}),(0,d.jsxs)("div",{className:"support-card-meta",children:[(0,d.jsxs)("span",{className:"support-card-author",children:[(0,d.jsx)(i.I,{name:"user",size:14})," ",a.authorName]}),(0,d.jsx)("span",{className:"support-card-dot",children:"•"}),(0,d.jsxs)("span",{className:"support-card-time",children:[(0,d.jsx)(i.I,{name:"clock",size:14})," ",(0,l.fF)(a.createdAt)]})]})]}),a.unreadBySupport&&(0,d.jsx)("div",{className:"support-card-unread-indicator"})]},a.id)};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{children:`
        .support-dashboard {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .support-section-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid rgba(201,146,42,.15);
          padding-bottom: 8px;
        }
        .support-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
        }
        .support-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .support-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(201,146,42,.12);
          border-color: rgba(201,146,42,.3);
        }
        .support-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: transparent;
          transition: background 0.3s ease;
        }
        .support-card.unread::before {
          background: var(--gold);
        }
        .support-card.resolved {
          opacity: 0.7;
          box-shadow: none;
        }
        .support-card.resolved:hover {
          transform: translateY(-2px);
          opacity: 1;
        }
        .support-card.resolved::before {
          background: var(--green);
        }
        .support-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(201,146,42,.15), rgba(201,146,42,.05));
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .support-card.resolved .support-card-icon {
          background: linear-gradient(135deg, rgba(45,122,79,.15), rgba(45,122,79,.05));
          color: var(--green);
        }
        .support-card-body {
          flex: 1;
          min-width: 0;
        }
        .support-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }
        .support-card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .support-card-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .support-card-badge.pending, .support-card-badge.open {
          background: rgba(37,99,235,.1);
          color: var(--blue);
        }
        .support-card-badge.resolved {
          background: rgba(45,122,79,.1);
          color: var(--green);
        }
        .support-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .support-card-author, .support-card-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .support-card-author {
          font-weight: 500;
          color: var(--ink);
        }
        .support-card-unread-indicator {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 8px rgba(192,57,43,.6);
          animation: pulse 2s infinite;
        }
        .empty-state {
          background: linear-gradient(135deg, rgba(45,122,79,.08), rgba(45,122,79,.02));
          border: 1px dashed rgba(45,122,79,.3);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          color: var(--green);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-state-icon {
          width: 56px;
          height: 56px;
          background: rgba(45,122,79,.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}),(0,d.jsxs)("div",{className:"support-dashboard",children:[(0,d.jsxs)("section",{children:[(0,d.jsxs)("h2",{className:"support-section-title",children:[(0,d.jsx)(i.I,{name:"warning-circle",size:24,color:"var(--red)"})," Нові звернення ",(0,d.jsxs)("span",{style:{color:"var(--muted)",fontSize:"1rem"},children:["(",r.length,")"]})]}),0===r.length?(0,d.jsxs)("div",{className:"empty-state",children:[(0,d.jsx)("div",{className:"empty-state-icon",children:(0,d.jsx)(i.I,{name:"check-circle",size:28})}),(0,d.jsx)("p",{style:{fontSize:"1.05rem",fontWeight:500},children:"Немає нових звернень, ви чудово працюєте!"})]}):(0,d.jsx)("div",{className:"support-grid",children:r.map(u)})]}),(0,d.jsxs)("section",{children:[(0,d.jsxs)("h2",{className:"support-section-title",children:[(0,d.jsx)(i.I,{name:"envelope-open",size:24,color:"var(--blue)"})," Активні ",(0,d.jsxs)("span",{style:{color:"var(--muted)",fontSize:"1rem"},children:["(",s.length,")"]})]}),0===s.length?(0,d.jsx)("div",{style:{color:"var(--muted)",fontSize:".9rem",fontStyle:"italic"},children:"Немає активних звернень"}):(0,d.jsx)("div",{className:"support-grid",children:s.map(u)})]}),(0,d.jsxs)("section",{children:[(0,d.jsxs)("h2",{className:"support-section-title",children:[(0,d.jsx)(i.I,{name:"archive",size:24,color:"var(--muted)"})," Архів"]}),(0,d.jsx)("div",{className:"support-grid",children:t.slice(0,10).map(u)})]})]}),c&&!1,(0,d.jsx)(m.u,{isOpen:p.show,title:p.title,message:p.message,isDanger:p.isDanger,onConfirm:()=>{p.onConfirm(),q(a=>({...a,show:!1}))},onCancel:()=>q(a=>({...a,show:!1}))})]})}var u=c(77211),v=c(22410);let w={founder:"FOUNDER","tech-admin":"TECH-ADMIN",moderator:"MODERATOR",user:"USER"},x={founder:"var(--gold)","tech-admin":"#5a8fd4",moderator:"#6db87a",user:"var(--muted)"},y={overview:!0,users:!0,moderation:!0,reports:!0,support:!0,canBan:!0},z={overview:"Огляд",users:"Користувачі",moderation:"Модерація",reports:"Скарги",support:"Підтримка",canBan:"Може банити"};function A({users:a,profile:b,reload:c}){let f=a.filter(a=>"founder"===a.role||"tech-admin"===a.role||"moderator"===a.role).sort((a,b)=>{let c={founder:0,"tech-admin":1,moderator:2};return(c[a.role]??9)-(c[b.role]??9)||(a.createdAt||0)-(b.createdAt||0)}),[g,k]=(0,e.useState)({}),[m,n]=(0,e.useState)({}),[o,p]=(0,e.useState)(null),[q,r]=(0,e.useState)(null),[s,t]=(0,e.useState)({}),[A,B]=(0,e.useState)(!1),[C,D]=(0,e.useState)(null),[E,F]=(0,e.useState)([]),[G,H]=(0,e.useState)(null),I=b?.role==="founder"||b?.role==="tech-admin",J=async()=>{B(!0);try{let a=await (0,h.LJ)();0===a.length?(0,j.o)("Всі ID вже відповідають ролям ❖","success"):D(a)}catch(a){(0,j.o)(a.message||"Помилка","error")}finally{B(!1)}},K=async()=>{if(C){B(!0);try{let a=await (0,h.xX)();await (0,h.h1)(b.uid,b.name,`Автопризначення ролевих ID: оновлено ${a.updated}`),(0,j.o)(`Оновлено ${a.updated} ID ✦`,"success"),D(null),c()}catch(a){(0,j.o)(a.message||"Помилка","error")}finally{B(!1)}}},L=async a=>{let d=(g[a.uid]||"").trim().toUpperCase();if(!d)return(0,j.o)("Введіть новий ID","error");if(d===a.uniqueId)return(0,j.o)("ID не змінився","info");if(!/^ZAP-[A-Z0-9]{4,12}$/.test(d))return(0,j.o)("Формат ID: ZAP-XXXXXX (лише латиниця та цифри, 4-12 символів після тире)","error");n(b=>({...b,[a.uid]:!0}));try{let e=await (0,u.Jt)((0,u.ref)(v.db,"ids/"+d));if(e.exists()&&e.val()!==a.uid)return void(0,j.o)("Цей ID вже зайнятий іншим користувачем","error");await (0,h.CM)(a.uid,a.uniqueId||"",d),await (0,h.h1)(b.uid,b.name,`Змінив ID → ${d}`,a.uid,a.name),(0,j.o)(`ID змінено на ${d} ✦`,"success"),k(b=>({...b,[a.uid]:""})),c()}catch(a){(0,j.o)(a.message||"Помилка","error")}finally{n(b=>({...b,[a.uid]:!1}))}},M=async a=>{if(window.confirm(`Зняти роль у ${a.name}? Їх ID буде замінено на рандомний.`))try{await (0,h.v_)(a.uid,"user"),await (0,h.h1)(b.uid,b.name,`Зняв роль ${a.role}`,a.uid,a.name),(0,j.o)(`Роль знято у ${a.name} ✦`,"success"),c()}catch(a){(0,j.o)(a.message||"Помилка","error")}},N=async a=>{r(a.uid);try{await (0,h.ty)(a.uid,s[a.uid]||y),await (0,h.h1)(b.uid,b.name,"Оновив дозволи",a.uid,a.name),(0,j.o)("Дозволи збережено ✦","success")}catch(a){(0,j.o)(a.message||"Помилка","error")}finally{r(null)}},O=async a=>{H(a.key);try{await (0,h.IH)(a.key,!a.pinned)}catch(a){(0,j.o)("Помилка","error")}finally{H(null)}};return(0,d.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"28px"},children:[(0,d.jsxs)("div",{style:{background:"linear-gradient(135deg, rgba(201,146,42,0.08) 0%, rgba(90,143,212,0.06) 100%)",border:"1px solid rgba(201,146,42,0.2)",borderRadius:"16px",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"},children:[(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{style:{fontWeight:600,color:"var(--ink)",marginBottom:"4px"},children:[(0,d.jsx)(i.I,{name:"magic-wand",size:16})," Автоматичне призначення ID"]}),(0,d.jsx)("div",{style:{fontSize:".82rem",color:"var(--muted)",lineHeight:1.5},children:"Присвоїти усім модераторам, тех-адміну та засновнику відповідні рольові ідентифікатори."})]}),(0,d.jsx)("button",{className:"btn btn-dark",onClick:J,disabled:A,style:{padding:"9px 20px",borderRadius:"30px",whiteSpace:"nowrap"},children:A?"Обробка...":(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.I,{name:"arrows-clockwise",size:15})," Автопризначення"]})})]}),C&&(0,d.jsxs)("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"14px",padding:"20px 24px"},children:[(0,d.jsxs)("div",{style:{fontWeight:600,marginBottom:"12px",color:"var(--ink)"},children:[(0,d.jsx)(i.I,{name:"eye",size:15})," Попередній перегляд змін (",C.length," записів)"]}),(0,d.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"},children:C.map((a,b)=>(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",fontSize:".85rem",padding:"8px 12px",background:"var(--warm)",borderRadius:"8px"},children:[(0,d.jsx)("span",{style:{color:"var(--muted)",fontFamily:"monospace"},children:a.oldId||"—"}),(0,d.jsx)(i.I,{name:"arrow-right",size:13}),(0,d.jsx)("span",{style:{fontFamily:"monospace",color:x[a.role],fontWeight:600},children:a.newId}),(0,d.jsx)("span",{style:{marginLeft:"auto",color:"var(--muted)"},children:a.name})]},b))}),(0,d.jsxs)("div",{style:{display:"flex",gap:"10px"},children:[(0,d.jsx)("button",{className:"btn btn-dark",onClick:K,disabled:A,style:{borderRadius:"30px",padding:"9px 20px"},children:"Підтвердити"}),(0,d.jsx)("button",{className:"btn btn-outline",onClick:()=>D(null),style:{borderRadius:"30px",padding:"9px 20px"},children:"Скасувати"})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{style:{fontSize:".78rem",fontWeight:700,letterSpacing:".08em",color:"var(--muted)",textTransform:"uppercase",marginBottom:"12px"},children:["Привілейовані користувачі (",f.length,")"]}),(0,d.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[0===f.length&&(0,d.jsx)("div",{style:{color:"var(--muted)",padding:"24px",textAlign:"center",fontSize:".9rem"},children:"Немає привілейованих користувачів"}),f.map(a=>{var c,e;let f=(c=a.lastSeen||0,Date.now()-c<18e4),h=(e=a.role,b?.role==="founder"||b?.role==="tech-admin"&&"moderator"===e),j=s[a.uid]||{...y,...a.permissions||{}},n=o===a.uid;return(0,d.jsxs)("div",{style:{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"14px",padding:"16px 20px",display:"flex",flexDirection:"column",gap:"14px"},children:[(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap"},children:[(0,d.jsxs)("div",{style:{position:"relative",flexShrink:0},children:[(0,d.jsx)("div",{className:"avatar avatar-sm",style:{width:44,height:44,fontSize:"1.1rem"},children:a.avatar?(0,d.jsx)("img",{src:a.avatar,alt:"",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}):(a.name||"?").charAt(0)}),(0,d.jsx)("div",{style:{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:f?"#4caf50":"#9e9e9e",border:"2px solid var(--card)"}})]}),(0,d.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,d.jsxs)("div",{style:{fontWeight:600,color:"var(--ink)",fontSize:".95rem",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"},children:[a.name,(0,d.jsx)("span",{style:{fontSize:".65rem",fontWeight:700,letterSpacing:".07em",padding:"2px 8px",borderRadius:"20px",background:`${x[a.role]}18`,color:x[a.role],border:`1px solid ${x[a.role]}40`},children:w[a.role]||a.role?.toUpperCase()})]}),(0,d.jsxs)("div",{style:{display:"flex",gap:"10px",marginTop:"2px",flexWrap:"wrap"},children:[(0,d.jsxs)("span",{style:{fontSize:".78rem",color:"var(--muted)"},children:["@",a.login]}),(0,d.jsx)("span",{style:{fontSize:".78rem",fontFamily:"monospace",color:x[a.role],fontWeight:600},children:a.uniqueId||"—"}),(0,d.jsx)("span",{style:{fontSize:".75rem",color:f?"#4caf50":"var(--muted)"},children:f?"● Онлайн":`● ${a.lastSeen?(0,l.fF)(a.lastSeen):"Не відомо"}`})]})]}),h&&(0,d.jsxs)("div",{style:{display:"flex",gap:"8px",flexShrink:0},children:["moderator"===a.role&&(0,d.jsxs)("button",{className:"btn btn-outline btn-sm",onClick:()=>p(n?null:a.uid),style:{borderRadius:"20px",padding:"5px 12px",fontSize:".78rem"},children:[(0,d.jsx)(i.I,{name:"sliders",size:13})," Дозволи"]}),(0,d.jsxs)("button",{className:"btn btn-sm",onClick:()=>M(a),style:{borderRadius:"20px",padding:"5px 12px",fontSize:".78rem",background:"rgba(224,92,92,0.1)",color:"var(--red)",border:"1px solid rgba(224,92,92,0.2)"},children:[(0,d.jsx)(i.I,{name:"user-minus",size:13})," Зняти роль"]})]})]}),h&&(0,d.jsxs)("div",{style:{display:"flex",gap:"8px",alignItems:"center"},children:[(0,d.jsx)("input",{type:"text",placeholder:`Новий ID (зараз: ${a.uniqueId||"—"})`,value:g[a.uid]||"",onChange:b=>k(c=>({...c,[a.uid]:b.target.value.toUpperCase()})),style:{flex:1,padding:"7px 14px",fontSize:".82rem",background:"var(--warm)",border:"1px solid var(--border)",borderRadius:"8px",color:"var(--ink)",fontFamily:"monospace",outline:"none",minWidth:0}}),(0,d.jsx)("button",{className:"btn btn-outline btn-sm",onClick:()=>L(a),disabled:m[a.uid]||!g[a.uid],style:{borderRadius:"8px",padding:"7px 14px",whiteSpace:"nowrap",fontSize:".82rem"},children:m[a.uid]?"...":(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(i.I,{name:"check",size:13})," Змінити"]})})]}),n&&"moderator"===a.role&&(0,d.jsxs)("div",{style:{borderTop:"1px solid var(--border)",paddingTop:"14px",display:"flex",flexDirection:"column",gap:"10px"},children:[(0,d.jsx)("div",{style:{fontSize:".78rem",fontWeight:700,color:"var(--muted)",letterSpacing:".06em",textTransform:"uppercase"},children:"Дозволи модератора"}),(0,d.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:"8px"},children:Object.keys(y).map(b=>(0,d.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px 12px",borderRadius:"8px",cursor:"pointer",background:j[b]?"rgba(109,184,122,0.08)":"var(--warm)",border:`1px solid ${j[b]?"rgba(109,184,122,0.3)":"var(--border)"}`,transition:"all .15s"},children:[(0,d.jsx)("input",{type:"checkbox",checked:!!j[b],onChange:()=>{var c;return c=a.uid,void t(a=>({...a,[c]:{...a[c]||y,[b]:!(a[c]?.[b]??y[b])}}))},style:{accentColor:"#6db87a",width:15,height:15}}),(0,d.jsx)("span",{style:{fontSize:".82rem",color:"var(--ink)"},children:z[b]})]},b))}),(0,d.jsx)("button",{className:"btn btn-dark btn-sm",onClick:()=>N(a),disabled:q===a.uid,style:{alignSelf:"flex-start",borderRadius:"20px",padding:"7px 18px"},children:q===a.uid?"Збереження...":"Зберегти дозволи"})]})]},a.uid)})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontSize:".78rem",fontWeight:700,letterSpacing:".08em",color:"var(--muted)",textTransform:"uppercase",marginBottom:"12px"},children:"Лог дій стафу"}),0===E.length?(0,d.jsx)("div",{style:{color:"var(--muted)",fontSize:".88rem",padding:"20px",textAlign:"center"},children:"Лог порожній"}):(0,d.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:E.map(a=>(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",borderRadius:"10px",background:a.pinned?"rgba(201,146,42,0.06)":"var(--card)",border:`1px solid ${a.pinned?"rgba(201,146,42,0.25)":"var(--border)"}`,fontSize:".83rem"},children:[a.pinned&&(0,d.jsx)("span",{style:{color:"var(--gold)",fontSize:".75rem"},children:"\uD83D\uDCCC"}),(0,d.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,d.jsx)("span",{style:{fontWeight:600,color:"var(--ink)"},children:a.adminName})," \xb7 ",(0,d.jsx)("span",{style:{color:"var(--muted)"},children:a.action}),a.targetName&&(0,d.jsxs)("span",{style:{color:"var(--muted)"},children:[" → ",(0,d.jsx)("span",{style:{color:"var(--ink)"},children:a.targetName})]})]}),(0,d.jsx)("span",{style:{color:"var(--muted)",fontSize:".75rem",whiteSpace:"nowrap",flexShrink:0},children:a.createdAt?(0,l.fF)(a.createdAt):"—"}),I&&(0,d.jsx)("button",{onClick:()=>O(a),disabled:G===a.key,title:a.pinned?"Відкріпити":"Закріпити",style:{background:"none",border:"none",cursor:"pointer",color:a.pinned?"var(--gold)":"var(--muted)",padding:"2px 4px",fontSize:"1rem",lineHeight:1,flexShrink:0},children:G===a.key?"...":"\uD83D\uDCCC"})]},a.key))})]})]})}function B(){let a=(0,f.useRouter)(),{user:b,profile:c}=(0,g.A)(),[l,m]=(0,e.useState)(!0),[n,p]=(0,e.useState)(!1),[q,u]=(0,e.useState)("overview"),[v,w]=(0,e.useState)(!1),[x,y]=(0,e.useState)([]),[z,B]=(0,e.useState)([]),[C,D]=(0,e.useState)([]),[E,F]=(0,e.useState)([]),[G,H]=(0,e.useState)([]),[I,J]=(0,e.useState)({}),[K,L]=(0,e.useState)({}),[M,N]=(0,e.useState)(""),[O,P]=(0,e.useState)(0),[Q,R]=(0,e.useState)(""),[S,T]=(0,e.useState)(0),[U,V]=(0,e.useState)(null),[W,X]=(0,e.useState)([]),[Y,Z]=(0,e.useState)(""),$=(0,e.useMemo)(()=>[...z,...C].sort((a,b)=>(b.created||0)-(a.created||0)),[z,C]),_=(0,e.useMemo)(()=>{let a=z.length+C.length,b=z.length,c=C.length,d={};z.forEach(a=>{a&&a.type&&(d[a.type]=(d[a.type]||0)+1)}),C.forEach(a=>{a&&a.type&&(d[a.type]=(d[a.type]||0)+1)});let e=Date.now()-6048e5,f=x.filter(a=>a.lastSeen>e).length,g=0,h=0,i=0;Object.values(I).forEach(a=>{"accepted"===a?g++:"declined"===a?h++:("reschedule"===a||"rescheduled"===a)&&i++});let j=0,k=0,l=0,m=0,n=0;x.forEach(a=>{a.banned&&n++,"founder"===a.role?j++:"tech-admin"===a.role?k++:"moderator"===a.role?l++:m++});let o=0,p=0,q=0;E.forEach(a=>{"pending"===a.status?o++:"resolved"===a.status?p++:"dismissed"===a.status&&q++});let r=0,s=0,t=0;G.forEach(a=>{"pending"===a.status?r++:"resolved"===a.status?s++:"dismissed"===a.status&&t++});let u=0;return Object.values(K).forEach(a=>{a&&(u+=Object.keys(a).length)}),u=Math.floor(u/2),{totalUsers:x.length,totalInvites:a,acceptedInvites:g,declinedInvites:h,rescheduleInvites:i,activeUsers:f,bannedCount:n,roleCounts:{founder:j,techAdmin:k,moderator:l,user:m},reportsCount:{pending:o,resolved:p,dismissed:q,total:o+p+q},supportCount:{pending:r,resolved:s,dismissed:t,total:r+s+t},totalFriendsConnections:u,users:x,personalInvitesCount:b,groupInvitesCount:c,typeCounts:d,personalInvites:z,groupInvites:C}},[x,z,C,E,G,I,K]),aa=()=>{},ab=async()=>{if(Y.trim()&&U)try{await (0,h.Ym)(U.id,{uid:b?.uid,name:c?.name,role:c?.role,avatar:c?.avatar||null,text:Y.trim()}),(0,h.h1)(b?.uid||"",c?.name||"",`Відпів у зверненні: ${U.subject||U.id}`,U.authorUid,U.authorName).catch(()=>{}),Z("")}catch(a){(0,j.o)("Помилка відправки","error")}};if(!c)return null;if("founder"!==c.role&&"tech-admin"!==c.role&&"moderator"!==c.role)return(0,d.jsx)("div",{className:"wrap",children:(0,d.jsxs)("div",{className:"empty",children:[(0,d.jsx)(i.I,{name:"lock",size:20}),(0,d.jsx)("p",{children:"Доступ заборонено"})]})});let ac="moderator"===c.role;return(0,d.jsxs)("div",{className:"app-with-sidebar",children:[(0,d.jsxs)("aside",{className:`sidebar ${v?"open":""}`,id:"dash-sidebar",children:[(0,d.jsx)("div",{className:"sidebar-logo",children:"Запрошення ✦"}),(0,d.jsx)("div",{className:"sidebar-section",children:"Меню"}),!ac&&(0,d.jsxs)("button",{className:`sidebar-item ${"overview"===q?"active":""}`,onClick:()=>{u("overview"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"chart-bar",size:20})})," Огляд"]}),(0,d.jsxs)("button",{className:`sidebar-item ${"users"===q?"active":""}`,onClick:()=>{u("users"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"users",size:20})})," Користувачі"]}),!ac&&(0,d.jsxs)("button",{className:`sidebar-item ${"roles"===q?"active":""}`,onClick:()=>{u("roles"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"shield-star",size:20})})," Управління ролями"]}),(0,d.jsxs)("button",{className:`sidebar-item ${"moderation"===q?"active":""}`,onClick:()=>{u("moderation"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"shield",size:20})})," Модерація"]}),(0,d.jsxs)("button",{className:`sidebar-item ${"reports"===q?"active":""}`,onClick:()=>{u("reports"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"warning",size:20})})," Скарги",E.filter(a=>"pending"===a.status).length>0&&(0,d.jsx)("span",{className:"notif-badge",style:{position:"static",marginLeft:"auto"},children:E.filter(a=>"pending"===a.status).length})]}),(0,d.jsxs)("button",{className:`sidebar-item ${"support"===q?"active":""}`,onClick:()=>{u("support"),w(!1)},children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"lifebuoy",size:20})})," Підтримка",G.filter(a=>"pending"===a.status||"open"===a.status&&a.unreadBySupport).length>0&&(0,d.jsx)("span",{className:"notif-badge",style:{position:"static",marginLeft:"auto"},children:G.filter(a=>"pending"===a.status||"open"===a.status&&a.unreadBySupport).length})]}),(0,d.jsx)("div",{className:"sidebar-section",children:"Навігація"}),(0,d.jsxs)("button",{className:"sidebar-item",onClick:()=>a.push("/home"),children:[(0,d.jsx)("span",{className:"sidebar-item-icon",children:(0,d.jsx)(i.I,{name:"house",size:20})})," Головна"]}),(0,d.jsx)("div",{style:{marginTop:"auto",padding:"16px",borderTop:"1px solid rgba(255,255,255,.08)"},children:(0,d.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[(0,d.jsx)("div",{className:"avatar avatar-sm",children:c?.avatar?(0,d.jsx)("img",{src:c.avatar,alt:""}):c?.name?.charAt(0)}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{color:"#fff",fontSize:".85rem",fontWeight:500},children:c?.name}),(0,d.jsx)("div",{style:{fontSize:".7rem",color:"rgba(255,255,255,.4)"},children:(c?.role||"").toUpperCase()})]})]})})]}),v&&(0,d.jsx)("div",{className:"sidebar-overlay",onClick:()=>w(!1)}),(0,d.jsx)("div",{className:"sidebar-content",children:(0,d.jsx)("div",{className:"wrap",children:l?(0,d.jsx)("div",{style:{padding:"40px",textAlign:"center"},children:"Завантаження..."}):n?(0,d.jsx)("div",{style:{padding:"40px",textAlign:"center",color:"var(--red)"},children:"Помилка завантаження даних"}):(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"},children:[(0,d.jsxs)("h1",{className:"page-title",style:{marginBottom:0},children:["overview"===q&&"Огляд","users"===q&&"Користувачі","roles"===q&&"Управління ролями","moderation"===q&&"Модерація","reports"===q&&"Скарги","support"===q&&"Підтримка"]}),(0,d.jsx)("button",{className:"hamburger",onClick:()=>w(!0),children:(0,d.jsx)(i.I,{name:"list",size:20})})]}),"overview"===q&&(0,d.jsx)(k,{stats:_,users:x}),"users"===q&&(0,d.jsx)(o,{users:x,profile:c,reload:aa}),"roles"===q&&!ac&&(0,d.jsx)(A,{users:x,profile:c,reload:aa}),"moderation"===q&&(0,d.jsx)(r,{invites:$,users:x,profile:c,reload:aa}),"reports"===q&&(0,d.jsx)(s,{reports:E,profile:c,reload:aa}),"support"===q&&(0,d.jsx)(t,{supportTickets:G,users:x,profile:c,reload:aa,openTicket:U,setOpenTicket:V,ticketMessages:W,ticketReply:Y,setTicketReply:Z,sendSupportReply:ab})]})})})]})}},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},13802:(a,b,c)=>{"use strict";c.d(b,{u:()=>h});var d=c(21124),e=c(85846),f=c(23312),g=c(38301);function h({isOpen:a,title:b,message:c,confirmText:h="Підтвердити",cancelText:i="Скасувати",isDanger:j=!1,onConfirm:k,onCancel:l}){let[m,n]=(0,g.useState)(!1);return a&&m?(0,f.createPortal)((0,d.jsx)("div",{className:"overlay",onClick:l,style:{zIndex:9999},children:(0,d.jsxs)("div",{className:"modal",onClick:a=>a.stopPropagation(),style:{maxWidth:"400px"},children:[(0,d.jsxs)("h3",{className:"modal-title",style:{display:"flex",alignItems:"center",gap:"8px",color:j?"var(--red)":"var(--gold)",margin:0},children:[(0,d.jsx)(e.I,{name:j?"warning":"info",size:20})," ",b]}),(0,d.jsx)("p",{style:{fontSize:"0.95rem",lineHeight:"1.5",margin:"16px 0 24px",color:"var(--ink)"},children:c}),(0,d.jsxs)("div",{style:{display:"flex",gap:"12px"},children:[(0,d.jsx)("button",{className:`btn ${j?"btn-red":"btn-gold"}`,style:{flex:1,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center"},onClick:k,children:h}),(0,d.jsx)("button",{className:"btn btn-outline",style:{flex:1,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center"},onClick:l,children:i})]})]})}),document.body):null}},14244:(a,b,c)=>{Promise.resolve().then(c.bind(c,6187))},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},41337:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>D.a,__next_app__:()=>J,handler:()=>L,pages:()=>I,routeModule:()=>K,tree:()=>H});var d=c(49754),e=c(9117),f=c(46595),g=c(32324),h=c(39326),i=c(38928),j=c(20175),k=c(12),l=c(54290),m=c(12696),n=c(82802),o=c(77533),p=c(45229),q=c(32822),r=c(261),s=c(26453),t=c(52474),u=c(26713),v=c(51356),w=c(62685),x=c(36225),y=c(63446),z=c(2762),A=c(45742),B=c(86439),C=c(81170),D=c.n(C),E=c(62506),F=c(91203),G={};for(let a in E)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(G[a]=()=>E[a]);c.d(b,G);let H={children:["",{children:["admin",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,88699)),"C:\\Zap\\src\\app\\admin\\page.tsx"]}]},{metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,78162))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(c.bind(c,51472)),"C:\\Zap\\src\\app\\layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,81170,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.bind(c,59732)),"C:\\Zap\\src\\app\\not-found.tsx"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,90461,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,32768,23)),"next/dist/client/components/builtin/unauthorized.js"],metadata:{icon:[async a=>(await Promise.resolve().then(c.bind(c,78162))).default(a)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]}.children,I=["C:\\Zap\\src\\app\\admin\\page.tsx"],J={require:c,loadChunk:()=>Promise.resolve()},K=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/admin/page",pathname:"/admin",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:H},distDir:".next",relativeProjectDir:""});async function L(a,b,d){var C;let G="/admin/page";"/index"===G&&(G="/");let M=(0,h.getRequestMeta)(a,"postponed"),N=(0,h.getRequestMeta)(a,"minimalMode"),O=await K.prepare(a,b,{srcPage:G,multiZoneDraftMode:!1});if(!O)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:P,query:Q,params:R,parsedUrl:S,pageIsDynamic:T,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,serverActionsManifest:X,clientReferenceManifest:Y,subresourceIntegrityManifest:Z,prerenderManifest:$,isDraftMode:_,resolvedPathname:aa,revalidateOnlyGenerated:ab,routerServerContext:ac,nextConfig:ad,interceptionRoutePatterns:ae}=O,af=S.pathname||"/",ag=(0,r.normalizeAppPath)(G),{isOnDemandRevalidate:ah}=O,ai=K.match(af,$),aj=!!$.routes[aa],ak=!!(ai||aj||$.routes[ag]),al=a.headers["user-agent"]||"",am=(0,u.getBotType)(al),an=(0,p.isHtmlBotRequest)(a),ao=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],ap=(0,h.getRequestMeta)(a,"isRSCRequest")??!!a.headers[t.RSC_HEADER],aq=(0,s.getIsPossibleServerAction)(a),ar=(0,m.checkIsAppPPREnabled)(ad.experimental.ppr)&&(null==(C=$.routes[ag]??$.dynamicRoutes[ag])?void 0:C.renderingMode)==="PARTIALLY_STATIC",as=!1,at=!1,au=ar?M:void 0,av=ar&&ap&&!ao,aw=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ax=!al||(0,p.shouldServeStreamingMetadata)(al,ad.htmlLimitedBots);an&&ar&&(ak=!1,ax=!1);let ay=!0===K.isDev||!ak||"string"==typeof M||av,az=an&&ar,aA=null;_||!ak||ay||aq||au||av||(aA=aa);let aB=aA;!aB&&K.isDev&&(aB=aa),K.isDev||_||!ak||!ap||av||(0,k.d)(a.headers);let aC={...E,tree:H,pages:I,GlobalError:D(),handler:L,routeModule:K,__next_app__:J};X&&Y&&(0,o.setReferenceManifestsSingleton)({page:G,clientReferenceManifest:Y,serverActionsManifest:X,serverModuleMap:(0,q.createServerModuleMap)({serverActionsManifest:X})});let aD=a.method||"GET",aE=(0,g.getTracer)(),aF=aE.getActiveScopeSpan();try{let f=K.getVaryHeader(aa,ae);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return K.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aE.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aD} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aD} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:Q,params:R,page:ag,sharedContext:{buildId:P},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aC,Component:(0,j.T)(aC),params:R,routeModule:K,page:G,postponed:f,shouldWaitOnAllReady:az,serveStreamingMetadata:ax,supportsDynamicResponse:"string"==typeof f||ay,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,subresourceIntegrityManifest:Z,serverActionsManifest:X,clientReferenceManifest:Y,setIsrStatus:null==ac?void 0:ac.setIsrStatus,dir:c(33873).join(process.cwd(),K.relativeProjectDir),isDraftMode:_,isRevalidate:ak&&!f&&!av,botType:am,isOnDemandRevalidate:ah,isPossibleServerAction:aq,assetPrefix:ad.assetPrefix,nextConfigOutput:ad.output,crossOrigin:ad.crossOrigin,trailingSlash:ad.trailingSlash,previewProps:$.preview,deploymentId:ad.deploymentId,enableTainting:ad.experimental.taint,htmlLimitedBots:ad.htmlLimitedBots,devtoolSegmentExplorer:ad.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ad.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ad.experimental.cacheLife,basePath:ad.basePath,serverActions:ad.experimental.serverActions,...as?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:as}:{},experimental:{isRoutePPREnabled:ar,expireTime:ad.expireTime,staleTimes:ad.experimental.staleTimes,cacheComponents:!!ad.experimental.cacheComponents,clientSegmentCache:!!ad.experimental.clientSegmentCache,clientParamParsing:!!ad.experimental.clientParamParsing,dynamicOnHover:!!ad.experimental.dynamicOnHover,inlineCss:!!ad.experimental.inlineCss,authInterrupts:!!ad.experimental.authInterrupts,clientTraceMetadata:ad.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>K.onRequestError(a,b,d,ac),err:(0,h.getRequestMeta)(a,"invokeError"),dev:K.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[y.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,ak&&(null==n?void 0:n.revalidate)===0&&!K.isDev&&!ar){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${aa}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:v.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},o=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===K.isDev,l=c||b.writableEnded;if(ah&&ab&&!f&&!N)return(null==ac?void 0:ac.render404)?await ac.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ai&&(j=(0,w.parseFallbackField)(ai.fallback)),j===w.FallbackMode.PRERENDER&&(0,u.isBot)(al)&&(!ar||an)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ah=!0),ah&&(j!==w.FallbackMode.NOT_FOUND||f)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),!N&&j!==w.FallbackMode.BLOCKING_STATIC_RENDER&&aB&&!l&&!_&&T&&(k||!aj)){let b;if((k||ai)&&j===w.FallbackMode.NOT_FOUND)throw new B.NoFallbackError;if(ar&&!ap){let c="string"==typeof(null==ai?void 0:ai.fallback)?ai.fallback:k?ag:null;if(b=await K.handleResponse({cacheKey:c,req:a,nextConfig:ad,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:$,isRoutePPREnabled:ar,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||at?(0,n.u)(ag):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let o=ah||g||!au?void 0:au;if(as&&void 0!==o)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:v.CachedRouteKind.PAGES,html:x.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=T&&ar&&((0,h.getRequestMeta)(a,"renderFallbackShell")||at)?(0,n.u)(af):null;return m({span:i,postponed:o,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,n=await K.handleResponse({cacheKey:aA,responseGenerator:a=>o({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ah,isRoutePPREnabled:ar,req:a,nextConfig:ad,prerenderManifest:$,waitUntil:d.waitUntil});if(_&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),K.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!n){if(aA)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=n.value)?void 0:f.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=n.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof n.value.postponed;ak&&!av&&(!p||ao)&&(N||b.setHeader("x-nextjs-cache",ah?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),b.setHeader(t.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=n;if(au)l={revalidate:0,expire:void 0};else if(N&&ap&&!ao&&ar)l={revalidate:0,expire:void 0};else if(!K.isDev)if(_)l={revalidate:0,expire:void 0};else if(ak){if(n.cacheControl)if("number"==typeof n.cacheControl.revalidate){if(n.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:n.cacheControl.revalidate,expire:(null==(j=n.cacheControl)?void 0:j.expire)??ad.expireTime}}else l={revalidate:y.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(n.cacheControl=l,"string"==typeof aw&&(null==q?void 0:q.kind)===v.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[y.NEXT_CACHE_TAGS_HEADER];N&&ak&&c&&"string"==typeof c&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(aw);return void 0!==d?(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(d,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl}):(b.statusCode=204,(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.EMPTY,cacheControl:n.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...n,value:{...n.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&au)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(N&&ak||delete a[y.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[y.NEXT_CACHE_TAGS_HEADER];if(N&&ak&&s&&"string"==typeof s&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,s),!q.status||ap&&ar||(b.statusCode=q.status),!N&&q.status&&F.RedirectStatusCode[q.status]&&ap&&(b.statusCode=200),p&&b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"1"),ap&&!_){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:q.html,cacheControl:av?{revalidate:0,expire:void 0}:n.cacheControl})}return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(q.rscData,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl})}let u=q.html;if(!p||N||ap)return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:n.cacheControl});if(as)return u.push(new ReadableStream({start(a){a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}});let w=new TransformStream;return u.push(w.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(w.writable)}).catch(a=>{w.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}})};if(!aF)return await aE.withPropagatedContext(a.headers,()=>aE.trace(i.BaseServerSpan.handleRequest,{spanName:`${aD} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aD,"http.target":a.url}},p));await p(aF)}catch(b){throw aF||b instanceof B.NoFallbackError||await K.onRequestError(a,b,{routerKind:"App Router",routePath:G,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:ak,isOnDemandRevalidate:ah})},ac),b}}},44943:(a,b,c)=>{"use strict";function d(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5)}function e(){let a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",b="";for(let c=0;c<6;c++)b+=a[Math.floor(Math.random()*a.length)];return"ZAP-"+b}function f(a,b){return"moderator"===a?"ZAP-MODER"+(b??1):"tech-admin"===a?"ZAP-TECADM":"founder"===a?"ZAP-FONDER":e()}function g(a){if(!a)return!1;let b=a.toUpperCase();return!!("ZAP-TECADM"===b||"ZAP-FONDER"===b||/^ZAP-MODER\d+$/.test(b))}function h(a){if(!a)return"";let b=Math.floor((Date.now()-a)/6e4);if(b<1)return"щойно";if(b<60)return`${b} хв тому`;let c=Math.floor(b/60);if(c<24)return`${c} год тому`;let d=Math.floor(c/24);if(d<7)return`${d} дн тому`;var e=new Date(a).toISOString().split("T")[0];if(!e)return"";try{return new Date(e).toLocaleDateString("uk-UA",{day:"numeric",month:"long",year:"numeric"})}catch{return String(e)}}c.d(b,{QE:()=>i,aG:()=>j,aq:()=>d,fF:()=>h,genRoleUserId:()=>f,genUserId:()=>e,isReservedId:()=>g,sQ:()=>k});let i=[{v:"date",l:"Побачення",e:"\uD83C\uDF39"},{v:"walk",l:"Прогулянка",e:"\uD83C\uDF43"},{v:"birthday",l:"День народження",e:"\uD83C\uDF82"},{v:"party",l:"Свято / Вечірка",e:"\uD83E\uDD42"},{v:"cinema",l:"Кіно",e:"\uD83C\uDFAC"},{v:"coffee",l:"Кава",e:"☕"},{v:"travel",l:"Подорож",e:"✈️"},{v:"other",l:"Інше",e:"✨"}],j=Object.fromEntries(i.map(a=>[a.v,a]));function k(){}},50579:(a,b,c)=>{"use strict";c.d(b,{default:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Zap\\\\src\\\\app\\\\admin\\\\ClientAdminPage.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Zap\\src\\app\\admin\\ClientAdminPage.tsx","default")},55511:a=>{"use strict";a.exports=require("crypto")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},77444:(a,b,c)=>{Promise.resolve().then(c.bind(c,50579))},79428:a=>{"use strict";a.exports=require("buffer")},79551:a=>{"use strict";a.exports=require("url")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},88699:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>g,metadata:()=>f});var d=c(75338),e=c(50579);let f={title:"Дашборд ✦",description:"Панель адміністратора"};function g(){return(0,d.jsx)(e.default,{})}},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")}};var b=require("../../webpack-runtime.js");b.C(a);var c=b.X(0,[586,570,78,622],()=>b(b.s=41337));module.exports=c})();