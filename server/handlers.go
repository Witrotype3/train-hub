package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// APIResponse represents a standard API response
type APIResponse struct {
	OK    bool        `json:"ok"`
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
}

// SignupRequest represents the signup request payload
type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserUpdateRequest represents the user update request payload
type UserUpdateRequest struct {
	Email            string          `json:"email"`
	Inventory        []InventoryItem `json:"inventory,omitempty"`
	DeletedInventory []InventoryItem `json:"deleted_inventory,omitempty"`
}

// Handlers contains all HTTP handlers
type Handlers struct {
	store *UserStore
}

// NewHandlers creates a new Handlers instance
func NewHandlers(store *UserStore) *Handlers {
	return &Handlers{store: store}
}

// HandleSignup handles user registration
func (h *Handlers) HandleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	email := strings.ToLower(strings.TrimSpace(req.Email))
	name := strings.TrimSpace(req.Name)
	password := strings.TrimSpace(req.Password)

	if err := validateSignup(name, email, password); err != nil {
		respondJSON(w, map[string]interface{}{"ok": false, "error": err.Error()})
		return
	}

	// Check if user exists
	if _, ok := h.store.get(email); ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "account already exists"})
		return
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logError("password hashing failed", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "internal server error"})
		return
	}

	// Create user
	user := User{
		Name:             name,
		Email:            email,
		HashedPassword:   string(hashed),
		Inventory:        []InventoryItem{},
		DeletedInventory: []InventoryItem{},
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := h.store.put(user); err != nil {
		logError("failed to save user", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to create account"})
		return
	}

	// Return in format expected by client
	respondJSON(w, map[string]interface{}{
		"ok": true,
		"user": map[string]string{
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

// HandleLogin handles user authentication
func (h *Handlers) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)

	if email == "" || password == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "email and password required"})
		return
	}

	// Get user
	u, ok := h.store.get(email)
	if !ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "invalid credentials"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(u.HashedPassword), []byte(password)); err != nil {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "invalid credentials"})
		return
	}

	// Return in format expected by client
	respondJSON(w, map[string]interface{}{
		"ok": true,
		"user": map[string]string{
			"name":  u.Name,
			"email": u.Email,
		},
	})
}

// HandleGetUser handles getting user data
func (h *Handlers) HandleGetUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("email")))
	if email == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "email required"})
		return
	}

	u, ok := h.store.get(email)
	if !ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "user not found"})
		return
	}

	// Return in format expected by client
	respondJSON(w, map[string]interface{}{
		"ok": true,
		"user": map[string]interface{}{
			"name":      u.Name,
			"email":     u.Email,
			"inventory": u.Inventory,
		},
	})
}

// HandleUpdateUser handles updating user data
func (h *Handlers) HandleUpdateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UserUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "email required"})
		return
	}

	// Validate inventory
	if len(req.Inventory) > 1000 {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "inventory too large (max 1000 items)"})
		return
	}

	// Get user
	u, ok := h.store.get(email)
	if !ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "user not found"})
		return
	}

	// Update inventory
	if req.Inventory != nil {
		u.Inventory = req.Inventory
	}
	// Update deleted inventory
	if req.DeletedInventory != nil {
		u.DeletedInventory = req.DeletedInventory
	}
	u.UpdatedAt = time.Now()

	if err := h.store.put(u); err != nil {
		logError("failed to update user", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to update"})
		return
	}

	respondJSON(w, map[string]interface{}{"ok": true})
}

// HandleGetAllInventories handles getting all users' inventories
func (h *Handlers) HandleGetAllInventories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users := h.store.getAllUsers()

	// Create response with only necessary fields (no passwords)
	type UserInventoryInfo struct {
		Name      string          `json:"name"`
		Email     string          `json:"email"`
		Inventory []InventoryItem `json:"inventory"`
	}

	inventories := make([]UserInventoryInfo, 0, len(users))
	for _, u := range users {
		inventories = append(inventories, UserInventoryInfo{
			Name:      u.Name,
			Email:     u.Email,
			Inventory: u.Inventory,
		})
	}

	respondJSON(w, map[string]interface{}{
		"ok":          true,
		"inventories": inventories,
	})
}
