<script>

let liked=false;
let likes=0;

let history=[];

function like(){

if(!liked){

likes++;
liked=true;

document.getElementById("likes").innerText=likes;

history.push(
"❤️ Someone liked your post"
);

}else{

alert("Already liked");

}

}

function comment(){

let msg=prompt(
"Write comment"
);

if(msg){

history.push(
"💬 Comment: "+msg
);

alert("Comment added");

}

}

function sharePost(){

history.push(
"↗ Shared post"
);

alert("Post shared");

}

function sub(){

history.push(
"🔵 Someone subscribed"
);

alert("Subscribed");

}

function profile(){

alert(
"Profile opening"
);

}

function notification(){

if(history.length==0){

alert(
"No history"
);

return;

}

alert(
history.join("\n")
);

}

function upload(){

alert(
"Video upload opening"
);

}

function goHome(){

alert("Home");

}

function trending(){

alert("Trending");

}

function messages(){

alert("Messages");

}

function trading(){

alert("Trading");

}

function wallet(){

alert("Wallet");

}

function settings(){

alert("Settings");

}

function search(){

alert("Search");

}

function live(){

alert("Live");

}

</script>
