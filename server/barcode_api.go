package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// BarcodeProduct represents our internal product model
type BarcodeProduct struct {
	UPC         string `json:"upc"`
	Description string `json:"description"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
	Category    string `json:"category"`
}

// SearchUPCResponse represents the response from SearchUPCData API
type SearchUPCResponse struct {
	ID          string `json:"id"`
	UPC         string `json:"upc"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"imageUrl"`
	Brand       string `json:"brand"`
	Category    string `json:"category"`
	CreatedAt   string `json:"createdAt"`
}

// LookupBarcode queries SearchUPCDATA API for product information
func LookupBarcode(upc string) (*BarcodeProduct, error) {
	if upc == "" {
		return nil, fmt.Errorf("UPC is required")
	}

	apiKey := os.Getenv("SEARCHUPCDATA_API_KEY")
	if apiKey == "" {
		// Fallback key provided by user for immediate use
		apiKey = "upc_65wfglng1s6mkyrbtvd"
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Build the API URL for SearchUPCData (Corrected from documentation)
	// Base URL: https://searchupcdata.com/api
	// Endpoint: /products/:upc
	url := fmt.Sprintf("https://searchupcdata.com/api/products/%s", upc)

	// Make the request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication header (Corrected from documentation: Bearer token)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network error fetching barcode data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, fmt.Errorf("barcode not found in database (404)")
		}
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, fmt.Errorf("barcode API authentication failed (status %d) - check your API key", resp.StatusCode)
		}
		// Read error body for more info if available
		errBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("barcode API returned an unexpected error (status %d): %s", resp.StatusCode, string(errBody))
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Parse JSON response
	var searchResp SearchUPCResponse
	if err := json.Unmarshal(body, &searchResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Map to our internal BarcodeProduct structure
	// We use 'Name' as the primary description for our UI
	product := &BarcodeProduct{
		UPC:         searchResp.UPC,
		Description: searchResp.Name,
		Brand:       searchResp.Brand,
		Category:    searchResp.Category,
	}

	// Return product info
	return product, nil
}
