package main

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Global Secret Keys and Storage
var jwtSecret = []byte("umar_super_secret_key_2026")
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Data Models
type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type VideoItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	Uploader  string    `json:"uploader"`
	Likes     int       `json:"likes"`
	Comments  []Comment `json:"comments"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Text     string `json:"text"`
}

type DirectMessage struct {
	Sender    string    `json:"sender"`
	Receiver  string    `json:"receiver"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// In-Memory Storage
var (
	usersLock sync.RWMutex
	users     = make(map[string]User)

	videosLock sync.RWMutex
	videos     = []VideoItem{}

	clientsLock sync.Mutex
	clients     = make(map[string]*websocket.Conn)
)

func main() {
	r := mux.NewRouter()

	// Public Routes
	r.HandleFunc("/api/register", registerHandler).Methods("POST")
	r.HandleFunc("/api/login", loginHandler).Methods("POST")

	// Protected Routes (JWT required)
	api := r.PathPrefix("/api").Subrouter()
	api.Use(authMiddleware)

	// App 1: Game & App Builder Engine
	api.HandleFunc("/build", buildAppHandler).Methods("POST")

	// App 2: Social Feed (Videos, Likes, Comments)
	api.HandleFunc("/videos", getVideosHandler).Methods("GET")
	api.HandleFunc("/upload-video", uploadVideoHandler).Methods("POST")
	api.HandleFunc("/videos/{id}/like", likeVideoHandler).Methods("POST")
	api.HandleFunc("/videos/{id}/comment", commentVideoHandler).Methods("POST")

	// App 3: Realtime DM WebSocket
	r.HandleFunc("/ws/dm", handleDirectMessages)

	// Static Media Files Directory
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	os.MkdirAll("./uploads", os.ModePerm)
	os.MkdirAll("./builds", os.ModePerm)

	fmt.Println("🚀 Umar Super Backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

// --- JWT Middleware ---
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: Token missing", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized: Invalid Token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if ok {
			ctx := context.WithValue(r.Context(), "userID", claims["userID"])
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	})
}

// --- Auth Handlers ---
func registerHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)

	usersLock.Lock()
	if _, exists := users[user.Username]; exists {
		usersLock.Unlock()
		http.Error(w, "User already exists", http.StatusBadRequest)
		return
	}
	user.ID = fmt.Sprintf("usr_%d", time.Now().UnixNano())
	users[user.Username] = user
	usersLock.Unlock()

	json.NewEncoder(w).Encode(map[string]string{"message": "Registration successful"})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds User
	json.NewDecoder(r.Body).Decode(&creds)

	usersLock.RLock()
	user, exists := users[creds.Username]
	usersLock.RUnlock()

	if !exists || user.Password != creds.Password {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID":   user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, _ := token.SignedString(jwtSecret)
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString, "username": user.Username})
}

// --- App 1: Builder Engine ---
func buildAppHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AppName string `json:"app_name"`
		Type    string `json:"type"` // "game" or "developer_tool"
	}
	json.NewDecoder(r.Body).Decode(&req)

	outputBinary := filepath.Join(".", "builds", req.AppName)
	
	// Example Go Build Command
	cmd := exec.Command("go", "build", "-o", outputBinary, "./main.go")
	err := cmd.Run()
	if err != nil {
		http.Error(w, "Build failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"path":   outputBinary,
		"msg":    "App dynamic binary compiled successfully",
	})
}

// --- App 2: Social & Video Feed ---
func getVideosHandler(w http.ResponseWriter, r *http.Request) {
	videosLock.RLock()
	defer videosLock.RUnlock()
	json.NewEncoder(w).Encode(videos)
}

func uploadVideoHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(50 << 20) // 50MB max limit

	file, header, err := r.FormFile("video")
	if err != nil {
		http.Error(w, "File upload error", http.StatusBadRequest)
		return
	}
	defer file.Close()

	title := r.FormValue("title")
	userID := r.Context().Value("userID").(string)

	filePath := filepath.Join("./uploads", header.Filename)
	out, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Unable to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()
	out.ReadFrom(file)

	newVideo := VideoItem{
		ID:        fmt.Sprintf("vid_%d", time.Now().UnixNano()),
		Title:     title,
		URL:       "/uploads/" + header.Filename,
		Uploader:  userID,
		Likes:     0,
		Comments:  []Comment{},
		CreatedAt: time.Now(),
	}

	videosLock.Lock()
	videos = append([]VideoItem{newVideo}, videos...) // Newest first
	videosLock.Unlock()

	json.NewEncoder(w).Encode(newVideo)
}

func likeVideoHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	vID := vars["id"]

	videosLock.Lock()
	defer videosLock.Unlock()

	for i := range videos {
		if videos[i].ID == vID {
			videos[i].Likes++
			json.NewEncoder(w).Encode(videos[i])
			return
		}
	}
	http.Error(w, "Video not found", http.StatusNotFound)
}

func commentVideoHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	vID := vars["id"]

	var comm Comment
	json.NewDecoder(r.Body).Decode(&comm)
	comm.ID = fmt.Sprintf("cmt_%d", time.Now().UnixNano())

	videosLock.Lock()
	defer videosLock.Unlock()

	for i := range videos {
		if videos[i].ID == vID {
			videos[i].Comments = append(videos[i].Comments, comm)
			json.NewEncoder(w).Encode(videos[i])
			return
		}
	}
	http.Error(w, "Video not found", http.StatusNotFound)
}

// --- App 3: WebSockets Direct Messaging (DM) ---
func handleDirectMessages(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	userID := r.URL.Query().Get("user_id")
	clientsLock.Lock()
	clients[userID] = conn
	clientsLock.Unlock()

	for {
		var msg DirectMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			clientsLock.Lock()
			delete(clients, userID)
			clientsLock.Unlock()
			break
		}
		msg.Timestamp = time.Now()

		clientsLock.Lock()
		recipientConn, exists := clients[msg.Receiver]
		if exists {
			recipientConn.WriteJSON(msg)
		}
		clientsLock.Unlock()
	}
}
