"use strict";
(() => {
  const data = window.TRIOD_REPORT;
  const byId = id => document.getElementById(id);
  const number = value => Number(value).toLocaleString(undefined, {maximumFractionDigits: 2});
  byId("campaign").textContent = data.campaign;
  byId("updated").textContent = data.updated_at;
  byId("gpu-hours").textContent = number(data.gpu_hours);
  byId("contract").textContent = data.contract;
  byId("status").textContent = data.status;
  byId("baseline").textContent = data.baseline_note;
  if (data.selected.length) byId("score").textContent = number(data.selected.at(-1).tokens_s) + " tok/s";
  for (const attempt of data.attempts) {
    const row = document.createElement("tr");
    for (const value of [attempt.id, attempt.summary, attempt.stage, attempt.outcome,
      attempt.tokens_s == null ? "—" : number(attempt.tokens_s), number(attempt.gpu_seconds)]) {
      const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell);
    }
    byId("attempts").appendChild(row);
  }
  const ns = "http://www.w3.org/2000/svg";
  function element(tag, attributes = {}, text = null) {
    const item = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, value);
    if (text != null) item.textContent = text;
    return item;
  }
  function draw() {
    const target = byId("chart"); target.replaceChildren();
    const svg = element("svg", {viewBox:"0 0 1040 360", xmlns:ns});
    svg.appendChild(element("rect", {width:1040, height:360, fill:"white"}));
    if (!data.selected.length) {
      svg.appendChild(element("text", {x:520,y:180,"text-anchor":"middle",fill:"#5c6d7b","font-family":"sans-serif","font-size":17}, "Readiness checks in progress — no qualified throughput yet"));
      target.appendChild(svg); return;
    }
    const axis = byId("axis").value;
    const raw = data.attempts.filter(a => a.tokens_s != null);
    const all = [...data.selected, ...raw];
    const xmax = Math.max(axis === "elapsed_seconds" ? 3600 : 1, ...all.map(p => p[axis] || 0));
    const ymin = 0, ymax = Math.max(...all.map(p => p.tokens_s)) * 1.1;
    const x = value => 85 + value / xmax * 920;
    const y = value => 305 - (value - ymin) / (ymax - ymin) * 270;
    for (let i=0; i<=5; i++) {
      const value = ymax * i / 5;
      svg.appendChild(element("line", {x1:85,x2:1005,y1:y(value),y2:y(value),stroke:"#e6edf1"}));
      svg.appendChild(element("text", {x:77,y:y(value)+4,"text-anchor":"end",fill:"#5c6d7b","font-family":"sans-serif","font-size":12},number(value)));
      const position = xmax * i / 5;
      svg.appendChild(element("text", {x:x(position),y:330,"text-anchor":"middle",fill:"#5c6d7b","font-family":"sans-serif","font-size":12}, number(axis === "elapsed_seconds" ? position/3600 : position)));
    }
    let path = "";
    for (const [i,p] of data.selected.entries()) path += i === 0 ? `M ${x(p[axis])} ${y(p.tokens_s)}` : ` H ${x(p[axis])} V ${y(p.tokens_s)}`;
    // Stop at observed evidence, not the unused future portion of the axis.
    path += ` H ${x(Math.max(...all.map(p => p[axis] || 0)))}`;
    svg.appendChild(element("path", {d:path,fill:"none",stroke:"#007c7a","stroke-width":3}));
    for (const p of raw) {
      const circle = element("circle", {cx:x(p[axis]||0),cy:y(p.tokens_s),r:4,fill:p.outcome === "promoted"?"#007c7a":"#a7b5c0",opacity:.75});
      circle.appendChild(element("title",{},`${p.id}: ${p.outcome}; ${number(p.tokens_s)} tok/s`)); svg.appendChild(circle);
    }
    svg.appendChild(element("text", {x:540,y:354,"text-anchor":"middle","font-family":"sans-serif","font-size":13,fill:"#193047"}, axis === "elapsed_seconds" ? "Elapsed wall time (hours)" : "Cumulative completed-job GPU-hours"));
    svg.appendChild(element("text", {x:85,y:20,"font-family":"sans-serif","font-size":13,fill:"#193047"}, "Generated tokens / second"));
    target.appendChild(svg);
  }
  function download(url, filename) { const link = document.createElement("a"); link.href=url;link.download=filename;link.click(); }
  byId("axis").addEventListener("change",draw);
  byId("svg-download").addEventListener("click",() => {
    const blob = new Blob([new XMLSerializer().serializeToString(byId("chart").firstChild)],{type:"image/svg+xml"});
    const url=URL.createObjectURL(blob);download(url,"autoresearch.svg");setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  byId("png-download").addEventListener("click",() => {
    const blob = new Blob([new XMLSerializer().serializeToString(byId("chart").firstChild)],{type:"image/svg+xml"});
    const url=URL.createObjectURL(blob), image = new Image();
    image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=2080;canvas.height=720;canvas.getContext("2d").drawImage(image,0,0,2080,720);URL.revokeObjectURL(url);download(canvas.toDataURL("image/png"),"autoresearch.png");};
    image.src=url;
  });
  draw();
})();
