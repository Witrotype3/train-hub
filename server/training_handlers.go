package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// TrainingRequest represents a training creation/update request
type TrainingRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	VideoURL    string `json:"video_url,omitempty"`
}

// TrainingHandlers contains all training-related HTTP handlers
type TrainingHandlers struct {
	store      *TrainingStore
	uploadPath string
}

// NewTrainingHandlers creates a new TrainingHandlers instance
func NewTrainingHandlers(store *TrainingStore, uploadPath string) *TrainingHandlers {
	// Ensure upload directory exists
	os.MkdirAll(uploadPath, 0755)
	return &TrainingHandlers{store: store, uploadPath: uploadPath}
}

// HandleCreateTraining handles training creation
func (h *TrainingHandlers) HandleCreateTraining(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get creator email from query or header (in real app, use auth token)
	createdBy := r.URL.Query().Get("email")
	if createdBy == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "email required"})
		return
	}

	var req TrainingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	content := strings.TrimSpace(req.Content)

	if title == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "title is required"})
		return
	}

	if len(title) > 200 {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "title too long (max 200 characters)"})
		return
	}

	// Create training
	training := Training{
		ID:          uuid.New().String(),
		Title:       title,
		Description: description,
		Content:     content,
		VideoURL:    req.VideoURL,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.store.put(training); err != nil {
		logError("failed to save training", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to create training"})
		return
	}

	respondJSON(w, map[string]interface{}{
		"ok": true,
		"training": training,
	})
}

// HandleGetTrainings handles getting all trainings
func (h *TrainingHandlers) HandleGetTrainings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	trainings := h.store.getAll()
	respondJSON(w, map[string]interface{}{
		"ok":        true,
		"trainings": trainings,
	})
}

// HandleGetTraining handles getting a single training
func (h *TrainingHandlers) HandleGetTraining(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "id required"})
		return
	}

	training, ok := h.store.get(id)
	if !ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "training not found"})
		return
	}

	respondJSON(w, map[string]interface{}{
		"ok":       true,
		"training": training,
	})
}

// HandleUpdateTraining handles training updates
func (h *TrainingHandlers) HandleUpdateTraining(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ID          string `json:"id"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Content     string `json:"content"`
		VideoURL    string `json:"video_url,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	training, ok := h.store.get(req.ID)
	if !ok {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "training not found"})
		return
	}

	// Update fields
	if req.Title != "" {
		training.Title = strings.TrimSpace(req.Title)
	}
	if req.Description != "" {
		training.Description = strings.TrimSpace(req.Description)
	}
	if req.Content != "" {
		training.Content = strings.TrimSpace(req.Content)
	}
	if req.VideoURL != "" {
		training.VideoURL = req.VideoURL
	}
	training.UpdatedAt = time.Now()

	if err := h.store.put(training); err != nil {
		logError("failed to update training", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to update training"})
		return
	}

	respondJSON(w, map[string]interface{}{
		"ok":       true,
		"training": training,
	})
}

// HandleDeleteTraining handles training deletion
func (h *TrainingHandlers) HandleDeleteTraining(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.store.delete(req.ID); err != nil {
		logError("failed to delete training", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to delete training"})
		return
	}

	respondJSON(w, map[string]interface{}{"ok": true})
}

// HandleUploadVideo handles video file uploads
func (h *TrainingHandlers) HandleUploadVideo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 50MB)
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "file too large or invalid"})
		return
	}

	file, handler, err := r.FormFile("video")
	if err != nil {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "no file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	contentType := handler.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "video/") {
		respondJSON(w, map[string]interface{}{"ok": false, "error": "file must be a video"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s_%s", uuid.New().String(), handler.Filename)
	uploadFilePath := filepath.Join(h.uploadPath, filename)

	// Create file
	dst, err := os.Create(uploadFilePath)
	if err != nil {
		logError("failed to create file", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to save file"})
		return
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, file); err != nil {
		logError("failed to copy file", err)
		respondJSON(w, map[string]interface{}{"ok": false, "error": "failed to save file"})
		return
	}

	// Return file URL
	videoURL := fmt.Sprintf("/uploads/videos/%s", filename)
	respondJSON(w, map[string]interface{}{
		"ok":       true,
		"video_url": videoURL,
	})
}

