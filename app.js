import { supabase } from "./supabase.js";

let likedPosts = new Set(); 

async function createPost() {
    const desc = prompt("Write description");
    if (!desc) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Login first");
        return;
    }

    const { error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, description: desc });

    if (error) {
        console.error("Upload error:", error);
        alert("Post failed");
        return;
    }

    alert("Post uploaded");
    loadFeed();
}

async function loadFeed() {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    const feedContainer = document.getElementById("Feed");
    if (!feedContainer) return;
    
    feedContainer.innerHTML = ""; 

    data.forEach(post => {
        const card = document.createElement("div");
        card.className = "post-card";

        const h3 = document.createElement("h3");
        h3.textContent = post.description;

        const likeBtn = document.createElement("button");
        likeBtn.onclick = () => likePost(post.id);
        likeBtn.innerHTML = `Like-<span id="Like-${post.id}">${post.likes || 0}</span>`;

        card.appendChild(h3);
        card.appendChild(likeBtn);
        feedContainer.appendChild(card);
    });
}

function likePost(id) {
    if (likedPosts.has(id)) {
        alert("Already liked");
        return;
    }

    likedPosts.add(id);
    const el = document.getElementById(`Like-${id}`);
    if (el) {
        let currentLikes = parseInt(el.innerText) || 0;
        el.innerText = currentLikes + 1;
    }
}

window.onload = loadFeed;
