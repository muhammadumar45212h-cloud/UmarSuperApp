
window.SAISimilarity={score(a,b){
 const A=new Set(window.SAINormalizer.tokens(a)),B=new Set(window.SAINormalizer.tokens(b));
 if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;
 return 2*n/(A.size+B.size);
},best(q,items){let item=null,score=0;for(const x of items){
 const s=this.score(q,x.question);if(s>score){item=x;score=s;}}
 return {item,score};
}};
