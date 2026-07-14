// Function to handle signup/login
function handleAuth() {
    const phone = document.getElementById('phoneInput').value;
    const password = document.getElementById('passwordInput').value;

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[phone]) {
        if (users[phone].password === password) {
            alert("Login Successful!");
            localStorage.setItem('currentUser', phone);
            loadUserProfile(phone);
        } else {
            alert("Wrong Password!");
        }
    } else {
        users[phone] = { password: password, profileData: { name: "New User", bio: "" } };
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', phone);
        alert("Account Created Successfully!");
        loadUserProfile(phone);
    }
}

// Function to load specific user's profile
function loadUserProfile(phone) {
    const users = JSON.parse(localStorage.getItem('users'));
    const userData = users[phone];
    console.log("Loading profile for:", phone);
}
