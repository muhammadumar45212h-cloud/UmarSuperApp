console.log("Super App Started");

let likes=0;

function addLike(){
likes++;
alert("Likes: "+likes);
}

function openChat(){
alert("Chat opening...");
}

function openAI(){
alert("AI Assistant loading...");
}

function openTrading(){
alert("Trading page opening...");
}

function openWallet(){
alert("Wallet opening...");
}

function openProfile(){
alert("Profile opening...");
}

function uploadVideo(){
alert("Upload screen opening...");
}

document.addEventListener("DOMContentLoaded",()=>{

let feed=document.querySelector(".feed");

feed.innerHTML=`
<div>
🚀 Super App Ready
<br><br>
Future AI + Video + Wallet + Trading
</div>
`;

});
