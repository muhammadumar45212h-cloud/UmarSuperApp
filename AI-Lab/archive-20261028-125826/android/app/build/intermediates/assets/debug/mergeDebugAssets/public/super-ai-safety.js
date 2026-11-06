
window.SAISafety={review(answer){
 if(!answer||!String(answer).trim())return "Meri local knowledge mein iska pakka jawab nahi mila.";
 return String(answer)+"\n\nNote: Zaroori maloomat ko trusted source se verify karein.";
}};
