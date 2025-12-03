package main

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

// ContentBlock represents a single content element in a training
type ContentBlock struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"` // title, text, video, image, code, list, quote, divider
	Order   int                    `json:"order"`
	Content map[string]interface{} `json:"content"` // Flexible content based on type
}

// Training represents a training module
type Training struct {
	ID           string         `json:"id"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	ThumbnailURL string         `json:"thumbnail_url,omitempty"` // Path to uploaded thumbnail image
	Blocks       []ContentBlock `json:"blocks,omitempty"`        // Array of ordered content blocks
	CreatedBy    string         `json:"created_by"`              // Email of creator
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    *time.Time     `json:"deleted_at,omitempty"` // Soft delete timestamp
}

// TrainingStore manages training data
type TrainingStore struct {
	mu        sync.Mutex
	Trainings map[string]Training `json:"trainings"`
	file      string
}

// NewTrainingStore creates a new training store
func NewTrainingStore(path string) *TrainingStore {
	s := &TrainingStore{Trainings: map[string]Training{}, file: path}
	s.load()
	return s
}

func (s *TrainingStore) load() {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := os.ReadFile(s.file)
	if err != nil {
		// file might not exist yet; that's fine
		return
	}
	var trainings map[string]Training
	if err := json.Unmarshal(data, &trainings); err == nil {
		s.Trainings = trainings
	}
}

func (s *TrainingStore) save() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, err := json.MarshalIndent(s.Trainings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.file, data, 0644)
}

func (s *TrainingStore) get(id string) (Training, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.Trainings[id]
	return t, ok
}

func (s *TrainingStore) getAll() []Training {
	s.mu.Lock()
	defer s.mu.Unlock()
	trainings := make([]Training, 0, len(s.Trainings))
	for _, t := range s.Trainings {
		// Only return non-deleted trainings
		if t.DeletedAt == nil {
			trainings = append(trainings, t)
		}
	}
	return trainings
}

func (s *TrainingStore) getDeletedByUser(email string) []Training {
	s.mu.Lock()
	defer s.mu.Unlock()
	trainings := make([]Training, 0)
	for _, t := range s.Trainings {
		// Only return deleted trainings by this user
		if t.DeletedAt != nil && t.CreatedBy == email {
			trainings = append(trainings, t)
		}
	}
	return trainings
}

func (s *TrainingStore) put(t Training) error {
	s.mu.Lock()
	s.Trainings[t.ID] = t
	s.mu.Unlock()
	return s.save()
}

func (s *TrainingStore) delete(id string) error {
	s.mu.Lock()
	delete(s.Trainings, id)
	s.mu.Unlock()
	return s.save()
}
