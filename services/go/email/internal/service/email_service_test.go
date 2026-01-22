package service

import (
	"strings"
	"testing"
)

func TestRenderTemplate(t *testing.T) {
	es := &EmailService{}

	htmlTmpl := "<h1>Hello {{.Name}}</h1><p>Your code is {{.Code}}</p>"
	data := map[string]interface{}{
		"Name": "John Doe",
		"Code": "123456",
	}

	rendered, err := es.RenderTemplate(htmlTmpl, data)
	if err != nil {
		t.Fatalf("Failed to render template: %v", err)
	}

	expectedSubstrings := []string{"Hello John Doe", "Your code is 123456"}
	for _, expected := range expectedSubstrings {
		if !strings.Contains(rendered, expected) {
			t.Errorf("Rendered template does not contain expected string: %s", expected)
		}
	}
}

func TestRenderTemplate_InvalidPlaceholder(t *testing.T) {
	es := &EmailService{}

	htmlTmpl := "<h1>Hello {{.Name}}</h1>"
	data := map[string]interface{}{} // Missing Name

	rendered, err := es.RenderTemplate(htmlTmpl, data)
	if err != nil {
		t.Fatalf("Failed to render template: %v", err)
	}

	if strings.Contains(rendered, "John Doe") {
		t.Errorf("Rendered template should not contain John Doe")
	}

	if !strings.Contains(rendered, "Hello") {
		t.Errorf("Rendered template should still contain Hello")
	}
}
