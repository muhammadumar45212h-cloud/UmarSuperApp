
window.SAIMath={calculate(s){
 s=String(s).trim().replace(/,/g,"");
 if(s.length>80||!/^[\d\s.+*/%()\-]+$/.test(s)||!/\d/.test(s)||!/[+\-*/%]/.test(s))return null;
 const t=s.match(/\d+(?:\.\d+)?|[()+*/%\-]/g);
 if(!t||t.join("")!==s.replace(/\s/g,""))return null;
 let i=0;
 function f(){if(t[i]==="-"){i++;return-f();}if(t[i]==="+"){i++;return f();}
 if(t[i]==="("){i++;let n=e();if(t[i++]!==")")throw 0;return n;}
 let x=t[i++];if(!x||!/^\d/.test(x))throw 0;return +x;}
 function m(){let n=f();while(["*","/","%"].includes(t[i])){
 let o=t[i++],r=f();if((o==="/"||o==="%")&&!r)throw 0;
 n=o==="*"?n*r:o==="/"?n/r:n%r;}return n;}
 function e(){let n=m();while(t[i]==="+"||t[i]==="-"){
 let o=t[i++],r=m();n=o==="+"?n+r:n-r;}return n;}
 try{let n=e();return i===t.length&&Number.isFinite(n)?"Jawab: "+n:null;}catch(_){return null;}
}};
