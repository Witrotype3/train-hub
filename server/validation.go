package main

import (
	"strings"
	"unicode"
)

// validateSignup validates signup request data
func validateSignup(name, email, password string) error {
	if name == "" {
		return &ValidationError{Field: "name", Message: "name is required"}
	}

	if len(name) < 2 || len(name) > 100 {
		return &ValidationError{Field: "name", Message: "name must be between 2 and 100 characters"}
	}

	if email == "" {
		return &ValidationError{Field: "email", Message: "email is required"}
	}

	if !isValidEmail(email) {
		return &ValidationError{Field: "email", Message: "invalid email format"}
	}

	if password == "" {
		return &ValidationError{Field: "password", Message: "password is required"}
	}

	if len(password) < 6 {
		return &ValidationError{Field: "password", Message: "password must be at least 6 characters"}
	}

	if len(password) > 128 {
		return &ValidationError{Field: "password", Message: "password must be less than 128 characters"}
	}

	return nil
}

// isValidEmail performs basic email validation
func isValidEmail(email string) bool {
	if len(email) < 3 || len(email) > 254 {
		return false
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	local, domain := parts[0], parts[1]

	if len(local) == 0 || len(local) > 64 {
		return false
	}

	if len(domain) == 0 || len(domain) > 253 {
		return false
	}

	// Check for at least one dot in domain
	if !strings.Contains(domain, ".") {
		return false
	}

	// Basic character validation
	for _, r := range email {
		if !isValidEmailChar(r) {
			return false
		}
	}

	return true
}

// isValidEmailChar checks if a character is valid in an email
func isValidEmailChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '.' || r == '@' || r == '-' || r == '_' || r == '+'
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

