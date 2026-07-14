async function signUp(email, password) {
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (user) alert("Signup successful!");
}

async function signIn(email, password) {
    const { user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (user) window.location.href = "home.html"; // Login ke baad home par bhej dein
}
