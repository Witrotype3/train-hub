package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type User struct {
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	HashedPassword string    `json:"hashed_password"`
	Inventory      []string  `json:"inventory"`
	CreatedAt      time.Time `json:"created_at,omitempty"`
	UpdatedAt      time.Time `json:"updated_at,omitempty"`
}

type UserStore struct {
	mu    sync.Mutex
	Users map[string]User `json:"users"`
	file  string
}

func NewUserStore(path string) *UserStore {
	s := &UserStore{Users: map[string]User{}, file: path}
	s.load()
	return s
}

func (s *UserStore) load() {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(s.file)
	if err != nil {
		// file might not exist yet; that's fine
		return
	}
	var users map[string]User
	if err := json.Unmarshal(data, &users); err == nil {
		s.Users = users
	}
}

func (s *UserStore) save() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := json.MarshalIndent(s.Users, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.file, data, 0644)
}

func (s *UserStore) get(email string) (User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.Users[email]
	return u, ok
}

func (s *UserStore) put(u User) error {
	s.mu.Lock()
	s.Users[u.Email] = u
	s.mu.Unlock()
	return s.save()
}

func main() {
	// Serve static files from the client directory
	http.Handle("/", http.FileServer(http.Dir(filepath.Join(getCurrentDir(), "../client"))))

	// Initialize user store
	usersFile := filepath.Join(getCurrentDir(), "users.json")
	store := NewUserStore(usersFile)

	// Initialize handlers
	handlers := NewHandlers(store)

	// Register API routes with middleware
	http.HandleFunc("/api/signup", chainMiddleware(
		handlers.HandleSignup,
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/login", chainMiddleware(
		handlers.HandleLogin,
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/user", chainMiddleware(
		func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				handlers.HandleGetUser(w, r)
			case http.MethodPost:
				handlers.HandleUpdateUser(w, r)
			default:
				respondError(w, "method not allowed", http.StatusMethodNotAllowed)
			}
		},
		corsMiddleware,
		loggingMiddleware,
	))

	// Initialize training store and handlers
	trainingsFile := filepath.Join(getCurrentDir(), "trainings.json")
	trainingStore := NewTrainingStore(trainingsFile)
	uploadPath := filepath.Join(getCurrentDir(), "uploads", "videos")
	trainingHandlers := NewTrainingHandlers(trainingStore, uploadPath)

	// Serve uploaded videos
	http.Handle("/uploads/videos/", http.StripPrefix("/uploads/videos/", http.FileServer(http.Dir(uploadPath))))

	// Training API routes
	http.HandleFunc("/api/trainings", chainMiddleware(
		func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				trainingHandlers.HandleGetTrainings(w, r)
			case http.MethodPost:
				trainingHandlers.HandleCreateTraining(w, r)
			default:
				respondError(w, "method not allowed", http.StatusMethodNotAllowed)
			}
		},
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/training", chainMiddleware(
		trainingHandlers.HandleGetTraining,
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/training/update", chainMiddleware(
		trainingHandlers.HandleUpdateTraining,
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/training/delete", chainMiddleware(
		trainingHandlers.HandleDeleteTraining,
		corsMiddleware,
		loggingMiddleware,
	))

	http.HandleFunc("/api/upload-video", chainMiddleware(
		trainingHandlers.HandleUploadVideo,
		corsMiddleware,
		loggingMiddleware,
	))

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // Default to 3000 for production
	}
	port = ":" + port
	log.Printf("Server running on http://localhost%s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}

func getCurrentDir() string {
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	return dir
}
