const S="15시 30분 이후로는 거래를 할 수 없습니다.";function e(t=new Date){return((t.getUTCHours()*60+t.getUTCMinutes()+t.getUTCSeconds()/60+540)%1440+1440)%1440}function T(t){const n=e(new Date);return n>=540&&n<930}export{S as T,T as i};
//# sourceMappingURL=tradingHours-C3av8XIL.js.map
