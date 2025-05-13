// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMldQ1ZlHE2sSfbMNcfj7IlY6ZJ5njvdU",
  authDomain: "untrace-final.firebaseapp.com",
  projectId: "untrace-final",
  storageBucket: "untrace-final.firebasestorage.app",
  messagingSenderId: "826975738444",
  appId: "1:826975738444:web:77b7a5fcfb9acdc46c72e9"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Check if user is logged in and update UI
auth.onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('userStatus').innerText = `Welcome, ${user.email}`;
  } else {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('userStatus').style.display = 'none';
  }
});

// Login form submit
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById('loginMessage').innerText = "Login successful!";
    })
    .catch((error) => {
      document.getElementById('loginMessage').innerText = "Login failed: " + error.message;
    });
});

// Register form submit
document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById('registerMessage').innerText = "Registration successful! You can now log in.";
    })
    .catch((error) => {
      document.getElementById('registerMessage').innerText = "Registration failed: " + error.message;
    });
});

// Convert text function (Cyrillic replacement)
function convertText() {
  const text = document.getElementById('inputText').value;
  const replacements = { 'a': 'а', 'c': 'с', 'd': 'ԁ', 'p': 'р', 'e': 'е' };
  const output = text.replace(/[acdep]/g, (letter) => replacements[letter] || letter);
  document.getElementById('outputText').value = output;
}