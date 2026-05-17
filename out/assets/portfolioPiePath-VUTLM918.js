function P(t,n,$,e,s){const M=(e-90)*Math.PI/180,h=(e+s-90)*Math.PI/180,o=t+$*Math.cos(M),a=n+$*Math.sin(M),i=t+$*Math.cos(h),c=n+$*Math.sin(h),d=s>180?1:0;return s>=359.5?`M ${t} ${n} L ${o} ${a} A ${$} ${$} 0 1 1 ${t} ${n+$} A ${$} ${$} 0 1 1 ${o} ${a} Z`:`M ${t} ${n} L ${o} ${a} A ${$} ${$} 0 ${d} 1 ${i} ${c} Z`}export{P as g};
//# sourceMappingURL=portfolioPiePath-VUTLM918.js.map
