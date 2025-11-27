package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		logError("failed to encode JSON response", err)
	}
}

// respondError sends an error response
func respondError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	respondJSON(w, map[string]string{"error": message})
}

// logError logs an error
func logError(message string, err error) {
	if err != nil {
		log.Printf("ERROR: %s: %v", message, err)
	} else {
		log.Printf("ERROR: %s", message)
	}
}

