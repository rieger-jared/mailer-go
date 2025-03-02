package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// Config for the GmailClientService
type GmailConfig struct {
	CredentialsPath string
	TokenPath       string
	RedirectURL     string
}

// GmailClientService is a Wails3 service for Gmail API operations
type GmailClientService struct {
	config      *GmailConfig
	oauthConfig *oauth2.Config
	client      *http.Client
	service     *gmail.Service
	logger      *log.Logger
	ctx         context.Context
	isAuthed    bool
	authURL     string
}

// NewGmailClientService creates a new Gmail client service
func NewGmailClientService() *GmailClientService {
	// Get the executable directory to find credentials.json
	execDir, err := os.Executable()
	if err != nil {
		execDir = "."
	}
	execDir = filepath.Dir(execDir)

	// Determine home directory for token storage
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = execDir
	}

	// Create token directory if it doesn't exist
	tokenDir := filepath.Join(homeDir, ".gmail-client")
	if _, err := os.Stat(tokenDir); os.IsNotExist(err) {
		os.MkdirAll(tokenDir, 0700)
	}

	return &GmailClientService{
		config: &GmailConfig{
			CredentialsPath: "credentials.json", // Will look for this in the current directory
			TokenPath:       filepath.Join(tokenDir, "token.json"),
			RedirectURL:     "http://localhost",
		},
		logger:   log.New(os.Stdout, "[GmailClientService] ", log.LstdFlags),
		isAuthed: false,
	}
}

// ServiceName returns the name of the service
func (g *GmailClientService) ServiceName() string {
	return "GmailClientService"
}

// ServiceStartup initializes the Gmail client service
func (g *GmailClientService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	panic("here int he service startup")
	log.Println("here in the service");
	g.ctx = ctx
	g.logger.Println("Starting Gmail client service")
	g.logger.Printf("Using credentials file: %s", g.config.CredentialsPath)
	g.logger.Printf("Using token file: %s", g.config.TokenPath)

	// Load client secrets from file
	b, err := os.ReadFile(g.config.CredentialsPath)
	if err != nil {
		g.logger.Printf("Unable to read client secret file: %v", err)
		// Try to find credentials.json in different locations
		alternativePaths := []string{
			"./credentials.json",
			"../credentials.json",
			filepath.Join(filepath.Dir(os.Args[0]), "credentials.json"),
		}

		for _, path := range alternativePaths {
			g.logger.Printf("Trying alternative path: %s", path)
			if b, err = os.ReadFile(path); err == nil {
				g.config.CredentialsPath = path
				g.logger.Printf("Found credentials at: %s", path)
				break
			}
		}

		if err != nil {
			return fmt.Errorf("unable to read client secret file from any location: %v", err)
		}
	}

	// Configure the OAuth client
	g.oauthConfig, err = google.ConfigFromJSON(b, gmail.GmailReadonlyScope)
	if err != nil {
		g.logger.Printf("Unable to parse client secret file to config: %v", err)
		return err
	}

	// Ensure the redirect URL is set correctly
	if g.oauthConfig.RedirectURL == "" {
		g.oauthConfig.RedirectURL = g.config.RedirectURL
	}

	// Generate auth URL for frontend redirection if needed
	g.authURL = g.oauthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	g.logger.Printf("Auth URL: %s", g.authURL)

	// Try to get existing token
	token, err := g.tokenFromFile(g.config.TokenPath)
	if err == nil {
		// We have a valid token, initialize the client
		g.client = g.oauthConfig.Client(ctx, token)

		// Initialize Gmail service
		g.service, err = gmail.NewService(ctx, option.WithHTTPClient(g.client))
		if err != nil {
			g.logger.Printf("Unable to create Gmail service: %v", err)
			return err
		}

		// Verify the token is still valid by making a simple API call
		_, err = g.service.Users.GetProfile("me").Do()
		if err != nil {
			g.logger.Printf("Token validation failed: %v", err)
			g.isAuthed = false
			// Remove invalid token
			os.Remove(g.config.TokenPath)
		} else {
			g.isAuthed = true
			g.logger.Println("Gmail client service initialized with existing token")
		}
	} else {
		g.logger.Println("No valid token found, authentication required")
		g.isAuthed = false
	}

	return nil
}

// ServiceShutdown cleans up resources
func (g *GmailClientService) ServiceShutdown() error {
	g.logger.Println("Shutting down Gmail client service")
	return nil
}

// IsAuthenticated checks if the user is authenticated
func (g *GmailClientService) IsAuthenticated() bool {
	return g.isAuthed
}

// GetAuthURL returns the URL for OAuth authentication
func (g *GmailClientService) GetAuthURL() string {
	return g.authURL
}

// CompleteAuth completes the authentication process with the provided code
func (g *GmailClientService) CompleteAuth(authCode string) (bool, error) {
	if authCode == "" {
		return false, fmt.Errorf("authorization code is empty")
	}

	g.logger.Printf("Completing auth with code: %s", authCode)

	// If the user pasted the entire URL, extract just the code
	if authCode != "" && (authCode[0] == 'h' || authCode[0] == 'H') && len(authCode) > 10 {
		// Check if it looks like a URL
		if strings.HasPrefix(strings.ToLower(authCode), "http") {
			g.logger.Println("Detected URL in auth code, attempting to extract code parameter")

			// Try to parse the URL
			parsedURL, err := url.Parse(authCode)
			if err == nil {
				// Get the code from the query parameters
				queryParams, err := url.ParseQuery(parsedURL.RawQuery)
				if err == nil && queryParams.Get("code") != "" {
					extractedCode := queryParams.Get("code")
					g.logger.Printf("Extracted code from URL: %s", extractedCode)
					authCode = extractedCode
				}
			}
		}
	}

	tok, err := g.oauthConfig.Exchange(g.ctx, authCode)
	if err != nil {
		g.logger.Printf("Unable to retrieve token from web: %v", err)
		return false, err
	}

	// Save the token for future use
	err = g.saveToken(g.config.TokenPath, tok)
	if err != nil {
		g.logger.Printf("Unable to save token: %v", err)
		return false, err
	}

	// Initialize client with the new token
	g.client = g.oauthConfig.Client(g.ctx, tok)

	// Initialize Gmail service
	g.service, err = gmail.NewService(g.ctx, option.WithHTTPClient(g.client))
	if err != nil {
		g.logger.Printf("Unable to create Gmail service: %v", err)
		return false, err
	}

	g.isAuthed = true
	g.logger.Println("Authentication completed successfully")

	return true, nil
}

// GetLabels retrieves Gmail labels for the authenticated user
func (g *GmailClientService) GetLabels() ([]string, error) {
	if !g.isAuthed {
		return nil, fmt.Errorf("not authenticated")
	}

	user := "me"
	r, err := g.service.Users.Labels.List(user).Do()
	if err != nil {
		g.logger.Printf("Unable to retrieve labels: %v", err)
		return nil, err
	}

	labels := make([]string, len(r.Labels))
	for i, l := range r.Labels {
		labels[i] = l.Name
	}

	return labels, nil
}

// OpenBrowser opens a browser to the specified URL
func (g *GmailClientService) OpenBrowser(url string) error {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = execCommand("xdg-open", url)
	case "windows":
		err = execCommand("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		err = execCommand("open", url)
	default:
		err = fmt.Errorf("unsupported platform")
	}

	return err
}

// execCommand executes the named program with the given arguments
func execCommand(cmd string, args ...string) error {
	command := exec.Command(cmd, args...)
	return command.Start()
}

// tokenFromFile retrieves a token from a local file
func (g *GmailClientService) tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// saveToken saves a token to a file path
func (g *GmailClientService) saveToken(path string, token *oauth2.Token) error {
	g.logger.Printf("Saving credential file to: %s\n", path)

	// Ensure directory exists
	dir := filepath.Dir(path)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return err
		}
	}

	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(token)
}

// OpenAuthURL opens the authentication URL in the default browser
func (g *GmailClientService) OpenAuthURL() (string, error) {
	if g.authURL == "" {
		return "", fmt.Errorf("auth URL not initialized")
	}

	err := g.OpenBrowser(g.authURL)
	if err != nil {
		g.logger.Printf("Failed to open browser: %v", err)
		return g.authURL, err
	}

	return g.authURL, nil
}

// Logout logs the user out by clearing the token and resetting the service
func (g *GmailClientService) Logout() (bool, error) {
	g.logger.Println("Logging out user")

	// Reset authentication state
	g.isAuthed = false
	g.authURL = ""
	g.client = nil
	g.service = nil

	// Remove the token file if it exists
	if _, err := os.Stat(g.config.TokenPath); err == nil {
		err = os.Remove(g.config.TokenPath)
		if err != nil {
			g.logger.Printf("Error removing token file: %v", err)
			return false, fmt.Errorf("failed to remove token file: %w", err)
		}
		g.logger.Println("Token file removed successfully")
	} else {
		g.logger.Println("Token file not found, nothing to remove")
	}

	return true, nil
}

// RegenerateAuthURL regenerates the authentication URL
func (g *GmailClientService) RegenerateAuthURL() (string, error) {
	if g.oauthConfig == nil {
		return "", fmt.Errorf("OAuth config not initialized")
	}

	// Generate a new auth URL
	g.authURL = g.oauthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	g.logger.Printf("Regenerated Auth URL: %s", g.authURL)

	return g.authURL, nil
}
